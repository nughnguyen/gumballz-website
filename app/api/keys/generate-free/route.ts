import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateRobloxKey, getEndOfDayVN } from "@/app/lib/key-generator";

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Yeulink API configuration
const YEULINK_TOKEN = "16ad669a-9404-48d7-aa63-8522b4014e11";
const YEULINK_API_URL = "https://yeulink.com/st";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type || 'mod'; // 'mod' or 'roblox'
    
    // Logic for Roblox Script Key
    if (type === 'roblox') {
      const keyValue = generateRobloxKey();
      const expiresAt = getEndOfDayVN();
      
      // Destination URL for Roblox key (could be a simple success page or the key display page)
      // Usually users want to see the key directly after passing link.
      const destinationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/keys/claim?key=${keyValue}&type=roblox`;
      
      // Generate short link
      const shortLink = await createYeulinkShortLink(destinationUrl);

      const { data, error } = await supabase
        .from('roblox_keys')
        .insert({
          key_value: keyValue,
          key_type: 'free',
          category: 'roblox',
          expires_at: expiresAt.toISOString(),
          is_used: false,
          metadata: { provider: 'yeulink', short_link: shortLink }
        })
        .select()
        .single();

      if (error) {
        console.error('Roblox key insert error:', error);
        return NextResponse.json({ success: false, error: "Lỗi tạo key Roblox" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        shortLink: shortLink,
        expiresAt: expiresAt.toISOString(),
        message: "Đã tạo key Roblox mới thành công"
      });
    }

    // Logic for Mod Menu Key (Existing)
    const today = getTodayDateString();
    
    // Check if a free key already exists for today
    const { data: existingKey, error: checkError } = await supabase
      .from('mod_keys')
      .select('*')
      .eq('key_type', 'FREE')
      .eq('created_date', today)
      .single();

    if (existingKey) {
      return NextResponse.json({
        success: true,
        shortLink: existingKey.short_link,
        expiresAt: existingKey.expires_at,
        message: "Key hôm nay đã sẵn sàng"
      });
    }

    // 2. Nếu chưa có, tạo mới
    const keyValueGenerator = () => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `GUMFREE-${timestamp}${random}`;
    }
    const keyValue = keyValueGenerator();
    const expiresAt = getEndOfDayVN();
    const destinationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/keys/claim?key=${keyValue}&type=mod`; // Standardized claim page
    const shortLink = await createYeulinkShortLink(destinationUrl);

    const { data: newKey, error: insertError } = await supabase
      .from('mod_keys')
      .insert({
        key_value: keyValue,
        key_type: 'FREE',
        created_date: today,
        duration_days: 1,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        usage_count: 0,
        short_link: shortLink,
        destination_url: destinationUrl
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ success: false, error: `Lỗi tạo dữ liệu trong Database: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      shortLink: shortLink,
      expiresAt: expiresAt.toISOString(),
      message: "Đã tạo key mới thành công"
    });

  } catch (error) {
    console.error('Fatal error:', error);
    return NextResponse.json({ success: false, error: "Lỗi hệ thống nghiêm trọng" }, { status: 500 });
  }
}

// Helper: Create yeulink short link
async function createYeulinkShortLink(destinationUrl: string): Promise<string> {
  const yeulinkUrl = `${YEULINK_API_URL}?token=${YEULINK_TOKEN}&url=${encodeURIComponent(destinationUrl)}`;
  
  try {
    const response = await fetch(yeulinkUrl, {
      method: 'GET',
      redirect: 'manual' 
    });
    
    const location = response.headers.get('location') || response.headers.get('Location');
    
    if (location) {
        return location;
    } else {
        console.error('Yeulink API did not return a Location header');
        // Fallback or return original implementation behavior
        // Since original behavior returned yeulinkUrl on fail, we keep it consistent or assume error
        return yeulinkUrl; 
    }
  } catch (error) {
    console.error('Error creating yeulink:', error);
    return yeulinkUrl;
  }
}

// Get today's date string in Vietnam timezone (YYYY-MM-DD)
function getTodayDateString(): string {
  const now = new Date();
  const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  return vnTime.toISOString().split('T')[0];
}
