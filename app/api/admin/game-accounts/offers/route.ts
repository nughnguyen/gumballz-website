import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";
export const dynamic="force-dynamic";
const imageUrl=(url:unknown)=>typeof url==="string"&&url.startsWith("https://")&&url.includes("/storage/v1/object/public/game-account-screenshots/");
function valid(body:any){return typeof body?.title==="string"&&body.title.trim().length>=2&&body.title.length<=120&&typeof body?.slug==="string"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)&&["mystery","individual","community"].includes(body.offer_type)&&typeof body.description==="string"&&body.description.length<=4000&&typeof body.details==="string"&&body.details.length<=12000&&[body.warranty_terms,body.risk_notice,body.refund_policy].every(value=>typeof value==="string"&&value.length<=3000)&&typeof body.is_featured==="boolean"&&Number.isSafeInteger(body.price_vnd)&&body.price_vnd>=0&&body.price_vnd<=100000000&&imageUrl(body.banner_image_url)&&Array.isArray(body.gallery_urls)&&body.gallery_urls.length<=8&&body.gallery_urls.every(imageUrl);}
export async function GET(request:Request){if(!(await requireAdmin(request)))return NextResponse.json({success:false},{status:401});const {data,error}=await serverSupabase.from("game_account_offers").select("*").order("created_at",{ascending:false});if(error)return NextResponse.json({success:false,error:"Không tải được cấu hình acc game."},{status:503});return NextResponse.json({success:true,data:data||[]},{headers:{"Cache-Control":"private,no-store"}})}
export async function POST(request:Request){if(!(await requireAdmin(request)))return NextResponse.json({success:false},{status:401});const b=await request.json().catch(()=>null);if(!valid(b))return NextResponse.json({success:false,error:"Thông tin mặt hàng acc chưa hợp lệ."},{status:400});const id=typeof b.id==="string"?b.id:null;const values={slug:b.slug,title:b.title.trim(),offer_type:b.offer_type,description:b.description.trim(),details:b.details.trim(),warranty_terms:b.warranty_terms,risk_notice:b.risk_notice,refund_policy:b.refund_policy,is_featured:b.is_featured,banner_image_url:b.banner_image_url,gallery_urls:b.gallery_urls,price_vnd:b.price_vnd,is_active:b.is_active!==false,updated_at:new Date().toISOString()};let offer:any=null;let error:any=null;if(id){({data:offer,error}=await serverSupabase.from("game_account_offers").update(values).eq("id",id).select("*").single())}else{({data:offer,error}=await serverSupabase.from("game_account_offers").insert(values).select("*").single())}if(error||!offer)return NextResponse.json({success:false,error:error?.code==="23505"?"Đường dẫn này đã được sử dụng.":"Không lưu được cấu hình acc."},{status:400});if(!id&&b.offer_type==="individual"){if(typeof b.username!=="string"||!b.username.trim()||typeof b.password!=="string"||!b.password.trim()){await serverSupabase.from("game_account_offers").delete().eq("id",offer.id);return NextResponse.json({success:false,error:"Acc riêng cần có tên đăng nhập và mật khẩu."},{status:400})}const {error:inventoryError}=await serverSupabase.from("game_account_inventory").insert({offer_id:offer.id,username:b.username.trim(),password:b.password.trim(),screenshots:b.gallery_urls||[]});if(inventoryError){await serverSupabase.from("game_account_offers").delete().eq("id",offer.id);return NextResponse.json({success:false,error:"Không lưu được tài khoản riêng."},{status:400})}}return NextResponse.json({success:true,data:offer})}
export async function DELETE(request:Request){
  if(!(await requireAdmin(request)))return NextResponse.json({success:false},{status:401});
  const url=new URL(request.url),id=url.searchParams.get("id");
  if(!id||!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({success:false,error:"Danh mục không hợp lệ."},{status:400});
  if(url.searchParams.get("permanent")!=="1"){
    const {error}=await serverSupabase.from("game_account_offers").update({is_active:false}).eq("id",id);
    if(error)return NextResponse.json({success:false,error:"Không thể ẩn mặt hàng acc."},{status:400});
    return NextResponse.json({success:true});
  }
  const [inventory,packs,spins]=await Promise.all([
    serverSupabase.from("game_account_inventory").select("id",{count:"exact",head:true}).eq("offer_id",id).in("status",["reserved","sold"]),
    serverSupabase.from("game_account_packs").select("id",{count:"exact",head:true}).eq("offer_id",id).in("status",["reserved","sold"]),
    serverSupabase.from("lucky_wheel_spins").select("id",{count:"exact",head:true}).eq("offer_id",id),
  ]);
  if(inventory.error||packs.error||spins.error)return NextResponse.json({success:false,error:"Không kiểm tra được lịch sử danh mục."},{status:503});
  if((inventory.count||0)+(packs.count||0)+(spins.count||0)>0)return NextResponse.json({success:false,error:"Danh mục đã có đơn, tài khoản đã bán/đang giữ hoặc lịch sử vòng quay. Hãy ẩn danh mục thay vì xóa để giữ lịch sử."},{status:409});
  const {error}=await serverSupabase.from("game_account_offers").delete().eq("id",id);
  if(error)return NextResponse.json({success:false,error:"Không thể xóa danh mục acc game."},{status:400});
  return NextResponse.json({success:true});
}

export async function PATCH(request:Request){
  if(!(await requireAdmin(request)))return NextResponse.json({success:false},{status:401});
  const body=await request.json().catch(()=>null);
  if(typeof body?.id!=="string"||!/^[0-9a-f-]{36}$/i.test(body.id))return NextResponse.json({success:false,error:"Danh m?c kh?ng h?p l?."},{status:400});
  const {error}=await serverSupabase.from("game_account_offers").update({is_active:true,updated_at:new Date().toISOString()}).eq("id",body.id);
  if(error)return NextResponse.json({success:false,error:"Kh?ng th? hi?n l?i danh m?c acc."},{status:400});
  return NextResponse.json({success:true});
}
