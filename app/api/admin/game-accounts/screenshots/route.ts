import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/utils/adminAuth";
import { serverSupabase } from "@/app/utils/supabaseServer";
export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ success: false }, { status: 401 });
  const form = await request.formData(); const file = form.get("file");
  if (!(file instanceof File) || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return NextResponse.json({ success: false, error: "Chỉ nhận ảnh JPG, PNG hoặc WebP tối đa 5MB." }, { status: 400 });
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"; const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await serverSupabase.storage.from("game-account-screenshots").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ success: false, error: "Không tải được ảnh. Kiểm tra bucket game-account-screenshots." }, { status: 503 });
  return NextResponse.json({ success: true, url: serverSupabase.storage.from("game-account-screenshots").getPublicUrl(path).data.publicUrl });
}
