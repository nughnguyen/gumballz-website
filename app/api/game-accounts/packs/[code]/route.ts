import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
export const dynamic = "force-dynamic";
export async function GET(_request:Request,context:{params:Promise<{code:string}>}){
 const {code}=await context.params;
 const {data:pack}=await serverSupabase.from("game_account_packs").select("id,code,offer_id,status").eq("code",code).eq("status","available").maybeSingle();
 if(!pack)return NextResponse.json({success:false}, {status:404});
 const {data:offer}=await serverSupabase.from("game_account_offers").select("id,slug,offer_type,title,description,details,banner_image_url,gallery_urls,price_vnd").eq("id",pack.offer_id).eq("is_active",true).maybeSingle();
 if(!offer)return NextResponse.json({success:false},{status:404});
 return NextResponse.json({success:true,pack:{id:pack.id,code:pack.code},offer},{headers:{"Cache-Control":"no-store"}});
}
