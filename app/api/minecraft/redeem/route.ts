import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/app/utils/supabaseServer';

// POST /api/minecraft/redeem
// Called by the Minecraft plugin when player does /napthe redeem <code>
// Also handles gift codes
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, playerName, apiKey } = body;

        const expectedKey = process.env.MINECRAFT_API_KEY;
        if (!expectedKey || apiKey !== expectedKey) {
            return NextResponse.json({ success: false, error: 'Invalid API key' }, { status: 401 });
        }

        if (!code || !playerName) {
            return NextResponse.json({ success: false, error: 'Missing code or playerName' }, { status: 400 });
        }

        const supabase = serverSupabase;

        // Find a transaction with this claim code in metadata
        // Both minecraft_web (payment claim codes) and minecraft_gift (gift codes)
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
        const rewardValue = meta.rewardValue || 0;

        // Mark as rewarded
        const { error: updateError } = await supabase
            .from('transactions')
            .update({
                rewarded: true,
                metadata: { ...meta, redeemedBy: playerName, redeemedAt: new Date().toISOString() }
            })
            .eq('id', tx.id);

        if (updateError) {
            return NextResponse.json({ success: false, error: 'Failed to mark as rewarded' }, { status: 500 });
        }

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
