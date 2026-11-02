import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const { data, error } = await serverSupabase.from("external_game_accounts")
    .select("id,source_account_id,title,source_url,category_id,updated_at")
    .eq("status", "sold").eq("admin_hidden", false).order("updated_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ success: false, error: "Không tải được danh sách tài khoản đã bán." }, { status: 503 });
  return NextResponse.json({ success: true, data: data || [] }, { headers: { "Cache-Control": "private,no-store" } });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ success: false, error: "Tài khoản không hợp lệ." }, { status: 400 });
  const { data, error } = await serverSupabase.from("external_game_accounts")
    .update({ admin_hidden: true, is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id).eq("status", "sold").eq("admin_hidden", false).select("id").maybeSingle();
  if (error || !data) return NextResponse.json({ success: false, error: "Không tìm thấy tài khoản đã bán để xóa." }, { status: 404 });
  return NextResponse.json({ success: true });
}
