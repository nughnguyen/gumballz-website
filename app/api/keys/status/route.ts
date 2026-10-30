import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { checkRateLimit, rateLimitResponse } from "@/app/utils/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rate = await checkRateLimit(request, 'key-status', 30, 60);
  if (!rate.allowed) return rateLimitResponse(rate);
  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key.trim() : "";
  if (key.length < 6 || key.length > 100 || !/^[A-Za-z0-9_-]+$/.test(key)) {
    return NextResponse.json({ success: false, error: "Nhập key hợp lệ để kiểm tra." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const { data: modKey } = await serverSupabase.from("mod_keys").select("key_type,expires_at,is_active,device_id,max_devices").eq("key_value", key).maybeSingle();
  if (modKey) {
    const expired = new Date(modKey.expires_at).getTime() <= Date.now();
    return NextResponse.json({ success: true, data: { status: expired ? "expired" : modKey.is_active ? "active" : "inactive", type: modKey.key_type, category: "mod", expiresAt: modKey.expires_at, deviceBound: Boolean(modKey.device_id), maxDevices: modKey.max_devices ?? 1 } }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const { data: robloxKey } = await serverSupabase.from("roblox_keys").select("key_type,category,expires_at,is_used,metadata").eq("key_value", key).maybeSingle();
  if (robloxKey) {
    const expired = new Date(robloxKey.expires_at).getTime() <= Date.now();
    return NextResponse.json({ success: true, data: { status: expired ? "expired" : "active", type: robloxKey.key_type, category: robloxKey.category, expiresAt: robloxKey.expires_at, deviceBound: Boolean(robloxKey.metadata?.hwid), maxDevices: 1 } }, { headers: { "Cache-Control": "private, no-store" } });
  }

  return NextResponse.json({ success: false, error: "Không tìm thấy key. Kiểm tra lại mã và thử lần nữa." }, { status: 404, headers: { "Cache-Control": "no-store" } });
}
