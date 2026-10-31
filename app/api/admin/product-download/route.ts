import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 403 });
  const transactionId = new URL(request.url).searchParams.get("transactionId");
  if (!transactionId || !/^[0-9a-f-]{36}$/i.test(transactionId)) return NextResponse.json({ success: false }, { status: 400 });
  const { data: transaction } = await serverSupabase.from("transactions")
    .select("id,status,metadata").eq("id", transactionId).maybeSingle();
  if (!transaction || transaction.status !== "success" || transaction.metadata?.type !== "product" || typeof transaction.metadata?.product_id !== "string") {
    return NextResponse.json({ success: false, error: "Sản phẩm này chưa được thanh toán thành công." }, { status: 403 });
  }
  const productId = transaction.metadata.product_id;
  const { data: product } = await serverSupabase.from("products").select("download_url").eq("id", productId).maybeSingle();
  if (!product?.download_url) return NextResponse.json({ success: false, error: "Tệp tải hiện không khả dụng." }, { status: 404 });
  await serverSupabase.rpc("increment_product_download", { p_product_id: productId });
  return NextResponse.json({ success: true, url: product.download_url }, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
