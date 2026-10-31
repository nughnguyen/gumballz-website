import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const productId = new URL(request.url).searchParams.get("productId") || "";
  const { data, error } = await serverSupabase.from("product_game_accounts").select("id,product_id,inventory_type,username,password,status,transaction_id,created_at,sold_at").eq("product_id", productId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ success: false, error: "Không tải được kho tài khoản. Hãy áp dụng migration SQL." }, { status: 503 });
  return NextResponse.json({ success: true, data: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const mode = body?.mode === "single" ? "single" : "mystery";
  const accounts = Array.isArray(body?.accounts) ? body.accounts : [];
  if (!/^[0-9a-f-]{36}$/i.test(productId) || !accounts.length || accounts.length > 5000 || accounts.some((a: any) => typeof a.username !== "string" || typeof a.password !== "string" || !a.username.trim() || !a.password.trim())) return NextResponse.json({ success: false, error: "Dữ liệu tài khoản không hợp lệ." }, { status: 400 });
  const { data: product } = await serverSupabase.from("products").select("category,account_sale_mode").eq("id", productId).maybeSingle();
  if (product?.category !== "game_account" || product.account_sale_mode !== mode) return NextResponse.json({ success: false, error: "Sản phẩm hoặc kiểu kho không khớp." }, { status: 400 });
  const rows = accounts.map((a: any) => ({ product_id: productId, inventory_type: mode, username: a.username.trim(), password: a.password.trim() }));
  const { error } = await serverSupabase.from("product_game_accounts").insert(rows);
  if (error) return NextResponse.json({ success: false, error: error.code === "23505" ? "Tài khoản trùng hoặc sản phẩm acc lẻ đã có acc." : "Không thêm được tài khoản." }, { status: 400 });
  return NextResponse.json({ success: true, added: rows.length });
}
export async function DELETE(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ success: false }, { status: 400 });
  const { error } = await serverSupabase.from("product_game_accounts").delete().eq("id", id).eq("status", "available");
  if (error) return NextResponse.json({ success: false, error: "Không xóa được tài khoản." }, { status: 400 });
  return NextResponse.json({ success: true });
}
