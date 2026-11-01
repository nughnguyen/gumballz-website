import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { requireAdmin } from "@/app/utils/adminAuth";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const { data, error } = await serverSupabase.from("external_game_account_categories").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ success: false, error: "Chưa tải được danh mục." }, { status: 503 });
  return NextResponse.json({ success: true, data: data || [] }, { headers: { "Cache-Control": "private,no-store" } });
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const slug = typeof body?.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const image = typeof body?.cover_image_url === "string" ? body.cover_image_url.trim() : "";
  const source = body?.source;
  const markup = Number(body?.markup_vnd);
  const id = typeof body?.id === "string" ? body.id : undefined;
  if (title.length < 2 || title.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || description.length > 1200 || (image && !/^https:\/\//i.test(image)) || source !== "tyseisei" || !Number.isSafeInteger(markup) || markup < 0 || markup > 10_000_000) {
    return NextResponse.json({ success: false, error: "Kiểm tra lại tên, đường dẫn, ảnh, nguồn và phụ phí." }, { status: 400 });
  }
  const row = { ...(id ? { id } : {}), title, slug, description, cover_image_url: image || null, source, markup_vnd: markup, updated_at: new Date().toISOString() };
  const { data, error } = await serverSupabase.from("external_game_account_categories").upsert(row, { onConflict: "id" }).select("*").single();
  if (error) return NextResponse.json({ success: false, error: "Không lưu được danh mục (có thể đường dẫn đã được dùng)." }, { status: 409 });
  return NextResponse.json({ success: true, data });
}
