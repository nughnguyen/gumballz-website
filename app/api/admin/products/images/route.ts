import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Không đọc được tệp ảnh tải lên." }, { status: 400 });
  }
  const files = form.getAll("files");
  if (!files.length || files.length > 12 || files.some((file) => !(file instanceof File) || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
    return NextResponse.json({ success: false, error: "Chỉ nhận tối đa 12 ảnh JPG, PNG hoặc WebP, mỗi ảnh tối đa 5MB." }, { status: 400 });
  }
  const urls: string[] = [];
  for (const file of files as File[]) {
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `products/${crypto.randomUUID()}.${ext}`;
    const { error } = await serverSupabase.storage.from("game-account-screenshots").upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      console.error("Product image upload failed", { code:error.name, message:error.message });
      const message = /bucket not found/i.test(error.message)
        ? "Bucket ảnh chưa được tạo. Chạy supabase_product_images_storage_migration.sql trong Supabase SQL Editor."
        : `Supabase Storage không nhận ảnh: ${error.message}`;
      return NextResponse.json({ success: false, error: message }, { status: 503 });
    }
    urls.push(serverSupabase.storage.from("game-account-screenshots").getPublicUrl(path).data.publicUrl);
  }
  return NextResponse.json({ success: true, urls });
}
