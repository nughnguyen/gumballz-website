import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';

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
        const body = await req.json();
        const { playerName, amountVnd, rewardXu } = body;

        if (!playerName || typeof playerName !== 'string' || playerName.trim().length < 3) {
            return NextResponse.json({ success: false, error: 'Tên Minecraft không hợp lệ (tối thiểu 3 ký tự)' }, { status: 400 });
        }
        const amountNum = parseInt(amountVnd);
        if (isNaN(amountNum) || amountNum < 10000) {
            return NextResponse.json({ success: false, error: 'Số tiền tối thiểu 10,000đ' }, { status: 400 });
        }
        const rewardNum = parseInt(rewardXu) || amountNum;

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
