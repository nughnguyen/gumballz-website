import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { getAuthenticatedUser } from "@/app/utils/adminAuth";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ success: false }, { status: 401 });
  const { data, error } = await serverSupabase.from("transactions").select("id,amount,status,metadata,created_at").eq("user_id", user.id).in("metadata->>type", ["product", "key", "game_account", "wallet_topup"]).order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ success: false, error: "Could not load purchases" }, { status: 503 });
  return NextResponse.json({ success: true, data: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

