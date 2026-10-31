import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { readCommunityAccounts } from "@/app/utils/communityAccountFile";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const type = params.get("type");
  let query = serverSupabase.from("game_account_offers").select("id,slug,offer_type,title,description,details,warranty_terms,risk_notice,refund_policy,banner_image_url,gallery_urls,price_vnd,is_featured,created_at", { count: "exact" }).eq("is_active", true).order("created_at", { ascending: false });
  if (params.get("featured") === "1") query = query.eq("is_featured", true);
  if (type === "mystery" || type === "individual" || type === "community") query = query.eq("offer_type", type);
  const q = params.get("q")?.trim().slice(0, 80).replace(/[^\p{L}\p{N}\s_-]/gu, ""); if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  const page = Math.max(1, Number(params.get("page")) || 1); const size = 30;
  const { data, error, count } = await query.range((page-1)*size, page*size-1);
  if (error) return NextResponse.json({ success: false, error: "Không tải được danh sách acc." }, { status: 503 });
  const rows = await Promise.all((data || []).map(async offer => {
    if (offer.offer_type === "community") {
      try { return { ...offer, stock_count: (await readCommunityAccounts()).length }; }
      catch { return { ...offer, stock_count: 0 }; }
    }
    const table = offer.offer_type === "mystery" ? "game_account_packs" : "game_account_inventory";
    const { count: stock } = await serverSupabase.from(table).select("id", { count: "exact", head: true }).eq("offer_id", offer.id).eq("status", "available");
    return { ...offer, stock_count: stock || 0 };
  }));
  return NextResponse.json({ success: true, data: rows, page, pageSize: size, total: count || 0 }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
}
