import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { getAuthenticatedUser } from "@/app/utils/adminAuth";
import { checkRateLimit, rateLimitResponse } from "@/app/utils/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const [{ data: account, error: accountError }, { data: ledger, error: ledgerError }] = await Promise.all([
    serverSupabase.from("wallet_accounts").select("balance").eq("user_id", user.id).maybeSingle(),
    serverSupabase.from("wallet_ledger").select("id,amount,entry_type,description,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  if (accountError || ledgerError) return NextResponse.json({ success: false, error: "Wallet is unavailable" }, { status: 503 });
  return NextResponse.json({ success: true, balance: account?.balance ?? 0, ledger: ledger || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (user) {
    const rate = await checkRateLimit(request, 'wallet-topup', 5, 3600);
    if (!rate.allowed) return rateLimitResponse(rate);
  }
  if (!user) return NextResponse.json({ success: false, error: "Đăng nhập để nạp tiền vào ví." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const amount = body?.amount;
  if (!Number.isSafeInteger(amount) || amount < 10000 || amount > 20000000 || amount % 1000 !== 0) {
    return NextResponse.json({ success: false, error: "Số tiền nạp từ 10.000đ đến 20.000.000đ, theo bội số 1.000đ." }, { status: 400 });
  }

  const { count, error: pendingError } = await serverSupabase.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending").eq("metadata->>type", "wallet_topup");
  if (pendingError) return NextResponse.json({ success: false, error: "Không kiểm tra được các giao dịch đang chờ." }, { status: 503 });
  if ((count || 0) >= 3) return NextResponse.json({ success: false, error: "Bạn đang có 3 giao dịch nạp chờ xác nhận. Hãy hoàn tất hoặc chờ hết hạn trước." }, { status: 429 });

  const content = `GZ${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  const { data: transaction, error } = await serverSupabase.from("transactions").insert({
    user_id: user.id,
    amount,
    description: content,
    status: "pending",
    rewarded: false,
    method: "Banking",
    metadata: { type: "wallet_topup", method: "Banking" },
  }).select("id").single();

  if (error || !transaction) return NextResponse.json({ success: false, error: "Không tạo được giao dịch nạp ví." }, { status: 500 });
  return NextResponse.json({ success: true, id: transaction.id, amount, content, expiry: Math.floor(Date.now() / 1000) + 600 });
}
