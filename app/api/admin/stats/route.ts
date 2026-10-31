import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";

type Transaction = {
  id: string;
  user_id: string | null;
  amount: number;
  status: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 403 });

  const rows: Transaction[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await serverSupabase
      .from("transactions")
      .select("id,user_id,amount,status,description,metadata,created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) return NextResponse.json({ success: false, error: "Không tải được số liệu giao dịch." }, { status: 503 });
    rows.push(...((data || []) as Transaction[]));
    if (!data || data.length < pageSize) break;
  }

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const paid = rows.filter((row) => row.status === "success");
  // Wallet deposits are paid income too; keep their subtotal separately below.
  const revenueRows = paid;
  const walletTopups = paid.filter((row) => row.metadata?.type === "wallet_topup");
  const sum = (items: Transaction[]) => items.reduce((total, row) => total + Number(row.amount || 0), 0);
  const revenueToday = revenueRows.filter((row) => new Date(row.created_at) >= startOfToday);
  const revenueMonth = revenueRows.filter((row) => new Date(row.created_at) >= startOfMonth);
  const pending = rows.filter((row) => row.status === "pending");

  const daily = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(startOfToday);
    day.setDate(day.getDate() - (6 - index));
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const items = revenueRows.filter((row) => {
      const date = new Date(row.created_at);
      return date >= day && date < nextDay;
    });
    return { date: day.toISOString(), revenue: sum(items), orders: items.length };
  });

  const { count: productCount, error: productError } = await serverSupabase
    .from("products").select("id", { count: "exact", head: true }).eq("is_active", true);
  if (productError) return NextResponse.json({ success: false, error: "Không tải được số liệu tổng quan." }, { status: 503 });

  return NextResponse.json({
    success: true,
    metrics: {
      lifetimeRevenue: sum(revenueRows),
      todayRevenue: sum(revenueToday),
      todayOrders: revenueToday.length,
      monthRevenue: sum(revenueMonth),
      monthOrders: revenueMonth.length,
      paidOrders: revenueRows.length,
      pendingOrders: pending.length,
      pendingAmount: sum(pending),
      walletTopups: sum(walletTopups),
      activeProducts: productCount || 0,
      customers: new Set(rows.map((row) => row.user_id).filter((id): id is string => Boolean(id))).size,
    },
    daily,
    recent: rows.slice(0, 12),
    generatedAt: now.toISOString(),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
