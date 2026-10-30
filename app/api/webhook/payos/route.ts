import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";

type PayOSPaymentData = Record<string, unknown>;

function sortObject(value: Record<string, unknown>) {
  return Object.keys(value).sort().reduce<Record<string, unknown>>((sorted, key) => {
    sorted[key] = value[key];
    return sorted;
  }, {});
}

function signatureValue(value: unknown): string {
  if (value === null || value === undefined || value === "null" || value === "undefined") return "";
  if (Array.isArray(value)) return JSON.stringify(value.map((item) => item && typeof item === "object" && !Array.isArray(item) ? sortObject(item as Record<string, unknown>) : item));
  if (value && typeof value === "object") return JSON.stringify(sortObject(value as Record<string, unknown>));
  return String(value);
}

function verifyPaymentData(data: PayOSPaymentData, signature: string, checksumKey: string) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const message = Object.keys(data).sort().map((key) => `${key}=${signatureValue(data[key])}`).join("&");
  const expected = createHmac("sha256", checksumKey).update(message).digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function POST(request: Request) {
  try {
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    if (!checksumKey) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || !body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const data = body.data as PayOSPaymentData;
    if (!verifyPaymentData(data, String(body.signature || ""), checksumKey)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    if (body.success !== true || String(data.code) !== "00") {
      return NextResponse.json({ code: "00", desc: "Payment not successful" });
    }

    const orderCode = Number(data.orderCode);
    const amount = Number(data.amount);
    if (!Number.isSafeInteger(orderCode) || !Number.isSafeInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
    }

    const { data: transaction, error } = await serverSupabase
      .from("transactions")
      .select("id,amount,status,metadata")
      .eq("metadata->>payos_order_code", String(orderCode))
      .maybeSingle();
    if (error) return NextResponse.json({ error: "Could not locate order" }, { status: 503 });
    if (!transaction) return NextResponse.json({ code: "00", desc: "Order not found; webhook acknowledged" });
    if (Number(transaction.amount) !== amount) return NextResponse.json({ error: "Payment amount does not match order" }, { status: 409 });
    if (transaction.status === "success") return NextResponse.json({ code: "00", desc: "Payment already processed" });
    if (!["pending", "expired"].includes(transaction.status)) return NextResponse.json({ code: "00", desc: "Order is not payable" });

    const paymentReference = typeof data.reference === "string" ? data.reference : String(data.paymentLinkId || orderCode);
    const nextMetadata = {
      ...(transaction.metadata || {}),
      source: "payos",
      payos_payment_link_id: String(data.paymentLinkId || ""),
      payos_reference: paymentReference,
      payos_paid_at: typeof data.transactionDateTime === "string" ? data.transactionDateTime : new Date().toISOString(),
    };
    const { data: updated, error: updateError } = await serverSupabase
      .from("transactions")
      .update({ status: "success", transaction_id: paymentReference, metadata: nextMetadata })
      .eq("id", transaction.id)
      .eq("amount", amount)
      .in("status", ["pending", "expired"])
      .select("id")
      .maybeSingle();
    if (updateError) return NextResponse.json({ error: "Could not settle order" }, { status: 503 });
    if (!updated) {
      const { data: latest } = await serverSupabase.from("transactions").select("status").eq("id", transaction.id).maybeSingle();
      if (latest?.status === "success") return NextResponse.json({ code: "00", desc: "Payment already processed" });
      return NextResponse.json({ error: "Order changed during payment processing" }, { status: 409 });
    }

    return NextResponse.json({ code: "00", desc: "Payment processed" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
