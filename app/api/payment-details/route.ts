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
  let configuredBanks: Array<{ id: string; account: string; name: string; note?: string; automatic?: boolean }> = [];
  try { configuredBanks = JSON.parse(process.env.PAYMENT_BANK_ACCOUNTS || "[]"); } catch { configuredBanks = []; }
  const banks = [...configuredBanks,
    { id: process.env.BANK_ID, account: process.env.BANK_ACCOUNT_NO, name: process.env.BANK_ACCOUNT_NAME, note: process.env.BANK_NOTE, automatic: process.env.BANK_AUTOMATIC !== "false" },
    { id: process.env.BANK_ID_2, account: process.env.BANK_ACCOUNT_NO_2, name: process.env.BANK_ACCOUNT_NAME_2, note: process.env.BANK_NOTE_2, automatic: process.env.BANK_2_AUTOMATIC === "true" },
  ].filter((bank) => bank.id && bank.account && bank.name);
  return NextResponse.json({ success: true, banks, momoPhone: process.env.MOMO_PHONE || "" }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const content = typeof body?.content === "string" ? body.content : "";
  const bankId = typeof body?.bankId === "string" ? body.bankId : "";
  const account = typeof body?.account === "string" ? body.account : "";
  const name = typeof body?.name === "string" ? body.name : "";
  const bankName = typeof body?.bankName === "string" ? body.bankName : "";
  const note = typeof body?.note === "string" ? body.note.slice(0, 500) : "";
  const automatic = body?.automatic === true;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !content || !bankId || !account || !name) return NextResponse.json({ success: false }, { status: 400 });
  const { data: transaction } = await serverSupabase.from("transactions").select("id,metadata").eq("id", id).eq("description", content).eq("status", "pending").maybeSingle();
  if (!transaction) return NextResponse.json({ success: false }, { status: 404 });
  const metadata = { ...(transaction.metadata || {}), payment_account: { bankId, account, name, bankName, note, automatic } };
  const { error } = await serverSupabase.from("transactions").update({ metadata }).eq("id", id).eq("status", "pending");
  if (error) return NextResponse.json({ success: false }, { status: 503 });
  return NextResponse.json({ success: true });
}
