import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/utils/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorized = await requireAdmin(request);
  return NextResponse.json(
    { authorized },
    { status: authorized ? 200 : 403, headers: { "Cache-Control": "private, no-store" } },
  );
}
