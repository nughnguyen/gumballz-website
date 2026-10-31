import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { getAuthenticatedUser } from "@/app/utils/adminAuth";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const transactionId = new URL(request.url).searchParams.get("transactionId");
  if (!transactionId || !/^[0-9a-f-]{36}$/i.test(transactionId)) return NextResponse.json({ success: false }, { status: 400 });
  const { data: tx } = await serverSupabase.from("transactions").select("id,user_id,status,metadata").eq("id", transactionId).eq("user_id", user.id).maybeSingle();
  if (!tx || tx.status !== "success" || tx.metadata?.type !== "product" || typeof tx.metadata?.product_id !== "string") return NextResponse.json({ success: false, error: "Chưa có quyền tải sản phẩm này." }, { status: 403 });
  const { data: product } = await serverSupabase.from("products").select("download_url").eq("id", tx.metadata.product_id).maybeSingle();
  if (!product?.download_url) return NextResponse.json({ success: false, error: "Tệp tải hiện không khả dụng." }, { status: 404 });
  await serverSupabase.rpc("increment_product_download", { p_product_id: tx.metadata.product_id });
  return NextResponse.json({ success: true, url: product.download_url }, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
