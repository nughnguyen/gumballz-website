import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';

// POST /api/minecraft/redeem
// Called by the Minecraft plugin when player does /napthe redeem <code>
// Also handles gift codes
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, playerName, apiKey: bodyApiKey } = body;

        const expectedKey = process.env.MINECRAFT_API_KEY;
        const authorization = req.headers.get('authorization') || '';
        const suppliedKey = req.headers.get('x-api-key') || (authorization.startsWith('Bearer ') ? authorization.slice(7) : bodyApiKey);
        if (!expectedKey || suppliedKey !== expectedKey) {
            return NextResponse.json({ success: false, error: 'Invalid API key' }, { status: 401 });
        }

        if (typeof code !== 'string' || !/^(?:MC|GZ)[A-Z0-9]{6}$/.test(code) || typeof playerName !== 'string' || !/^[A-Za-z0-9_]{3,16}$/.test(playerName)) {
            return NextResponse.json({ success: false, error: 'Missing code or playerName' }, { status: 400 });
        }

        const { data: rows, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('status', 'success')
            .eq('rewarded', false)
            .or(`metadata->>claimCode.eq.${code},metadata->>giftCode.eq.${code}`);

        if (error) {
            console.error('Redeem query error:', error);
            return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
        }

        if (!rows || rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Mã không tồn tại hoặc đã được sử dụng' });
        }

        const tx = rows[0];
        const meta = tx.metadata || {};
        if (typeof meta.playerName === 'string' && meta.playerName.toLowerCase() !== playerName.toLowerCase()) {
            return NextResponse.json({ success: false, error: 'Mã nạp được tạo cho người chơi khác' }, { status: 403 });
        }
        const rewardValue = meta.rewardValue || 0;

        // Mark as rewarded
        const { data: redeemed, error: updateError } = await supabase
            .from('transactions')
            .update({
                rewarded: true,
                metadata: { ...meta, redeemedBy: playerName, redeemedAt: new Date().toISOString() }
            })
            .eq('id', tx.id)
            .eq('rewarded', false)
            .select('id')
            .maybeSingle();

        if (updateError) {
            return NextResponse.json({ success: false, error: 'Failed to mark as rewarded' }, { status: 500 });
        }
        if (!redeemed) return NextResponse.json({ success: false, error: 'Mã đã được sử dụng' }, { status: 409 });

        return NextResponse.json({
            success: true,
            rewardType: 'money',
            rewardValue: rewardValue.toString(),
            playerName,
            message: `Đã nhận ${rewardValue.toLocaleString('vi-VN')} xu!`
        });

    } catch (err) {
        console.error('Redeem error:', err);
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
    }
}
