import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await serverSupabase.from("transactions")
    .select("metadata,created_at")
    .eq("status", "success")
    .in("metadata->>type", ["product", "key", "game_account"])
    .not("metadata->>product_title", "is", null)
    .order("created_at", { ascending: false }).limit(6);
  if (error) return NextResponse.json({ success: true, data: [] }, { headers: { "Cache-Control": "public, max-age=60" } });
  const sales = (data || []).map((row) => ({ title: String(row.metadata?.product_title || "Sản phẩm"), created_at: row.created_at }));
  return NextResponse.json({ success: true, data: sales }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
