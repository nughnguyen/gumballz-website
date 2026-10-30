import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { checkRateLimit, rateLimitResponse } from "@/app/utils/rateLimit";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const rate = await checkRateLimit(request, 'payment-details', 15, 60);
  if (!rate.allowed) return rateLimitResponse(rate);
  const params = new URL(request.url).searchParams;
  const id = params.get("id") || params.get("orderId");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ success: false }, { status: 400 });
  const { data: transaction } = await serverSupabase.from("transactions").select("id,status").eq("id", id).maybeSingle();
  if (!transaction || transaction.status !== "pending") return NextResponse.json({ success: false }, { status: 404 });
  const banks = [
    { id: process.env.BANK_ID, account: process.env.BANK_ACCOUNT_NO, name: process.env.BANK_ACCOUNT_NAME },
    { id: process.env.BANK_ID_2, account: process.env.BANK_ACCOUNT_NO_2, name: process.env.BANK_ACCOUNT_NAME_2 },
  ].filter((bank) => bank.id && bank.account && bank.name);
  return NextResponse.json({ success: true, banks, momoPhone: process.env.MOMO_PHONE || "" }, { headers: { "Cache-Control": "private, no-store" } });
}
