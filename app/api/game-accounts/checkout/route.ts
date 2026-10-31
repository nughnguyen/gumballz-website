import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/app/utils/adminAuth";
import { checkRateLimit, rateLimitResponse } from "@/app/utils/rateLimit";
import { serverSupabase } from "@/app/utils/supabaseServer";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Đăng nhập để mua acc." }, { status: 401 });
  const rate = await checkRateLimit(request, "game-account-checkout", 8, 60);
  if (!rate.allowed) return rateLimitResponse(rate);
  const body = await request.json().catch(() => null);
  const offerId = typeof body?.offerId === "string" ? body.offerId : "";
  const packId = typeof body?.packId === "string" ? body.packId : null;
  const quantity = body?.quantity === undefined ? 1 : Number(body.quantity);
  const method = body?.paymentMethod;
  if (!/^[0-9a-f-]{36}$/i.test(offerId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 50 || !["wallet", "banking"].includes(method)) {
    return NextResponse.json({ success: false, error: "Yêu cầu mua hàng không hợp lệ." }, { status: 400 });
  }
  const { data: offer } = await serverSupabase.from("game_account_offers").select("id,title,offer_type,price_vnd,is_active").eq("id", offerId).eq("is_active", true).maybeSingle();
  if (!offer) return NextResponse.json({ success: false, error: "Mặt hàng không khả dụng." }, { status: 404 });
  if (offer.offer_type !== "community" && quantity !== 1) return NextResponse.json({ success: false, error: "Mặt hàng này chỉ mua được một tài khoản mỗi lượt." }, { status: 400 });
  const amount = Number(offer.price_vnd) * quantity;
  if (!Number.isSafeInteger(amount) || amount > 100_000_000) return NextResponse.json({ success: false, error: "Tổng thanh toán vượt giới hạn cho phép." }, { status: 400 });
  if (offer.offer_type === "mystery") {
    if (!packId || !/^[0-9a-f-]{36}$/i.test(packId)) return NextResponse.json({ success: false, error: "Không tìm thấy mã túi mù." }, { status: 400 });
    const { data: pack } = await serverSupabase.from("game_account_packs").select("id").eq("id", packId).eq("offer_id", offerId).eq("status", "available").maybeSingle();
    if (!pack) return NextResponse.json({ success: false, error: "Mã túi này vừa được mua hoặc không còn." }, { status: 409 });
  }
  if (method === "wallet") {
    const { data, error } = await serverSupabase.rpc("buy_game_account_offer_with_wallet", { p_user_id: user.id, p_offer_id: offerId, p_pack_id: packId, p_quantity: quantity });
    if (error) {
      const messages: Record<string, string> = { wallet_balance_insufficient: "Số dư ví không đủ.", game_account_offer_unavailable: "Mặt hàng không còn khả dụng.", game_account_pack_out_of_stock: "Mã túi này vừa được mua.", game_account_inventory_out_of_stock: "Kho không đủ số lượng acc bạn chọn.", invalid_game_account_quantity: "Số lượng acc không hợp lệ.", game_account_amount_too_large: "Tổng thanh toán vượt giới hạn cho phép." };
      return NextResponse.json({ success: false, error: messages[error.message] || "Thanh toán ví thất bại." }, { status: 409 });
    }
    const purchase = Array.isArray(data) ? data[0] : null;
    return NextResponse.json({ success: true, id: purchase.purchase_transaction_id, amount, paidWithWallet: true, balance: purchase.remaining_balance });
  }
  const content = `GZ${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  const metadata = { type: "game_account_offer_purchase", offer_id: offer.id, offer_title: offer.title, offer_type: offer.offer_type, quantity, ...(packId ? { pack_id: packId } : {}) };
  const { data: transaction, error } = await serverSupabase.from("transactions").insert({ user_id: user.id, amount, description: content, status: amount === 0 ? "success" : "pending", rewarded: amount === 0, method: "Banking", metadata }).select("id").single();
  if (error || !transaction) {
    if (error?.message.includes("out_of_stock")) return NextResponse.json({ success: false, error: "Kho không đủ số lượng acc bạn chọn." }, { status: 409 });
    return NextResponse.json({ success: false, error: "Không tạo được đơn hàng." }, { status: 500 });
  }
  return NextResponse.json({ success: true, id: transaction.id, amount, content, free: amount === 0 });
}
