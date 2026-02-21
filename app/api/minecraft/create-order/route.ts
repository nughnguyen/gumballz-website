import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';

// Generate a unique 6-character order code
function generateOrderCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'MC';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { playerName, packageId, amount, rewardType, rewardValue, apiKey } = body;

        // Validate API key
        const validKey = process.env.MINECRAFT_API_KEY;
        if (!validKey || apiKey !== validKey) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Validate required fields
        if (!playerName || !packageId || !amount || !rewardType || !rewardValue) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const amountNum = parseInt(amount);
        if (isNaN(amountNum) || amountNum < 1000) {
            return NextResponse.json({ success: false, error: 'Invalid amount (min 1000 VND)' }, { status: 400 });
        }

        // Generate unique order code
        let orderCode = generateOrderCode();
        // Ensure uniqueness (retry if clash)
        for (let i = 0; i < 5; i++) {
            const { data: existing } = await supabase
                .from('transactions')
                .select('id')
                .ilike('description', `%${orderCode}%`)
                .maybeSingle();
            if (!existing) break;
            orderCode = generateOrderCode();
        }

        // Create pending transaction
        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: null,   // Minecraft players don't have Supabase accounts
                amount: amountNum,
                description: orderCode,
                status: 'pending',
                rewarded: false,
                metadata: {
                    type: 'minecraft',
                    source: 'minecraft_plugin',
                    playerName,
                    packageId,
                    rewardType,   // 'rank' | 'money'
                    rewardValue,  // rank group name or coin amount
                }
            })
            .select()
            .single();

        if (error) {
            console.error('Minecraft Create Order Error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Build VietQR payment URL
        // Format: https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-qr_only.png?amount={amount}&addInfo={content}
        const bankId = process.env.BANK_ID || 'MB';
        const accountNo = process.env.BANK_ACCOUNT_NO || '0000000000';
        const accountName = process.env.BANK_ACCOUNT_NAME || 'GUMBALLZ HUB';

        const vietqrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-qr_only.png?amount=${amountNum}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(accountName)}`;
        const payPageUrl = `https://gumballzhub.vercel.app/minecraft/pay?code=${orderCode}&amount=${amountNum}&pkg=${encodeURIComponent(packageId)}`;

        return NextResponse.json({
            success: true,
            orderId: data.id,
            orderCode,
            amount: amountNum,
            qrUrl: vietqrUrl,
            payPageUrl,
            message: `Chuyển khoản ${amountNum.toLocaleString('vi-VN')}đ với nội dung: ${orderCode}`,
        });

    } catch (e: unknown) {
        const err = e as Error;
        console.error('Minecraft Create Order Error:', err);
        return NextResponse.json({ success: false, error: err.message || 'Internal Error' }, { status: 500 });
    }
}
