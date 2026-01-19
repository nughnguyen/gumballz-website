import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const hwid = searchParams.get('hwid');

    if (!key) {
        return NextResponse.json({ valid: false, message: "Missing key" }, { status: 400 });
    }

    // Check if key exists and is valid (expires_at > now)
    const now = new Date().toISOString();
    
    // Select key info
    const { data: keyData, error } = await supabase
      .from('roblox_keys')
      .select('id, expires_at, is_used, metadata')
      .eq('key_value', key)
      .gt('expires_at', now)
      .maybeSingle();

    if (error || !keyData) {
        return NextResponse.json({ valid: false, message: "Invalid or Expired Key" }, { status: 200 });
    }

    // HWID Binding Logic
    const currentMetadata = keyData.metadata || {};
    const boundHwid = currentMetadata.hwid;

    if (hwid) {
        if (!boundHwid) {
            // Bind this key to the current HWID
            const newMetadata = { ...currentMetadata, hwid: hwid };
            await supabase
                .from('roblox_keys')
                .update({ metadata: newMetadata, is_used: true })
                .eq('id', keyData.id);
        } else if (boundHwid !== hwid) {
            // HWID Mismatch
            return NextResponse.json({ 
                valid: false, 
                message: "Key is bound to another device!" 
            }, { status: 200 });
        }
    }

    // Key is valid
    return NextResponse.json({ 
        valid: true, 
        expires_at: keyData.expires_at,
        message: "Key Valid"
    }, { 
        status: 200,
        headers: {
            'Cache-Control': 'no-store, max-age=0'
        }
    });

  } catch (error) {
    console.error('Fatal error checking key:', error);
    return NextResponse.json({ valid: false, message: "System Error" }, { status: 500 });
  }
}
