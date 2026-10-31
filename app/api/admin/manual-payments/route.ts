import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 403 });
  const { data, error } = await serverSupabase
    .from("transactions")
    .select("id,user_id,amount,description,method,metadata,created_at,status")
    .in("status", ["pending", "failed"])
    .eq("metadata->>manual_review_requested", "true")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) return NextResponse.json({ success: false, error: "Không tải được yêu cầu duyệt." }, { status: 503 });
  return NextResponse.json({ success: true, data: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 403 });
  const body = await request.json().catch(() => null);
  const id = typeof body?.transactionId === "string" ? body.transactionId : "";
  const decision = body?.decision;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["approve", "reject", "delete"].includes(decision)) {
    return NextResponse.json({ success: false, error: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  if (decision === "delete") {
    const { error } = await serverSupabase.from("transactions").delete().eq("id", id).eq("metadata->>manual_review_requested", "true");
    if (error) return NextResponse.json({ success: false, error: "Không xóa được đơn." }, { status: 503 });
    return NextResponse.json({ success: true, status: "deleted" });
  }

  const { data: transaction, error } = await serverSupabase
    .from("transactions")
    .select("id,metadata")
    .eq("id", id)
    .in("status", ["pending", "failed"])
    .eq("metadata->>manual_review_requested", "true")
    .maybeSingle();
  if (error || !transaction) return NextResponse.json({ success: false, error: "Đơn không còn chờ duyệt hoặc không tồn tại." }, { status: 409 });

  const reviewedAt = new Date().toISOString();
  const nextMetadata = {
    ...(transaction.metadata || {}),
    manual_review_status: decision === "approve" ? "approved" : "rejected",
    manual_reviewed_at: reviewedAt,
  };
  const { data: updated, error: updateError } = await serverSupabase
    .from("transactions")
    .update({ status: decision === "approve" ? "success" : "failed", metadata: nextMetadata })
    .eq("id", id)
    .in("status", ["pending", "failed"])
    .eq("metadata->>manual_review_requested", "true")
    .select("id,status")
    .maybeSingle();
  if (updateError) return NextResponse.json({ success: false, error: "Không cập nhật được đơn." }, { status: 503 });
  if (!updated) return NextResponse.json({ success: false, error: "Đơn vừa được xử lý bởi một luồng khác." }, { status: 409 });
  return NextResponse.json({ success: true, status: updated.status });
}
