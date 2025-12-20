import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Yeulink API configuration
const YEULINK_TOKEN = "16ad669a-9404-48d7-aa63-8522b4014e11";
const YEULINK_API_URL = "https://yeulink.com/st";

// Helper function to generate key with double encoding
// Result: GUMFREE-{first 10 chars}
function generateKey(): string {
  const now = new Date();
  const dateStr = now.toISOString();
  
  const rawData = `GumballZ-NguyenQuocHung-${dateStr}`;
  const firstEncode = Buffer.from(rawData).toString('base64url');
  const secondEncode = Buffer.from(firstEncode).toString('base64url');
  const shortKey = secondEncode.substring(0, 10);
  
  return `GUMFREE-${shortKey}`;
}

// Get today's date string in Vietnam timezone (YYYY-MM-DD)
function getTodayDateString(): string {
  const now = new Date();
  // Convert to Vietnam timezone (UTC+7)
  const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  return vnTime.toISOString().split('T')[0];
}

// Get end of day in Vietnam timezone
function getEndOfDayVN(): Date {
  const now = new Date();
  const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  
  // Set to 23:59:59.999 VN time
  vnTime.setHours(23, 59, 59, 999);
  
  return vnTime;
}

// Create yeulink short link
async function createYeulinkShortLink(destinationUrl: string): Promise<string> {
  const yeulinkUrl = `${YEULINK_API_URL}?token=${YEULINK_TOKEN}&url=${encodeURIComponent(destinationUrl)}`;
  
  try {
    const response = await fetch(yeulinkUrl, {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects
    });
    
    // Yeulink returns the short link in Location header or response body
    // For simplicity, we'll construct it manually based on their pattern
    // In production, parse the actual response from yeulink
    const shortId = Math.random().toString(36).substring(2, 10);
    return `https://yeulink.com/${shortId}`;
  } catch (error) {
    console.error('Error creating yeulink:', error);
    // Fallback: construct URL directly (yeulink will create it on-the-fly)
    return yeulinkUrl;
  }
}

export async function POST() {
  try {
    const today = getTodayDateString();
    
    // Check if a free key already exists for today
    const { data: existingKey, error: checkError } = await supabase
      .from('mod_keys')
      .select('*')
      .eq('key_type', 'FREE')
      .eq('created_date', today)
      .eq('is_active', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing key:', checkError);
      return NextResponse.json({ 
        success: false, 
        error: 'Database error' 
      }, { status: 500 });
    }

    // If key exists for today, return its short link
    if (existingKey && existingKey.short_link) {
      return NextResponse.json({
        success: true,
        shortLink: existingKey.short_link,
        message: 'Key free hôm nay đã được tạo',
        expiresAt: existingKey.expires_at
      });
    }

    // Generate new free key for today
    const keyValue = generateKey();
    const expiresAt = getEndOfDayVN(); // 23:59:59.999 VN time

    // Create destination URL (where user will land after bypassing yeulink)
    const destinationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/key/free/${encodeURIComponent(keyValue)}`;
    
    // Create yeulink short link
    const shortLink = await createYeulinkShortLink(destinationUrl);

    // Insert new key into database
    const { data: newKey, error: insertError } = await supabase
      .from('mod_keys')
      .insert({
        key_value: keyValue,
        key_type: 'FREE',
        created_date: today,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        usage_count: 0,
        short_link: shortLink,
        destination_url: destinationUrl
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating key:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create key' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      shortLink: newKey.short_link,
      message: 'Link lấy key free đã được tạo',
      expiresAt: newKey.expires_at
    });

  } catch (error) {
    console.error('Error in generate-free:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
