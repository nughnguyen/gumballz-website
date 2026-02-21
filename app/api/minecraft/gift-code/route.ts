import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/app/utils/supabaseServer';

function generateGiftCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'GZ';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

// POST /api/minecraft/gift-code
// Admin command: /giftcode create <amount> calls this
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { rewardXu, apiKey, createdBy, note } = body;

        const expectedKey = process.env.MINECRAFT_API_KEY;
        if (!expectedKey || apiKey !== expectedKey) {
            return NextResponse.json({ success: false, error: 'Invalid API key' }, { status: 401 });
        }

        const xuAmount = parseInt(rewardXu);
        if (isNaN(xuAmount) || xuAmount < 1) {
            return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
        }

        const giftCode = generateGiftCode();
        const supabase = serverSupabase;

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: null,
                amount: 0,
                description: `GIFT-${giftCode}`,
                status: 'success',   // Gift codes are pre-approved
                method: 'GiftCode',
                rewarded: false,
                metadata: {
                    type: 'minecraft_gift',
                    giftCode,
                    rewardType: 'money',
                    rewardValue: xuAmount,
                    createdBy: createdBy || 'admin',
                    note: note || ''
                }
            })
            .select('id')
            .single();

        if (error || !data) {
            return NextResponse.json({ success: false, error: 'DB error: ' + error?.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            giftCode,
            rewardXu: xuAmount,
            id: data.id
        });

    } catch (err) {
        console.error('gift-code error:', err);
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
    }
}
