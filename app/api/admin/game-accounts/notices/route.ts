import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";

const kinds = ["mystery", "individual", "community"] as const;
export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const { data, error } = await serverSupabase.from("game_account_category_notices").select("offer_type,title,body,is_enabled,updated_at").order("offer_type");
  if (error) return NextResponse.json({ success: false, error: "Không tải được thông báo danh mục." }, { status: 503 });
  return NextResponse.json({ success: true, data: data || [] }, { headers: { "Cache-Control": "private,no-store" } });
}
export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.notices) || body.notices.length !== kinds.length || body.notices.some((item: any) => !kinds.includes(item?.offer_type) || typeof item.title !== "string" || item.title.length > 120 || typeof item.body !== "string" || item.body.length > 6000 || typeof item.is_enabled !== "boolean")) {
    return NextResponse.json({ success: false, error: "Mỗi danh mục cần tiêu đề, nội dung tối đa 6.000 ký tự và trạng thái bật/tắt." }, { status: 400 });
  }
  const rows = body.notices.map((item: any) => ({ offer_type: item.offer_type, title: item.title.trim() || "Thông báo trước khi mua", body: item.body.trim(), is_enabled: item.is_enabled, updated_at: new Date().toISOString() }));
  const { error } = await serverSupabase.from("game_account_category_notices").upsert(rows, { onConflict: "offer_type" });
  if (error) return NextResponse.json({ success: false, error: "Không lưu được thông báo danh mục." }, { status: 400 });
  return NextResponse.json({ success: true });
}
