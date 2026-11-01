import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";

const removableStatuses = ["pending", "failed", "expired", "late_payment", "ignored_code_not_found"];

export async function DELETE(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (body?.deleteExpired === true) {
    const deletionThreshold = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const { data: deleted, error } = await serverSupabase
      .from("transactions")
      .delete()
      .eq("status", "expired")
      .lt("created_at", deletionThreshold)
      .or("metadata->>manual_review_requested.is.null,metadata->>manual_review_requested.eq.false")
      .select("id,metadata");

    if (error) {
      console.error("Expired admin transaction cleanup failed:", error);
      return NextResponse.json({ success: false, error: "Không xóa được giao dịch hết hạn." }, { status: 503 });
    }

    const externalAccountIds = [...new Set((deleted || [])
      .filter((transaction) => transaction.metadata?.type === "external_game_account")
      .map((transaction) => transaction.metadata?.external_account_id)
      .filter((id): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)))];
    if (externalAccountIds.length) {
      const { error: releaseError } = await serverSupabase.from("external_game_accounts")
        .update({ status: "active", is_active: true, updated_at: new Date().toISOString() })
        .in("id", externalAccountIds)
        .eq("status", "reserved");
      if (releaseError) console.error("Could not release accounts from expired transactions:", releaseError);
    }

    return NextResponse.json({ success: true, deleted: deleted?.length || 0 });
  }

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
