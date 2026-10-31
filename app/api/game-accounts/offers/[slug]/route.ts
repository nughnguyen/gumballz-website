import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const { data, error } = await serverSupabase.from("game_account_offers").select("id,slug,offer_type,title,description,details,warranty_terms,risk_notice,refund_policy,banner_image_url,gallery_urls,price_vnd,created_at").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) return NextResponse.json({ success: false, error: "Không tải được chi tiết acc." }, { status: 503 });
  if (!data) return NextResponse.json({ success: false }, { status: 404 });
  const table = data.offer_type === "mystery" ? "game_account_packs" : "game_account_inventory";
  const { count } = await serverSupabase.from(table).select("id", { count: "exact", head: true }).eq("offer_id", data.id).eq("status", "available");
  return NextResponse.json({ success: true, data: { ...data, stock_count: count || 0 } }, { headers: { "Cache-Control": "public, max-age=20" } });
}
