import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const visitorId = typeof body?.visitorId === "string" ? body.visitorId : "";
  if (!/^[0-9a-f-]{36}$/i.test(visitorId)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const { error: recordError } = await serverSupabase.rpc("record_site_visit", {
    p_visitor_id: visitorId,
  });
  if (recordError) return NextResponse.json({ success: false }, { status: 503 });

  const cutoff = new Date(Date.now() - 2 * 60_000).toISOString();
  const [
    { data: totals, error: visitsError },
    { count: online, error: onlineError },
    { count: expiredSessions, error: cleanupError },
  ] = await Promise.all([
    serverSupabase.from("site_visit_totals").select("total_visits").eq("id", 1).single(),
    serverSupabase.from("site_visit_sessions").select("visitor_id", { count: "exact", head: true }).gte("last_seen_at", cutoff),
    serverSupabase
      .from("site_visit_sessions")
      .delete({ count: "exact" })
      .lt("last_seen_at", cutoff),
  ]);

  if (visitsError || onlineError || cleanupError) return NextResponse.json({ success: false }, { status: 503 });
  return NextResponse.json({
    success: true,
    visits: Number(totals?.total_visits || 0),
    online: online || 0,
    expiredSessions: expiredSessions || 0,
  }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
