import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/app/utils/rateLimit";
import { getServerSupabase } from "@/app/utils/supabaseServer";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerSupabase();
    const rate = await checkRateLimit(request, 'key-verify', 60, 60);
    if (!rate.allowed) return rateLimitResponse(rate);
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

    if (!keyData.is_active) {
      return NextResponse.json({ success: false, error: 'Key chưa được kích hoạt', valid: false }, { status: 403 });
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
      const { data: bound, error: bindError } = await supabase
        .from('mod_keys')
        .update({ 
          device_id: deviceId,
          device_bound_at: now.toISOString(),
          is_active: true
        })
        .eq('id', keyData.id)
        .is('device_id', null)
        .select('device_id')
        .maybeSingle();

      if (bindError) {
        console.error('Error binding device:', bindError);
        return NextResponse.json({
          success: false,
          error: 'Không thể kích hoạt key',
          valid: false
        }, { status: 500 });
      }
      if (!bound) {
        const { data: latest } = await supabase.from('mod_keys').select('device_id').eq('id', keyData.id).maybeSingle();
        if (latest?.device_id !== deviceId) return NextResponse.json({ success: false, error: 'Key đã được sử dụng trên thiết bị khác', valid: false }, { status: 403 });
      }
    }

    // Update last verified timestamp and usage count
    const { error: usageError } = await supabase
      .from('mod_keys')
      .update({ 
        usage_count: keyData.usage_count + 1,
        last_verified_at: now.toISOString()
      })
      .eq('id', keyData.id)
      .eq('device_id', deviceId);
    if (usageError) return NextResponse.json({ success: false, error: 'Không thể xác minh key', valid: false }, { status: 500 });

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
      deviceBound: true,
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
