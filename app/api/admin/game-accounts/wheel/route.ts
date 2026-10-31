import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const { data, error } = await serverSupabase.from("lucky_wheel_config").select("is_enabled,spin_cost_vnd,segments,updated_at").eq("id", true).single();
  if (error) return NextResponse.json({ success: false, error: "Chưa có cấu hình vòng quay. Hãy áp dụng migration." }, { status: 503 });
  const { data: offers } = await serverSupabase.from("game_account_offers").select("id,title,offer_type,is_active").eq("is_active", true);
  return NextResponse.json({ success: true, data, offers: offers || [] }, { headers: { "Cache-Control": "private,no-store" } });
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const body = await request.json().catch(() => null);
  const segments = Array.isArray(body?.segments) ? body.segments : [];
  const invalid = typeof body?.is_enabled !== "boolean"
    || !Number.isSafeInteger(body.spin_cost_vnd) || body.spin_cost_vnd < 0 || body.spin_cost_vnd > 100_000_000
    || segments.length < 2 || segments.length > 12
    || segments.some((segment: any) => !segment || typeof segment.label !== "string" || !segment.label.trim() || segment.label.length > 60
      || !Number.isInteger(segment.weight) || segment.weight < 1 || segment.weight > 10_000
      || !["wallet", "account"].includes(segment.type)
      || (segment.type === "wallet" ? (!Number.isSafeInteger(segment.amount) || segment.amount < 1 || segment.amount > 100_000_000) : typeof segment.offer_id !== "string"));
  if (invalid) return NextResponse.json({ success: false, error: "Vòng quay cần 2–12 giải hợp lệ và trọng số từ 1 đến 10.000." }, { status: 400 });

  for (const segment of segments.filter((item: any) => item.type === "account")) {
    const { data } = await serverSupabase.from("game_account_offers").select("id")
      .eq("id", segment.offer_id).eq("offer_type", "individual").eq("is_active", true).maybeSingle();
    if (!data) return NextResponse.json({ success: false, error: "Giải acc chỉ nhận mặt hàng acc riêng đang hoạt động." }, { status: 400 });
  }
  const clean = segments.map((segment: any) => ({
    label: segment.label.trim(), type: segment.type, weight: segment.weight,
    ...(segment.type === "wallet" ? { amount: segment.amount } : { offer_id: segment.offer_id }),
    color: typeof segment.color === "string" && /^#[0-9a-f]{6}$/i.test(segment.color) ? segment.color : "#3BA7F2",
  }));
  const { error } = await serverSupabase.from("lucky_wheel_config").upsert({ id: true, is_enabled: body.is_enabled, spin_cost_vnd: body.spin_cost_vnd, segments: clean, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ success: false, error: "Không lưu được cấu hình vòng quay." }, { status: 400 });
  return NextResponse.json({ success: true });
}
