import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";

export type RateLimitResult = { allowed: boolean; retryAfter: number; unavailable?: boolean };

/** Shared fixed-window limiter. Only a keyed hash of the client IP is persisted. */
export async function checkRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const secret = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return { allowed: false, retryAfter: windowSeconds, unavailable: true };

  const ip = request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  const bucketKey = createHmac("sha256", secret).update(`${scope}\0${ip}`).digest("hex");
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  let data: unknown;
  let error: unknown;
  try {
    ({ data, error } = await serverSupabase.rpc("consume_api_rate_limit", {
      p_bucket_key: bucketKey,
      p_window_start: windowStart.toISOString(),
      p_limit: limit,
    }));
  } catch {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((windowStart.getTime() + windowMs - now) / 1000)), unavailable: true };
  }

  if (error) {
    console.error("Persistent rate limit check failed");
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((windowStart.getTime() + windowMs - now) / 1000)), unavailable: true };
  }

  return {
    allowed: data === true,
    retryAfter: Math.max(1, Math.ceil((windowStart.getTime() + windowMs - now) / 1000)),
  };
}

export function rateLimitResponse(result: RateLimitResult) {
  const status = result.unavailable ? 503 : 429;
  return NextResponse.json(
    { success: false, error: result.unavailable ? "Rate limiting is temporarily unavailable. Try again shortly." : "Too many requests. Try again shortly." },
    { status, headers: { "Retry-After": String(result.retryAfter), "Cache-Control": "no-store" } },
  );
}
