import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";

type MomoIpn = Record<string, string | number | undefined>;

function verifySignature(body: MomoIpn, accessKey: string, secretKey: string) {
  const keys = ["accessKey", "amount", "callbackToken", "extraData", "message", "orderId", "orderInfo", "orderType", "partnerCode", "payType", "requestId", "responseTime", "resultCode", "transId"];
  const values: Record<string, string> = {
    accessKey,
    amount: String(body.amount ?? ""),
    extraData: String(body.extraData ?? ""),
    message: String(body.message ?? ""),
    orderId: String(body.orderId ?? ""),
    orderInfo: String(body.orderInfo ?? ""),
    orderType: String(body.orderType ?? ""),
    partnerCode: String(body.partnerCode ?? ""),
    payType: String(body.payType ?? ""),
    requestId: String(body.requestId ?? ""),
    responseTime: String(body.responseTime ?? ""),
    resultCode: String(body.resultCode ?? ""),
    transId: String(body.transId ?? ""),
  };
  if (body.callbackToken !== undefined) values.callbackToken = String(body.callbackToken);
  const raw = keys.filter((key) => key in values).map((key) => `${key}=${values[key]}`).join("&");
  const expected = createHmac("sha256", secretKey).update(raw).digest("hex");
  const received = Buffer.from(String(body.signature || "").toLowerCase());
  const expectedBuffer = Buffer.from(expected);
  return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as MomoIpn;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    if (!accessKey || !secretKey || !verifySignature(body, accessKey, secretKey)) {
      return NextResponse.json({ message: "Invalid signature", status: 1 }, { status: 401 });
    }

    if (Number(body.resultCode) !== 0) return NextResponse.json({ message: "Payment not successful", status: 0 });
    const amount = Number(body.amount);
    const transId = String(body.transId || "");
    const description = String(body.orderInfo || "");
    const match = description.match(/\b((?:GUMZ\d{17,20}|GZ[A-Z0-9]{4,10}|MC[A-Z0-9]{4,10}|KEY[A-Z0-9]{4,20}|TOOL[A-Z0-9]{4,20}))\b/i);
    if (!Number.isSafeInteger(amount) || amount <= 0 || !transId || !match) {
      return NextResponse.json({ message: "Invalid payment details", status: 1 }, { status: 400 });
    }

    const token = match[1];
    const { data: transaction, error } = await serverSupabase
      .from("transactions")
      .select("id,amount,metadata,created_at")
      .eq("status", "pending")
      .ilike("description", `%${token}%`)
      .maybeSingle();
    if (error) return NextResponse.json({ message: "Transaction lookup failed", status: 1 }, { status: 500 });
    if (transaction && Number(transaction.amount) === amount) {
      const tooLate = Date.now() - new Date(transaction.created_at).getTime() > 10 * 60 * 1000;
      const { error: updateError } = await serverSupabase.from("transactions").update({
        status: tooLate ? "late_payment" : "success",
        transaction_id: transId,
        metadata: { ...(transaction.metadata as Record<string, unknown>), bank_desc: description, source: "momo" },
      }).eq("id", transaction.id).eq("status", "pending");
      if (updateError) return NextResponse.json({ message: "Transaction update failed", status: 1 }, { status: 500 });
    }

    return NextResponse.json({ message: "Received", status: 0 });
  } catch (error) {
    console.error("MoMo webhook processing failed", error);
    return NextResponse.json({ message: "Internal error", status: 1 }, { status: 500 });
  }
}
