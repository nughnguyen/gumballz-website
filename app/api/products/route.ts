import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { requireAdmin } from "@/app/utils/adminAuth";

export const dynamic = "force-dynamic";

const publicFields = "id,title,slug,category,description,cover_image_url,demo_url,price_vnd,key_duration_days,stock_count,tags,highlights,is_featured,created_at";
const adminFields = `${publicFields},download_url,is_active,updated_at`;
const httpsOrNull = (value: unknown) => value === null || value === "" || (typeof value === "string" && value.length <= 2048 && /^https:\/\//i.test(value));

export async function GET(request: Request) {
  const manage = new URL(request.url).searchParams.get("manage") === "1";
  if (manage && !(await requireAdmin(request))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  let query = serverSupabase.from("products").select(manage ? adminFields : publicFields).order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  if (!manage) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: "Product catalog is unavailable" }, { status: 503 });
  return NextResponse.json({ success: true, data: data || [] }, { headers: { "Cache-Control": manage ? "private, no-store" : "public, max-age=60, stale-while-revalidate=300" } });
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const { id, title, slug, category = "tool", description, cover_image_url, demo_url, download_url, price_vnd, key_duration_days, stock_count = null, tags = [], highlights = [], is_featured = false, is_active = true } = body || {};
  const valid = typeof title === "string" && title.trim().length >= 2 && title.length <= 120 && typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && ["tool", "key", "coiz"].includes(category) && typeof description === "string" && description.length <= 6000 && Number.isSafeInteger(price_vnd) && price_vnd >= 0 && price_vnd <= 100000000 && httpsOrNull(cover_image_url) && httpsOrNull(demo_url) && httpsOrNull(download_url) && (category !== "tool" || typeof download_url === "string" && /^https:\/\//i.test(download_url)) && (category !== "key" || [1, 7, 30, 365].includes(key_duration_days) && price_vnd > 0) && (stock_count === null || Number.isInteger(stock_count) && stock_count >= 0 && stock_count <= 1000000) && Array.isArray(tags) && tags.length <= 20 && tags.every((tag: unknown) => typeof tag === "string" && tag.trim().length <= 40) && Array.isArray(highlights) && highlights.length <= 12 && highlights.every((item: unknown) => typeof item === "string" && item.length <= 160) && typeof is_featured === "boolean" && typeof is_active === "boolean";
  if (!valid) return NextResponse.json({ success: false, error: "Thông tin sản phẩm chưa hợp lệ. Kiểm tra danh mục, giá, kho và liên kết." }, { status: 400 });

  const values = { title: title.trim(), slug, category, description: description.trim(), cover_image_url: cover_image_url || null, demo_url: demo_url || null, download_url: download_url || null, price_vnd, key_duration_days: category === "key" ? key_duration_days : null, stock_count, tags: tags.map((tag: string) => tag.trim()).filter(Boolean), highlights, is_featured, is_active };
  const query = id ? serverSupabase.from("products").update(values).eq("id", id) : serverSupabase.from("products").insert(values);
  const { data, error } = await query.select(adminFields).single();
  if (error) return NextResponse.json({ success: false, error: "Không lưu được sản phẩm. Kiểm tra slug hoặc schema Supabase mới." }, { status: 400 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "Missing product id" }, { status: 400 });
  const { error } = await serverSupabase.from("products").update({ is_active: false }).eq("id", id);
  if (error) return NextResponse.json({ success: false, error: "Could not archive product" }, { status: 400 });
  return NextResponse.json({ success: true });
}
