import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { getAuthenticatedUser } from "@/app/utils/adminAuth";
import { checkRateLimit, rateLimitResponse } from "@/app/utils/rateLimit";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (user) {
    const rate = await checkRateLimit(request, 'product-checkout', 12, 60);
    if (!rate.allowed) return rateLimitResponse(rate);
  }
  if (!user) return NextResponse.json({ success: false, error: "Đăng nhập để mua sản phẩm." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  if (!productId || productId.length > 64) return NextResponse.json({ success: false, error: "Sản phẩm không hợp lệ." }, { status: 400 });

  const { data: product } = await serverSupabase.from("products").select("id,title,category,price_vnd,key_duration_days,stock_count,is_active").eq("id", productId).eq("is_active", true).maybeSingle();
  if (!product) return NextResponse.json({ success: false, error: "Không tìm thấy sản phẩm." }, { status: 404 });
  if (product.category === "coiz") return NextResponse.json({ success: true, coiz: true, href: "/store/coiz" });
  if (product.stock_count === 0) return NextResponse.json({ success: false, error: "Sản phẩm đang hết hàng." }, { status: 409 });

  const content = `GZ${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  const free = product.price_vnd === 0;
  const metadata = product.category === "key"
    ? { type: "key", category: "mod", duration_days: product.key_duration_days, product_id: product.id, product_title: product.title, method: "Banking" }
    : { type: "product", product_id: product.id, product_title: product.title, method: "Banking" };

  const { data: transaction, error } = await serverSupabase.from("transactions").insert({ user_id: user.id, amount: product.price_vnd, description: content, status: free ? "success" : "pending", rewarded: free, method: "Banking", metadata }).select("id").single();
  if (error || !transaction) return NextResponse.json({ success: false, error: "Không thể tạo đơn hàng." }, { status: 500 });
  return NextResponse.json({ success: true, id: transaction.id, amount: product.price_vnd, content, free, category: product.category });
}
