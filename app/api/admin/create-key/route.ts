
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

function generateKey(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { durationDays, type = 'PREMIUM', customKey, adminSecret, maxDevices = 1 } = body;

    // Simple security check (replace with real auth in production)
    if (adminSecret !== process.env.API_SECRET_KEY && adminSecret !== 'gumballz_admin_2025') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const prefix = type === 'FREE' ? 'GUMFREE' : 'GUMBALLZ';
    const keyValue = customKey || generateKey(prefix);
    
    // Calculate expiry if duration provided
    let expiresAt = null;
    if (durationDays && durationDays > 0) {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(durationDays));
        expiresAt = date.toISOString();
    } else {
        // Default 1 day for testing if not specified
        const date = new Date();
        date.setDate(date.getDate() + 1);
        expiresAt = date.toISOString();
    }

    const { data: newKey, error } = await supabase
      .from('mod_keys')
      .insert({
        key_value: keyValue,
        key_type: type,
        duration_days: durationDays || 1,
        max_devices: maxDevices || 1,
        // price_vnd: 0, // Removed to avoid schema error if column missing
        short_link: 'ADMIN_GENERATED',
        destination_url: 'ADMIN_GENERATED',
        expires_at: expiresAt,
        is_active: true, // Auto active for admin keys
        usage_count: 0
      })
      .select()
      .single();

    if (error) {
        console.error('Error create key:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        data: newKey
    });

  } catch (error) {
    console.error('Error in admin create-key:', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}
