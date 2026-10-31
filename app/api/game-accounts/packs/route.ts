import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
 const p=new URL(request.url).searchParams, offerId=p.get("offerId")||"", page=Math.max(1,Number(p.get("page"))||1), q=p.get("q")?.trim()||"";
 const {data:offer}=await serverSupabase.from("game_account_offers").select("id,slug,title,description,details,banner_image_url,price_vnd,gallery_urls").eq("id",offerId).eq("offer_type","mystery").eq("is_active",true).maybeSingle();
 if(!offer)return NextResponse.json({success:false,error:"Không tìm thấy túi mù."},{status:404});
 let query=serverSupabase.from("game_account_packs").select("id,code,created_at",{count:"exact"}).eq("offer_id",offerId).eq("status","available").order("created_at",{ascending:false});
 if(q)query=query.ilike("code",`%${q}%`);
 const {data,error,count}=await query.range((page-1)*30,page*30-1);
 if(error)return NextResponse.json({success:false,error:"Không tải được danh sách mã túi."},{status:503});
 return NextResponse.json({success:true,offer,packs:data||[],page,pageSize:30,total:count||0},{headers:{"Cache-Control":"public, max-age=15, stale-while-revalidate=30"}});
}
