import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';
import { checkRateLimit, rateLimitResponse } from '@/app/utils/rateLimit';

function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'GZ';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

// POST /api/minecraft/web-order
// Called from the website's Minecraft store page (no external API key needed)
export async function POST(req: NextRequest) {
    try {
        const rate = await checkRateLimit(req, 'minecraft-web-order', 5, 600);
        if (!rate.allowed) return rateLimitResponse(rate);
        const body = await req.json();
        const { playerName, amountVnd, rewardXu } = body;

        if (!playerName || typeof playerName !== 'string' || !/^[A-Za-z0-9_]{3,16}$/.test(playerName.trim())) {
            return NextResponse.json({ success: false, error: 'Tên Minecraft phải có 3–16 ký tự, chỉ gồm chữ, số và dấu gạch dưới.' }, { status: 400 });
        }
        const amountNum = Number(amountVnd);
        if (!Number.isSafeInteger(amountNum) || amountNum < 10000 || amountNum > 20000000) {
            return NextResponse.json({ success: false, error: 'Số tiền nạp từ 10.000đ đến 20.000.000đ.' }, { status: 400 });
        }
        const rewardNum = rewardXu == null ? amountNum : Number(rewardXu);
        const packageRewards: Record<number, number> = { 20000: 20000, 50000: 50000, 100000: 110000, 200000: 240000, 500000: 650000 };
        const expectedReward = packageRewards[amountNum] || amountNum;
        if (!Number.isSafeInteger(rewardNum) || rewardNum !== expectedReward) {
            return NextResponse.json({ success: false, error: 'Gói xu không hợp lệ.' }, { status: 400 });
        }

        const orderCode = generateCode();
        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: null,
                amount: amountNum,
                description: orderCode,
                status: 'pending',
                method: 'Banking',
                rewarded: false,
                metadata: {
                    type: 'minecraft_web',
                    playerName: playerName.trim(),
                    rewardType: 'money',
                    rewardValue: rewardNum,
                    source: 'website'
                }
            })
            .select('id')
            .single();

        if (error || !data) {
            console.error('Supabase error:', error);
            return NextResponse.json({ success: false, error: 'Lỗi tạo giao dịch' }, { status: 500 });
        }

        const bankId = process.env.BANK_ID || 'OCB';
        const accountNo = process.env.BANK_ACCOUNT_NO || '';
        const accountName = process.env.BANK_ACCOUNT_NAME || '';
        const qrUrl = `https://img.vietqr.io/image/${bankId.toLowerCase()}-${accountNo}-qr_only.png?amount=${amountNum}&addInfo=${orderCode}&accountName=${encodeURIComponent(accountName)}`;
        const expiry = Math.floor(Date.now() / 1000) + 600;

        return NextResponse.json({
            success: true,
            orderId: data.id,
            orderCode,
            amount: amountNum,
            rewardXu: rewardNum,
            playerName: playerName.trim(),
            qrUrl,
            expiry,
            bankId,
            accountNo,
            accountName
        });
    } catch (err) {
        console.error('web-order error:', err);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
