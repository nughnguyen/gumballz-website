import { NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { POST as syncCategory } from "@/app/api/admin/external-accounts/sync/route";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ success: false }, { status: 401 });
  const { data: categories, error } = await serverSupabase.from("external_game_account_categories").select("id").eq("is_active", true);
  if (error) return NextResponse.json({ success: false, error: "Không tải được danh mục cần đồng bộ." }, { status: 503 });
  const results: Array<{ categoryId: string; success: boolean; error?: string }> = [];
  for (const category of categories || []) {
    const response = await syncCategory(new Request("https://internal/api/admin/external-accounts/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ categoryId: category.id }),
    }));
    const result = await response.json();
    results.push({ categoryId: category.id, success: response.ok && Boolean(result.success), ...(result.error ? { error: result.error } : {}) });
  }
  return NextResponse.json({ success: results.every(result => result.success), results });
}
