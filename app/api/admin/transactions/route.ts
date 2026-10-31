import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";

const removableStatuses = ["pending", "failed", "expired", "late_payment", "ignored_code_not_found"];

export async function DELETE(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const transactionId = typeof body?.transactionId === "string" ? body.transactionId : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transactionId)) {
    return NextResponse.json({ success: false, error: "Mã giao dịch không hợp lệ." }, { status: 400 });
  }

  const { data, error } = await serverSupabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .in("status", removableStatuses)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Admin transaction deletion failed:", error);
    return NextResponse.json({ success: false, error: "Không xóa được giao dịch." }, { status: 503 });
  }
  if (!data) return NextResponse.json({ success: false, error: "Không tìm thấy giao dịch chưa thanh toán để xóa." }, { status: 409 });

  return NextResponse.json({ success: true });
}
