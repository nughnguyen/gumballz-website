import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const body = await request.json().catch(() => null);
  const files = body?.files;
  if (!Array.isArray(files) || !files.length || files.length > 12 || files.some((file) => !file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || !Number.isInteger(file.size) || file.size < 1 || file.size > 10 * 1024 * 1024)) {
    return NextResponse.json({ success: false, error: "Chỉ nhận tối đa 12 ảnh JPG, PNG hoặc WebP, mỗi ảnh tối đa 10MB." }, { status: 400 });
  }
  const uploads: { path:string; token:string; url:string }[] = [];
  for (const file of files as { type:string }[]) {
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `products/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await serverSupabase.storage.from("game-account-screenshots").createSignedUploadUrl(path);
    if (error) {
      console.error("Product image upload token creation failed", { code:error.name, message:error.message });
      const message = /bucket not found/i.test(error.message)
        ? "Bucket ảnh chưa được tạo. Chạy supabase_product_images_storage_migration.sql trong Supabase SQL Editor."
        : `Không thể chuẩn bị upload lên Supabase Storage: ${error.message}`;
      return NextResponse.json({ success: false, error: message }, { status: 503 });
    }
    uploads.push({ path, token:data.token, url:serverSupabase.storage.from("game-account-screenshots").getPublicUrl(path).data.publicUrl });
  }
  return NextResponse.json({ success: true, uploads });
}
