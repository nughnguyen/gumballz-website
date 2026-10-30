import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/app/utils/supabaseServer";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = getServerSupabase();
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: "Token không hợp lệ" }, { status: 400 });
    }

    // 1. Tìm key ứng với token này
    const { data: keyData, error } = await supabase
      .from('mod_keys')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (error || !keyData) {
        return NextResponse.json({ success: false, error: "Token không tồn tại hoặc đã hết hạn" }, { status: 404 });
    }

    // 2. Trả về Key
    return NextResponse.json({ 
        success: true, 
        key: keyData.key_value,
        expiresAt: keyData.expires_at
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi hệ thống" }, { status: 500 });
  }
}
