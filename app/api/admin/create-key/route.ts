
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/app/utils/adminAuth";

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function generateKey(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!supabase) return NextResponse.json({ success: false, error: 'Server is not configured' }, { status: 503 });
    const body = await request.json();
    const { durationDays, type = 'PREMIUM', customKey, maxDevices = 1 } = body;

    // Simple security check (replace with real auth in production)
    if (!['FREE', 'PREMIUM'].includes(type) || !Number.isInteger(Number(durationDays)) || Number(durationDays) < 1 || Number(durationDays) > 3650 || !Number.isInteger(Number(maxDevices)) || Number(maxDevices) < 1 || Number(maxDevices) > 20 || (customKey && (typeof customKey !== 'string' || !/^[A-Za-z0-9-]{6,80}$/.test(customKey)))) return NextResponse.json({ success: false, error: 'Invalid key settings' }, { status: 400 });

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
