import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return NextResponse.json({ success: false }, { status: 404 });
  const { data: product, error } = await serverSupabase.from("products")
    .select("id,title,slug,category,description,cover_image_url,gallery_urls,demo_url,price_vnd,discount_percent,key_duration_days,stock_count,tags,highlights,is_featured,created_at,view_count,download_count,sales_count,account_sale_mode,account_screenshots")
    .eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error || !product) return NextResponse.json({ success: false, error: "Không tìm thấy sản phẩm." }, { status: 404 });
  const { error: countError } = await serverSupabase.rpc("increment_product_view", { p_product_id: product.id });
  if (!countError) product.view_count = Number(product.view_count || 0) + 1;
  return NextResponse.json({ success: true, data: product }, { headers: { "Cache-Control": "private, no-store" } });
}
