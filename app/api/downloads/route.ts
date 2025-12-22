import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("downloads")
      .select("*")
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
        const body = await req.json();
        const { secret, title, description, image_url, download_url, version, file_size } = body;

        const validSecret = process.env.API_SECRET_KEY || "default_insecure_secret";
        if (secret !== validSecret) {
             return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
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
