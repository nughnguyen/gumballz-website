import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const configName = searchParams.get("config_name") || "LQM Default";

    const { data, error } = await supabase
      .from("mod_configs")
      .select("*")
      .eq("config_name", configName)
      .eq("is_active", true)
      .single();

    if (error) {
        // If exact match not found, try finding any active config (optional, or just return error)
        return NextResponse.json({ success: false, error: "Config not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      config_name: data.config_name,
      version: data.version_code,
      data: data.config_data
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    // For Admin to update config
    try {
        const body = await req.json();
        const { secret, config_name, config_data, admin_name } = body;

        // Simple secret check
        if(secret !== "gumballzAdminSecret123") {
             return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("mod_configs")
            .upsert({ 
                config_name: config_name,
                config_data: config_data,
                is_active: true,
                last_modified_by: admin_name || "Unknown Admin",
                updated_at: new Date()
             }, { onConflict: 'config_name' })
            .select();
        
        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
