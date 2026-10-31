import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const visitorId = typeof body?.visitorId === "string" ? body.visitorId : "";
  if (!/^[0-9a-f-]{36}$/i.test(visitorId)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await serverSupabase
    .from("site_visit_sessions")
    .upsert({ visitor_id: visitorId, last_seen_at: now }, { onConflict: "visitor_id" });
  if (upsertError) return NextResponse.json({ success: false }, { status: 503 });

  const cutoff = new Date(Date.now() - 2 * 60_000).toISOString();
  const [{ count: visits, error: visitsError }, { count: online, error: onlineError }] = await Promise.all([
    serverSupabase.from("site_visit_sessions").select("visitor_id", { count: "exact", head: true }),
    serverSupabase.from("site_visit_sessions").select("visitor_id", { count: "exact", head: true }).gte("last_seen_at", cutoff),
  ]);

  if (visitsError || onlineError) return NextResponse.json({ success: false }, { status: 503 });
  return NextResponse.json({ success: true, visits: visits || 0, online: online || 0 }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
