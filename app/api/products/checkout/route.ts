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
  const voucherCode = typeof body?.voucherCode === "string" ? body.voucherCode.trim().toUpperCase() : "";
  if (voucherCode && !/^[A-Z0-9_-]{3,32}$/.test(voucherCode)) return NextResponse.json({ success: false, error: "Mã voucher không hợp lệ." }, { status: 400 });
  if (body?.paymentMethod !== "wallet" && body?.paymentMethod !== "banking") return NextResponse.json({ success: false, error: "Invalid payment method." }, { status: 400 });
  const paymentMethod: "wallet" | "banking" = body.paymentMethod;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) return NextResponse.json({ success: false, error: "Invalid product id." }, { status: 400 });

  const { data: product } = await serverSupabase.from("products").select("id,title,category,price_vnd,discount_percent,key_duration_days,stock_count,is_active,account_sale_mode").eq("id", productId).eq("is_active", true).maybeSingle();
  if (!product) return NextResponse.json({ success: false, error: "Không tìm thấy sản phẩm." }, { status: 404 });
  let voucherDiscount = 0;
  if (voucherCode) {
    const { data: voucher } = await serverSupabase.from("discount_vouchers").select("code,discount_percent,is_active,starts_at,expires_at,usage_limit,usage_count,product_id").eq("code", voucherCode).maybeSingle();
    const now = Date.now();
    if (!voucher || !voucher.is_active || (voucher.starts_at && Date.parse(voucher.starts_at) > now) || (voucher.expires_at && Date.parse(voucher.expires_at) <= now) || (voucher.usage_limit !== null && voucher.usage_count >= voucher.usage_limit) || (voucher.product_id && voucher.product_id !== product.id)) return NextResponse.json({ success: false, error: "Mã voucher không hợp lệ hoặc đã hết hạn." }, { status: 400 });
    voucherDiscount = voucher.discount_percent;
  }
  if (product.category === "coiz") return NextResponse.json({ success: true, coiz: true, href: "/store/coiz" });
  if (product.stock_count === 0) return NextResponse.json({ success: false, error: "Sản phẩm đang hết hàng." }, { status: 409 });
  if (product.category !== "key" && product.category !== "game_account") {
    const { data: previousPurchase, error: purchaseLookupError } = await serverSupabase.from("transactions")
      .select("id").eq("user_id", user.id).eq("status", "success")
      .eq("metadata->>type", "product").eq("metadata->>product_id", product.id).limit(1).maybeSingle();
    if (purchaseLookupError) return NextResponse.json({ success: false, error: "Could not verify product purchase history." }, { status: 503 });
    if (previousPurchase) return NextResponse.json({ success: false, error: "You already purchased this product." }, { status: 409 });
  }

  if (paymentMethod === "wallet") {
    const { data, error } = await serverSupabase.rpc("purchase_product_with_wallet", {
      p_user_id: user.id,
      p_product_id: product.id,
      p_voucher_code: voucherCode || null,
    });
    if (error) {
      const errors: Record<string, { message: string; status: number }> = {
        wallet_balance_insufficient: { message: "Số dư ví không đủ để thanh toán sản phẩm này.", status: 409 },
        product_already_purchased: { message: "You already purchased this product.", status: 409 },
        product_out_of_stock: { message: "Sản phẩm vừa hết hàng.", status: 409 },
        game_account_out_of_stock: { message: "Kho tài khoản vừa hết hàng.", status: 409 },
        product_unavailable: { message: "Sản phẩm hiện không khả dụng.", status: 409 },
        product_not_payable_by_wallet: { message: "Sản phẩm này không thể thanh toán bằng ví.", status: 400 },
        voucher_invalid: { message: "Voucher vừa hết lượt hoặc không còn hợp lệ.", status: 409 },
      };
      const knownError = errors[error.message];
      if (knownError) return NextResponse.json({ success: false, error: knownError.message }, { status: knownError.status });
      console.error("Wallet checkout failed:", error);
      return NextResponse.json({ success: false, error: "Không thể thanh toán bằng ví lúc này." }, { status: 503 });
    }
    const purchase = Array.isArray(data) ? data[0] : null;
    if (!purchase?.purchase_transaction_id) {
      return NextResponse.json({ success: false, error: "Không thể hoàn tất thanh toán bằng ví." }, { status: 503 });
    }
    return NextResponse.json({
      success: true,
      id: purchase.purchase_transaction_id,
      amount: Math.round(Math.round(product.price_vnd * (100 - (product.discount_percent || 0)) / 100) * (100 - voucherDiscount) / 100),
      category: product.category,
      paidWithWallet: true,
      balance: Number(purchase.remaining_balance) || 0,
    });
  }

  const content = `GZ${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  const payableAmount = Math.max(0, Math.round(Math.round(product.price_vnd * (100 - (product.discount_percent || 0)) / 100) * (100 - voucherDiscount) / 100));
  const free = payableAmount === 0;
  const metadata = product.category === "key"
    ? { type: "key", category: "mod", duration_days: product.key_duration_days, product_id: product.id, product_title: product.title, method: "Banking" }
    : product.category === "game_account"
      ? { type: "game_account", product_id: product.id, product_title: product.title, account_sale_mode: product.account_sale_mode, method: "Banking" }
    : { type: "product", product_id: product.id, product_title: product.title, method: "Banking" };

  const { data: transaction, error } = await serverSupabase.from("transactions").insert({ user_id: user.id, amount: payableAmount, description: content, status: free ? "success" : "pending", rewarded: free, method: "Banking", metadata }).select("id").single();
  if (error || !transaction) {
    if (error?.message?.includes("game_account_out_of_stock")) return NextResponse.json({ success: false, error: "Kho tài khoản vừa hết hàng." }, { status: 409 });
    return NextResponse.json({ success: false, error: "Không thể tạo đơn hàng." }, { status: 500 });
  }
  if (voucherCode) { const { data: voucher } = await serverSupabase.from("discount_vouchers").select("usage_count").eq("code", voucherCode).single(); if (voucher) await serverSupabase.from("discount_vouchers").update({ usage_count: voucher.usage_count + 1 }).eq("code", voucherCode); }
  return NextResponse.json({ success: true, id: transaction.id, amount: payableAmount, content, free, category: product.category });
}
