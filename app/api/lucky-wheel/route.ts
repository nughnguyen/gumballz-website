import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/app/utils/adminAuth";
import { checkRateLimit, rateLimitResponse } from "@/app/utils/rateLimit";
import { serverSupabase } from "@/app/utils/supabaseServer";
export async function GET(){const {data,error}=await serverSupabase.from("lucky_wheel_config").select("is_enabled,spin_cost_vnd,segments").eq("id",true).maybeSingle();if(error||!data)return NextResponse.json({success:false,error:"Vòng quay chưa được cấu hình."},{status:503});const segments=(Array.isArray(data.segments)?data.segments:[]).map((s:any)=>({label:s.label,type:s.type,color:s.color}));return NextResponse.json({success:true,data:{is_enabled:data.is_enabled,spin_cost_vnd:data.spin_cost_vnd,segments}},{headers:{"Cache-Control":"no-store"}})}
