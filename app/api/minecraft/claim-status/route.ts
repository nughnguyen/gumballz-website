import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/app/utils/supabaseServer';

function generateClaimCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'MC';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

// GET /api/minecraft/claim-status?orderId=xxx
// Website polls this to know if payment was detected
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });

    const supabase = createSupabaseServer();
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', orderId)
        .single();

    if (error || !data) {
        return NextResponse.json({ success: false, status: 'not_found' }, { status: 404 });
    }

    const meta = data.metadata || {};
    if (!['minecraft', 'minecraft_web'].includes(meta.type)) {
        return NextResponse.json({ success: false, error: 'Not a Minecraft order' }, { status: 400 });
    }

    // Pending: still waiting for payment
    if (data.status !== 'success') {
        return NextResponse.json({ success: false, status: 'pending' });
    }

    // Already has a claim code — just return it
    if (meta.claimCode) {
        return NextResponse.json({
            success: true,
            status: 'paid',
            claimCode: meta.claimCode,
            playerName: meta.playerName,
            rewardValue: meta.rewardValue,
            rewarded: data.rewarded
        });
    }

    // Payment just confirmed — generate and store a claim code
    const claimCode = generateClaimCode();
    const { error: updateError } = await supabase
        .from('transactions')
        .update({ metadata: { ...meta, claimCode } })
        .eq('id', orderId);

    if (updateError) {
        return NextResponse.json({ success: false, error: 'Failed to generate claim code' }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        status: 'paid',
        claimCode,
        playerName: meta.playerName,
        rewardValue: meta.rewardValue,
        rewarded: data.rewarded
    });
}
