import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";
const protectedPurchaseTypes = ["product", "key", "game_account", "game_account_offer_purchase", "external_game_account"];

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const type = body?.type;
  const id = typeof body?.id === "string" ? body.id : null;
  if (type !== "transaction" && type !== "wallet" && type !== "all") {
    return NextResponse.json({ success: false, error: "Loại lịch sử không hợp lệ." }, { status: 400 });
  }
  if (id && !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ success: false, error: "Mục lịch sử không hợp lệ." }, { status: 400 });
  }
  if (type === "transaction" && id) {
    const { data: transaction, error: lookupError } = await serverSupabase
      .from("transactions")
      .select("metadata")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (lookupError) return NextResponse.json({ success: false, error: "Không kiểm tra được giao dịch." }, { status: 503 });
    if (!transaction) return NextResponse.json({ success: false, error: "Không tìm thấy giao dịch của tài khoản này." }, { status: 404 });
    if (protectedPurchaseTypes.includes(transaction.metadata?.type)) {
      return NextResponse.json({ success: false, error: "Không thể xóa giao dịch mua tool, key hoặc acc." }, { status: 409 });
    }
  }

  if (type === "all" && id) return NextResponse.json({ success: false, error: "Không thể xóa riêng lẻ loại lịch sử này." }, { status: 400 });
  const types = type === "all" ? ["transaction", "wallet"] as const : [type] as const;
  const results = await Promise.all(types.map(async itemType => {
    const table = itemType === "transaction" ? "transactions" : "wallet_ledger";
    let query = serverSupabase.from(table).update({ hidden_from_history: true }).eq("user_id", user.id);
    if (id) query = query.eq("id", id);
    if (itemType === "transaction") query = query.not("metadata->>type", "in", `(${protectedPurchaseTypes.join(",")})`);
    return query.select("id");
  }));
  if (results.some(result => result.error)) return NextResponse.json({ success: false, error: "Không cập nhật được lịch sử. Hãy chạy migration tài khoản trước." }, { status: 503 });
  const hidden = results.reduce((total, result) => total + (result.data?.length || 0), 0);
  if (id && hidden === 0) return NextResponse.json({ success: false, error: "Không tìm thấy mục lịch sử của tài khoản này." }, { status: 404 });

  return NextResponse.json({ success: true, hidden }, { headers: { "Cache-Control": "private, no-store" } });
}
