import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expected = Buffer.from(secret || "");
  const actual = Buffer.from(supplied);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const threshold = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: stalePending, error } = await serverSupabase
    .from("transactions")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("created_at", threshold)
    .or("metadata->>manual_review_requested.is.null,metadata->>manual_review_requested.eq.false")
    .select("id");

  if (error) return NextResponse.json({ success: false, error: "Cleanup failed" }, { status: 500 });
  const manualReviewThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: staleReview, error: reviewError } = await serverSupabase
    .from("transactions")
    .update({ status: "expired" })
    .eq("status", "pending")
    .eq("metadata->>manual_review_requested", "true")
    .lt("created_at", manualReviewThreshold)
    .select("id");
  if (reviewError) return NextResponse.json({ success: false, error: "Manual review cleanup failed" }, { status: 500 });
  const rateLimitRetention = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { error: rateLimitError } = await serverSupabase
    .from("api_rate_limits")
    .delete()
    .lt("window_started_at", rateLimitRetention);
  if (rateLimitError) return NextResponse.json({ success: false, error: "Rate limit cleanup failed" }, { status: 500 });
  return NextResponse.json({ success: true, expired: (stalePending?.length || 0) + (staleReview?.length || 0) });
}
