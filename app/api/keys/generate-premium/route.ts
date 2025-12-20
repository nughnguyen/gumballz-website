import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Helper function to generate key with double encoding
// Result: GUMBALLZ-{first 10 chars}
function generateKey(): string {
  const now = new Date();
  const dateStr = now.toISOString();
  
  const rawData = `GumballZ-NguyenQuocHung-${dateStr}`;
  const firstEncode = Buffer.from(rawData).toString('base64url');
  const secondEncode = Buffer.from(firstEncode).toString('base64url');
  const shortKey = secondEncode.substring(0, 10);
  
  return `GUMBALLZ-${shortKey}`;
}

// Generate random string for yeumoney short link
function generateShortId(): string {
  return crypto.randomBytes(4).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { days = 1, amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Số tiền không hợp lệ'
      }, { status: 400 });
    }

    // Generate premium key
    const keyValue = generateKey();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Generate short link ID
    const shortId = generateShortId();
    
    // Create yeumoney short link (format: https://yeumoney.com/{shortId})
    const shortLink = `https://yeumoney.com/${shortId}`;
    
    // The destination URL will show the key
    const destinationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/keys/claim?key=${encodeURIComponent(keyValue)}`;

    // Insert key into database
    const { data: newKey, error: insertError } = await supabase
      .from('mod_keys')
      .insert({
        key_value: keyValue,
        key_type: 'PREMIUM',
        duration_days: days,
        price_vnd: amount,
        short_link: shortLink,
        destination_url: destinationUrl,
        expires_at: expiresAt.toISOString(),
        is_active: false, // Will be activated after payment
        usage_count: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating premium key:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create key' 
      }, { status: 500 });
    }

    // TODO: Create actual yeumoney link via their API
    // For now, we'll return the data

    return NextResponse.json({
      success: true,
      key: newKey.key_value,
      shortLink: shortLink,
      destinationUrl: destinationUrl,
      days: days,
      amount: amount,
      expiresAt: newKey.expires_at,
      message: 'Key premium được tạo. Hoàn thành thanh toán để kích hoạt.'
    });

  } catch (error) {
    console.error('Error in generate-premium:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
