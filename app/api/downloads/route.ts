import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/app/utils/supabaseServer";
import { requireAdmin } from "@/app/utils/adminAuth";

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await serverSupabase
      .from("downloads")
      .select("id,title,description,image_url,version,file_size,created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    // For Admin to add download
    try {
        if (!(await requireAdmin(req))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        const body = await req.json();
        const { title, description, image_url, download_url, version, file_size } = body;
        if (typeof title !== "string" || title.trim().length < 2 || title.length > 120 || typeof download_url !== "string" || !/^https:\/\//i.test(download_url) || download_url.length > 2048 || (image_url && (typeof image_url !== "string" || !/^https:\/\//i.test(image_url)))) return NextResponse.json({ success: false, error: "Invalid product details" }, { status: 400 });

        const { data, error } = await serverSupabase
            .from("downloads")
            .insert({ 
                title, description, image_url, download_url, version, file_size, is_active: true
             })
            .select();
        
        if (error) throw error;

        return NextResponse.json({ success: true, data });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
