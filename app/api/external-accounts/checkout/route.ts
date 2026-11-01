import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/app/utils/adminAuth";
import { checkRateLimit, rateLimitResponse } from "@/app/utils/rateLimit";
import { serverSupabase } from "@/app/utils/supabaseServer";

export async function POST(request: Request) {
  const user=await getAuthenticatedUser(request);
  if(!user)return NextResponse.json({success:false,error:"Đăng nhập để đặt mua tài khoản."},{status:401});
  const rate=await checkRateLimit(request,"external-account-checkout",8,60);
  if(!rate.allowed)return rateLimitResponse(rate);
  const body=await request.json().catch(()=>null);
  const accountId=typeof body?.accountId==="string"?body.accountId:"";
  const method=body?.paymentMethod;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId)||!(method==="wallet"||method==="banking"))return NextResponse.json({success:false,error:"Thông tin đặt mua không hợp lệ."},{status:400});
  const {data,error}=await serverSupabase.rpc("create_external_game_account_order",{p_user_id:user.id,p_account_id:accountId,p_payment_method:method});
  if(error){const errors:Record<string,{message:string;status:number}>={external_account_unavailable:{message:"Tài khoản vừa được người khác đặt mua hoặc không còn hàng.",status:409},wallet_balance_insufficient:{message:"Số dư ví không đủ.",status:409},invalid_payment_method:{message:"Phương thức thanh toán không hợp lệ.",status:400}};const known=errors[error.message];if(known)return NextResponse.json({success:false,error:known.message},{status:known.status});console.error("External account checkout failed:",error);return NextResponse.json({success:false,error:"Chưa thể tạo đơn đặt acc."},{status:503});}
  const order=Array.isArray(data)?data[0]:null;
  if(!order?.transaction_id)return NextResponse.json({success:false,error:"Không tạo được đơn."},{status:503});
  if(method==="wallet")return NextResponse.json({success:true,id:order.transaction_id,amount:Number(order.order_amount),paidWithWallet:true,balance:Number(order.remaining_balance)||0});
  return NextResponse.json({success:true,id:order.transaction_id,amount:Number(order.order_amount),content:order.order_code,free:false});
}
