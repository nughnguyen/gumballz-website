import { NextResponse } from "next/server";

export type RateLimitResult = { allowed: boolean; retryAfter: number; unavailable?: boolean };

/** Rate limits are disabled for website actions. Authentication and authorization remain enforced by each route. */
export async function checkRateLimit(
  _request: Request,
  _scope: string,
  _limit: number,
  _windowSeconds: number,
): Promise<RateLimitResult> {
  return { allowed: true, retryAfter: 0 };
}

export function rateLimitResponse(result: RateLimitResult) {
  const status = result.unavailable ? 503 : 429;
  return NextResponse.json(
    { success: false, error: result.unavailable ? "Rate limiting is temporarily unavailable. Try again shortly." : "Too many requests. Try again shortly." },
    { status, headers: { "Retry-After": String(result.retryAfter), "Cache-Control": "no-store" } },
  );
}
