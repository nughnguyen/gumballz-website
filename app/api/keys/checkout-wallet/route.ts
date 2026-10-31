import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { getAuthenticatedUser } from "@/app/utils/adminAuth";
import { checkRateLimit, rateLimitResponse } from "@/app/utils/rateLimit";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Đăng nhập để thanh toán bằng ví." }, { status: 401 });

  const rate = await checkRateLimit(request, "key-wallet-checkout", 8, 60);
  if (!rate.allowed) return rateLimitResponse(rate);

  const body = await request.json().catch(() => null);
  const category = body?.category === "roblox" ? "roblox" : body?.category === "mod" ? "mod" : "";
  const durationDays = Number(body?.durationDays);
  if (!category || ![1, 7, 30, 365].includes(durationDays)) {
    return NextResponse.json({ success: false, error: "Gói key không hợp lệ." }, { status: 400 });
  }

  const { data, error } = await serverSupabase.rpc("purchase_key_with_wallet", {
    p_user_id: user.id,
    p_category: category,
    p_duration_days: durationDays,
  });
  if (error) {
    if (error.message === "wallet_balance_insufficient") {
      return NextResponse.json({ success: false, error: "Số dư ví không đủ để mua gói key này." }, { status: 409 });
    }
    if (["invalid_key_category", "invalid_key_package"].includes(error.message)) {
      return NextResponse.json({ success: false, error: "Gói key không hợp lệ." }, { status: 400 });
    }
    console.error("Wallet key checkout failed:", error);
    return NextResponse.json({ success: false, error: "Không thể thanh toán key bằng ví lúc này." }, { status: 503 });
  }

  const purchase = Array.isArray(data) ? data[0] : null;
  if (!purchase?.purchase_transaction_id) {
    return NextResponse.json({ success: false, error: "Không thể hoàn tất thanh toán bằng ví." }, { status: 503 });
  }
  return NextResponse.json({ success: true, id: purchase.purchase_transaction_id });
}
