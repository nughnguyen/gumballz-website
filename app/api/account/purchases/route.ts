import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { getAuthenticatedUser } from "@/app/utils/adminAuth";
import { accountsForTransaction, readCommunityAccounts } from "@/app/utils/communityAccountFile";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ success: false }, { status: 401 });
  const { data, error } = await serverSupabase.from("transactions").select("id,amount,status,metadata,created_at").eq("user_id", user.id).in("metadata->>type", ["product", "key", "game_account", "game_account_offer_purchase", "lucky_wheel_spin_fee", "lucky_wheel_prize", "wallet_topup"]).order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ success: false, error: "Could not load purchases" }, { status: 503 });
  const purchases = data || [];
  const communityIds = [...new Set(purchases.filter((row) => row.metadata?.type === "game_account_offer_purchase" && row.status === "success" && row.metadata?.offer_type === "community").map((row) => row.metadata.offer_id).filter((id): id is string => typeof id === "string"))];
  if (communityIds.length) {
    try {
      const accounts = await readCommunityAccounts();
      for (const purchase of purchases) {
        if (purchase.status !== "success" || purchase.metadata?.type !== "game_account_offer_purchase" || purchase.metadata?.offer_type !== "community" || typeof purchase.metadata.offer_id !== "string") continue;
        purchase.metadata.game_account_deliveries = accountsForTransaction(accounts, purchase.id, Number(purchase.metadata.quantity) || 1);
      }
    } catch {
      return NextResponse.json({ success: false, error: "Không đọc được kho acc cộng đồng." }, { status: 503 });
    }
  }
  return NextResponse.json({ success: true, data: purchases }, { headers: { "Cache-Control": "private, no-store" } });
}

