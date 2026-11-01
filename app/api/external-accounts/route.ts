import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";
const tiers = ["under_2m","2m_7m","7m_15m","super"] as const;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const tier = params.get("tier");
  const slug = params.get("category");
  const code = (params.get("code") || "").trim();
  const minPrice = Number(params.get("minPrice"));
  const maxPrice = Number(params.get("maxPrice"));
  if (tier && !tiers.includes(tier as typeof tiers[number])) return NextResponse.json({success:false,error:"Danh mục không hợp lệ."},{status:400});
  if ((params.has("minPrice") && (!Number.isSafeInteger(minPrice) || minPrice < 0)) || (params.has("maxPrice") && (!Number.isSafeInteger(maxPrice) || maxPrice < 0)) || (params.has("minPrice") && params.has("maxPrice") && minPrice > maxPrice)) return NextResponse.json({success:false,error:"Khoảng giá không hợp lệ."},{status:400});
  if (code.length > 32 || (code && !/^[a-z0-9_-]+$/i.test(code))) return NextResponse.json({success:false,error:"Mã acc không hợp lệ."},{status:400});
  if (!slug) return NextResponse.json({success:false,error:"Thiếu danh mục."},{status:400});
  const {data:category}=await serverSupabase.from("external_game_account_categories").select("id").eq("slug",slug).eq("is_active",true).maybeSingle();
  if(!category)return NextResponse.json({success:false,error:"Không tìm thấy danh mục."},{status:404});
  let query = serverSupabase.from("external_game_accounts").select("id,source_account_id,title,description,image_url,price_vnd,price_tier,status,last_seen_at",{count:"exact"}).eq("category_id",category.id).in("status",["active","unavailable"]).order("price_vnd",{ascending:true});
  if (tier) query = query.eq("price_tier",tier);
  if (params.has("minPrice")) query = query.gte("price_vnd", minPrice);
  if (params.has("maxPrice")) query = query.lte("price_vnd", maxPrice);
  if (code) query = query.eq("source_account_id", code);
  const page = Math.max(1,Number(params.get("page"))||1); const size=24;
  const {data,error,count}=await query.range((page-1)*size,page*size-1);
  if(error)return NextResponse.json({success:false,error:"Chưa có dữ liệu acc đồng bộ. Hãy thử lại sau."},{status:503});
  return NextResponse.json({success:true,data:data||[],page,pageSize:size,total:count||0},{headers:{"Cache-Control":"public, max-age=30, stale-while-revalidate=60"}});
}
