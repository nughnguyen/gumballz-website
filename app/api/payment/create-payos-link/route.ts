import { createHmac, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { checkRateLimit, rateLimitResponse } from "@/app/utils/rateLimit";

export const dynamic = "force-dynamic";

function signPaymentRequest(amount: number, cancelUrl: string, description: string, orderCode: number, returnUrl: string, checksumKey: string) {
  const message = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  return createHmac("sha256", checksumKey).update(message).digest("hex");
}

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, "create-payos-link", 6, 60);
  if (!rate.allowed) return rateLimitResponse(rate);

  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  if (!clientId || !apiKey || !checksumKey) return NextResponse.json({ success: true, configured: false });

  const body = await request.json().catch(() => null);
  const transactionId = typeof body?.transactionId === "string" ? body.transactionId : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(transactionId) || !/^[A-Za-z0-9_-]{4,80}$/.test(content)) {
    return NextResponse.json({ success: false, error: "Thông tin giao dịch không hợp lệ." }, { status: 400 });
  }

  const { data: transaction, error } = await serverSupabase
    .from("transactions")
    .select("id,amount,status,method,description,metadata")
    .eq("id", transactionId)
    .eq("description", content)
    .maybeSingle();
  if (error || !transaction) return NextResponse.json({ success: false, error: "Không tìm thấy giao dịch." }, { status: 404 });
  const metadata = transaction.metadata || {};
  const isBankTransfer = transaction.method === "Banking" || (transaction.method == null && metadata.type === "minecraft");
  if (transaction.status !== "pending" || !isBankTransfer) {
    return NextResponse.json({ success: true, configured: true, payable: false });
  }

  if (typeof metadata.payos_checkout_url === "string") {
    return NextResponse.json({ success: true, configured: true, payable: true, checkoutUrl: metadata.payos_checkout_url });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return NextResponse.json({ success: false, error: "Website URL chưa được cấu hình." }, { status: 503 });
  let site: URL;
  try {
    site = new URL(appUrl);
    if (!(["https:", "http:"].includes(site.protocol))) throw new Error("Invalid protocol");
  } catch {
    return NextResponse.json({ success: false, error: "Website URL không hợp lệ." }, { status: 503 });
  }

  const amount = Number(transaction.amount);
  if (!Number.isSafeInteger(amount) || amount < 1000 || amount > 20000000) {
    return NextResponse.json({ success: false, error: "Số tiền đơn hàng không hợp lệ." }, { status: 409 });
  }
  const orderCode = randomInt(100000000, 2147483647);
  const description = content;
  const expiry = Math.floor(Date.now() / 1000) + 600;
  const returnUrl = new URL("/payment", site);
  returnUrl.searchParams.set("txId", transaction.id);
  returnUrl.searchParams.set("content", description);
  returnUrl.searchParams.set("amount", String(amount));
  returnUrl.searchParams.set("method", "Banking");
  returnUrl.searchParams.set("expiry", String(expiry));
  returnUrl.searchParams.set("payos", "return");
  const cancelUrl = new URL(returnUrl);
  cancelUrl.searchParams.set("payos", "cancel");

  const payload = {
    orderCode,
    amount,
    description,
    cancelUrl: cancelUrl.toString(),
    returnUrl: returnUrl.toString(),
    signature: signPaymentRequest(amount, cancelUrl.toString(), description, orderCode, returnUrl.toString(), checksumKey),
  };

  let payosResponse: Response;
  try {
    payosResponse = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-client-id": clientId, "x-api-key": apiKey },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ success: false, error: "Không kết nối được payOS. Bạn vẫn có thể chuyển khoản theo QR." }, { status: 503 });
  }

  const responseBody = await payosResponse.json().catch(() => null);
  const checkoutUrl = responseBody?.data?.checkoutUrl;
  if (!payosResponse.ok || responseBody?.code !== "00" || typeof checkoutUrl !== "string" || !checkoutUrl.startsWith("https://pay.payos.vn/")) {
    console.error("payOS link creation failed", { httpStatus: payosResponse.status, code: responseBody?.code });
    return NextResponse.json({ success: false, error: "payOS chưa tạo được link. Bạn có thể chuyển khoản theo QR hoặc thử lại." }, { status: 502 });
  }

  const nextMetadata = { ...metadata, payos_order_code: orderCode, payos_checkout_url: checkoutUrl };
  const { data: saved, error: saveError } = await serverSupabase
    .from("transactions")
    .update({ metadata: nextMetadata })
    .eq("id", transaction.id)
    .eq("status", "pending")
    .is("metadata->>payos_order_code", null)
    .select("id")
    .maybeSingle();
  if (saveError) return NextResponse.json({ success: false, error: "Không lưu được thông tin thanh toán." }, { status: 503 });
  if (!saved) {
    const { data: latest } = await serverSupabase.from("transactions").select("metadata").eq("id", transaction.id).maybeSingle();
    const existingUrl = latest?.metadata?.payos_checkout_url;
    if (typeof existingUrl === "string") return NextResponse.json({ success: true, configured: true, payable: true, checkoutUrl: existingUrl });
    return NextResponse.json({ success: false, error: "Đơn hàng vừa thay đổi trạng thái. Hãy tải lại trang." }, { status: 409 });
  }

  return NextResponse.json({ success: true, configured: true, payable: true, checkoutUrl });
}
