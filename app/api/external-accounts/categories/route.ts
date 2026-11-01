import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await serverSupabase.from("external_game_account_categories")
    .select("id,slug,title,description,cover_image_url,game")
    .eq("is_active", true).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ success: false, error: "Chưa tải được danh mục tài khoản." }, { status: 503 });
  return NextResponse.json({ success: true, data: data || [] }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
}
