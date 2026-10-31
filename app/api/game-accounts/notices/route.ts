import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type");
  if (type !== "mystery" && type !== "individual" && type !== "community") return NextResponse.json({ success: false }, { status: 400 });
  const { data, error } = await serverSupabase.from("game_account_category_notices").select("title,body,is_enabled").eq("offer_type", type).maybeSingle();
  if (error) return NextResponse.json({ success: false }, { status: 503 });
  return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "public,max-age=30,stale-while-revalidate=60" } });
}
