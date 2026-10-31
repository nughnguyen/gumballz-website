import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
export const dynamic = "force-dynamic";

const mask = (value: string) => {
  const clean = value.trim();
  if (!clean) return "Khách ***";
  return `${Array.from(clean)[0]}***`;
};

export async function GET() {
  const { data, error } = await serverSupabase.from("transactions")
    .select("user_id,amount,metadata,created_at")
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(15);
  if (error) return NextResponse.json({ success: true, data: [] }, { headers: { "Cache-Control": "public,max-age=15" } });
  const userIds = [...new Set((data || []).map(row => row.user_id).filter((id): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)))];
  const users = await Promise.all(userIds.map(async id => {
    const { data: result } = await serverSupabase.auth.admin.getUserById(id);
    const user = result.user;
    const display = typeof user?.user_metadata?.username === "string" ? user.user_metadata.username : user?.email?.split("@")[0] || "";
    return [id, mask(display)] as const;
  }));
  const names = new Map(users);
  const transactions = (data || []).map(row => ({
    username: names.get(row.user_id) || "Khách ***",
    amount: Number(row.amount) || 0,
    title: String(row.metadata?.offer_title || row.metadata?.product_title || row.metadata?.prize_label || "Giao dịch"),
    created_at: row.created_at,
  }));
  return NextResponse.json({ success: true, data: transactions }, { headers: { "Cache-Control": "public,max-age=15,stale-while-revalidate=30" } });
}
