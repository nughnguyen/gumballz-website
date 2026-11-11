import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ success: false }, { status: 401 });
  const { data, error } = await serverSupabase.from("transactions").select("id,metadata,created_at").eq("user_id", user.id).eq("status", "success").eq("metadata->>type", "product").order("created_at", { ascending: false }).limit(1000);
  if (error) return NextResponse.json({ success: false }, { status: 503 });
  const downloads: Record<string, string> = {};
  for (const row of data || []) {
    const productId = row.metadata?.product_id;
    if (typeof productId === "string" && !downloads[productId]) downloads[productId] = row.id;
  }
  return NextResponse.json({ success: true, ids: Object.keys(downloads), downloads }, { headers: { "Cache-Control": "private, no-store" } });
}
