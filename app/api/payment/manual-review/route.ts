import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { checkRateLimit, rateLimitResponse } from "@/app/utils/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, "manual-payment-review-request", 5, 3600);
  if (!rate.allowed) return rateLimitResponse(rate);

  const body = await request.json().catch(() => null);
  const id = typeof body?.transactionId === "string" ? body.transactionId : "";
  const code = typeof body?.content === "string" ? body.content.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[A-Za-z0-9_-]{4,80}$/.test(code)) {
    return NextResponse.json({ success: false, error: "Thông tin giao dịch không hợp lệ." }, { status: 400 });
  }

  const { data: transaction, error } = await serverSupabase
    .from("transactions")
    .select("id,user_id,status,method,description,metadata")
    .eq("id", id)
    .eq("description", code)
    .maybeSingle();
  if (error || !transaction) return NextResponse.json({ success: false, error: "Không tìm thấy giao dịch." }, { status: 404 });
  const metadata = transaction.metadata || {};
  const isBankTransfer = transaction.method === "Banking" || (transaction.method == null && metadata.type === "minecraft");
  if (!isBankTransfer) return NextResponse.json({ success: false, error: "Chỉ hỗ trợ gửi yêu cầu duyệt cho giao dịch chuyển khoản ngân hàng." }, { status: 400 });
  if (!["pending", "expired"].includes(transaction.status)) return NextResponse.json({ success: false, error: "Giao dịch không còn ở trạng thái chờ." }, { status: 409 });

  if (metadata.manual_review_requested === true && transaction.status === "pending") {
    return NextResponse.json({ success: true, status: "pending_review" });
  }
  const { data: updated, error: updateError } = await serverSupabase
    .from("transactions")
    .update({ status: "pending", metadata: { ...metadata, manual_review_requested: true, manual_review_requested_at: new Date().toISOString() } })
    .eq("id", transaction.id)
    .in("status", ["pending", "expired"])
    .select("id")
    .maybeSingle();

  if (updateError) return NextResponse.json({ success: false, error: "Không gửi được yêu cầu. Vui lòng thử lại." }, { status: 503 });
  if (!updated) return NextResponse.json({ success: false, error: "Giao dịch vừa được cập nhật. Hãy tải lại trang." }, { status: 409 });
  return NextResponse.json({ success: true, status: "pending_review" });
}
