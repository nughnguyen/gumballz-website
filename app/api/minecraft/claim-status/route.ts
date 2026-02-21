import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';

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
    const code = searchParams.get('code');
    if (!orderId && !code) return NextResponse.json({ success: false, error: 'Missing orderId or code' }, { status: 400 });

    let query = supabase.from('transactions').select('*');
    if (orderId) {
        query = query.eq('id', orderId);
    } else if (code) {
        query = query.ilike('description', `%${code}%`).order('created_at', { ascending: false }).limit(1);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
        return NextResponse.json({ success: false, status: 'not_found' }, { status: 404 });
    }


    const meta = data.metadata || {};
    if (!['minecraft', 'minecraft_web'].includes(meta.type)) {
        return NextResponse.json({ success: false, error: 'Not a Minecraft order' }, { status: 400 });
    }

    const responseMeta = {
        serverTime: Date.now(),
        createdAt: new Date(data.created_at).getTime(),
    };

    // Pending: still waiting for payment
    if (data.status !== 'success') {
        return NextResponse.json({ success: false, status: 'pending', ...responseMeta });
    }

    // Already has a claim code — just return it
    if (meta.claimCode) {
        return NextResponse.json({
            success: true,
            status: 'paid',
            claimCode: meta.claimCode,
            playerName: meta.playerName,
            rewardValue: meta.rewardValue,
            rewarded: data.rewarded,
            ...responseMeta
        });
    }

    // Payment just confirmed — generate and store a claim code
    const claimCode = generateClaimCode();
    const { error: updateError } = await supabase
        .from('transactions')
        .update({ metadata: { ...meta, claimCode } })
        .eq('id', data.id); // Use data.id because orderId might be null if queried by code

    if (updateError) {
        return NextResponse.json({ success: false, error: 'Failed to generate claim code' }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        status: 'paid',
        claimCode,
        playerName: meta.playerName,
        rewardValue: meta.rewardValue,
        rewarded: data.rewarded,
        ...responseMeta
    });
}
