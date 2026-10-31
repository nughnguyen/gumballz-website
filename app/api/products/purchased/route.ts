import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ success: false }, { status: 401 });
  const { data, error } = await serverSupabase.from("transactions").select("metadata").eq("user_id", user.id).eq("status", "success").eq("metadata->>type", "product").limit(1000);
  if (error) return NextResponse.json({ success: false }, { status: 503 });
  return NextResponse.json({ success: true, ids: (data || []).map(row => row.metadata?.product_id).filter(Boolean) }, { headers: { "Cache-Control": "private, no-store" } });
}
