import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { data: transactions, error } = await serverSupabase
    .from("transactions")
    .select("id,metadata,created_at")
    .eq("user_id", user.id)
    .eq("status", "success")
    .eq("metadata->>type", "product")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) return NextResponse.json({ success: false, error: "Không tải được danh sách sản phẩm đã mua." }, { status: 503 });

  const productIds = [...new Set((transactions || [])
    .map(transaction => transaction.metadata?.product_id)
    .filter((id): id is string => typeof id === "string"))];
  const { data: products, error: productsError } = productIds.length
    ? await serverSupabase.from("products").select("id,title").in("id", productIds)
    : { data: [], error: null };
  if (productsError) return NextResponse.json({ success: false, error: "Không tải được thông tin sản phẩm đã mua." }, { status: 503 });

  const titles = new Map((products || []).map(product => [product.id, product.title]));
  const data = (transactions || []).map(transaction => ({
    transaction_id: transaction.id,
    title: titles.get(transaction.metadata?.product_id) || transaction.metadata?.product_title || "Sản phẩm đã mua",
    created_at: transaction.created_at,
  }));
  return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "private, no-store" } });
}
