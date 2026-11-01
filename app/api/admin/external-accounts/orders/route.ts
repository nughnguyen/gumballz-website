import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { requireAdmin } from "@/app/utils/adminAuth";

export const dynamic="force-dynamic";
export async function GET(request:Request){
  if(!(await requireAdmin(request)))return NextResponse.json({success:false},{status:401});
  const {data,error}=await serverSupabase.from("transactions").select("id,user_id,amount,status,metadata,created_at").eq("metadata->>type","external_game_account").order("created_at",{ascending:false}).limit(100);
  if(error)return NextResponse.json({success:false,error:"Không tải được đơn acc nguồn."},{status:503});
  return NextResponse.json({success:true,data:data||[]},{headers:{"Cache-Control":"private,no-store"}});
}

export async function POST(request:Request){
  if(!(await requireAdmin(request)))return NextResponse.json({success:false},{status:401});
  const body=await request.json().catch(()=>null);
  const id=typeof body?.transactionId==="string"?body.transactionId:"";
  const username=typeof body?.username==="string"?body.username.trim():"";
  const password=typeof body?.password==="string"?body.password.trim():"";
  if(!/^[0-9a-f-]{36}$/i.test(id)||username.length<1||username.length>240||password.length<1||password.length>500)return NextResponse.json({success:false,error:"Nhập đúng thông tin đăng nhập acc."},{status:400});
  const {data:order}=await serverSupabase.from("transactions").select("id,status,metadata").eq("id",id).eq("metadata->>type","external_game_account").maybeSingle();
  if(!order)return NextResponse.json({success:false,error:"Không tìm thấy đơn."},{status:404});
  if(order.status!=="success")return NextResponse.json({success:false,error:"Chỉ giao acc sau khi đơn đã thanh toán thành công."},{status:409});
  if(order.metadata?.fulfillment_status==="fulfilled")return NextResponse.json({success:false,error:"Đơn này đã được giao."},{status:409});
  const metadata={...order.metadata,fulfillment_status:"fulfilled",fulfilled_at:new Date().toISOString(),game_account_delivery:{username,password}};
  const {data:saved,error}=await serverSupabase.from("transactions").update({metadata}).eq("id",id).eq("status","success").eq("metadata->>fulfillment_status","pending").select("id").maybeSingle();
  if(error||!saved)return NextResponse.json({success:false,error:"Đơn vừa được xử lý hoặc không thể lưu thông tin giao acc."},{status:409});
  if(typeof order.metadata?.external_account_id==="string")await serverSupabase.from("external_game_accounts").update({status:"sold",is_active:false,updated_at:new Date().toISOString()}).eq("id",order.metadata.external_account_id);
  return NextResponse.json({success:true});
}
