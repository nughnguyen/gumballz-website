import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, deviceId } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Key không hợp lệ'
      }, { status: 400 });
    }

    if (!deviceId || typeof deviceId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Device ID không hợp lệ'
      }, { status: 400 });
    }

    // Check if key exists in database
    const { data: keyData, error: queryError } = await supabase
      .from('mod_keys')
      .select('*')
      .eq('key_value', key)
      .single();

    if (queryError || !keyData) {
      return NextResponse.json({
        success: false,
        error: 'Key không tồn tại',
        valid: false
      }, { status: 404 });
    }

    // Check if key has expired
    const now = new Date();
    const expiresAt = new Date(keyData.expires_at);
    
    if (now > expiresAt) {
      // Mark key as inactive if expired
      await supabase
        .from('mod_keys')
        .update({ is_active: false })
        .eq('key_value', key);

      return NextResponse.json({
        success: false,
        error: 'Key đã hết hạn',
        valid: false,
        expiredAt: keyData.expires_at
      }, { status: 403 });
    }

    // Device binding logic
    if (keyData.device_id) {
      // Key already bound to a device
      if (keyData.device_id !== deviceId) {
        return NextResponse.json({
          success: false,
          error: 'Key đã được sử dụng trên thiết bị khác',
          valid: false
        }, { status: 403 });
      }
      // Same device, continue
    } else {
      // First time use - bind device to key
      const { error: bindError } = await supabase
        .from('mod_keys')
        .update({ 
          device_id: deviceId,
          device_bound_at: now.toISOString(),
          is_active: true
        })
        .eq('key_value', key);

      if (bindError) {
        console.error('Error binding device:', bindError);
        return NextResponse.json({
          success: false,
          error: 'Không thể kích hoạt key',
          valid: false
        }, { status: 500 });
      }
    }

    // Update last verified timestamp and usage count
    await supabase
      .from('mod_keys')
      .update({ 
        usage_count: keyData.usage_count + 1,
        last_verified_at: now.toISOString()
      })
      .eq('key_value', key);

    // Calculate remaining time
    const remainingMs = expiresAt.getTime() - now.getTime();
    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

    // Key is valid
    return NextResponse.json({
      success: true,
      valid: true,
      keyType: keyData.key_type,
      keyValue: keyData.key_value,
      expiresAt: keyData.expires_at,
      hoursRemaining: remainingHours,
      deviceBound: !!keyData.device_id,
      message: 'Key hợp lệ'
    });

  } catch (error) {
    console.error('Error in verify-key:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      valid: false
    }, { status: 500 });
  }
}
