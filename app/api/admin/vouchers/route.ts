import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { requireAdmin } from "@/app/utils/adminAuth";

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const { data, error } = await serverSupabase.from("discount_vouchers").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ success: false, error: "Không tải được voucher. Hãy chạy migration trước." }, { status: 503 });
  return NextResponse.json({ success: true, data: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const discount_percent = body?.discount_percent;
  const usage_limit = body?.usage_limit === "" || body?.usage_limit == null ? null : Number(body.usage_limit);
  if (!/^[A-Z0-9_-]{3,32}$/.test(code) || !Number.isInteger(discount_percent) || discount_percent < 1 || discount_percent > 90 || (usage_limit !== null && (!Number.isInteger(usage_limit) || usage_limit < 1))) return NextResponse.json({ success: false, error: "Kiểm tra mã, phần trăm giảm và giới hạn lượt." }, { status: 400 });
  const { data, error } = await serverSupabase.from("discount_vouchers").upsert({ code, discount_percent, usage_limit, is_active: true, starts_at: body?.starts_at || null, expires_at: body?.expires_at || null, product_id: body?.product_id || null }, { onConflict: "code" }).select().single();
  if (error) return NextResponse.json({ success: false, error: "Không lưu được voucher. Mã có thể đã tồn tại." }, { status: 400 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.code !== "string" || typeof body?.is_active !== "boolean") return NextResponse.json({ success: false }, { status: 400 });
  const { error } = await serverSupabase.from("discount_vouchers").update({ is_active: body.is_active }).eq("code", body.code.toUpperCase());
  if (error) return NextResponse.json({ success: false, error: "Không cập nhật được voucher." }, { status: 400 });
  return NextResponse.json({ success: true });
}
