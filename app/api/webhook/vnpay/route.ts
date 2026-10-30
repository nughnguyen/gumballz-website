import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';

function validSignature(params: URLSearchParams, secret: string) {
    const provided = params.get('vnp_SecureHash') || '';
    const entries = [...params.entries()]
        .filter(([key]) => key.startsWith('vnp_') && key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType')
        .sort(([a], [b]) => a.localeCompare(b));
    const signed = new URLSearchParams();
    for (const [key, value] of entries) signed.append(key, value);
    const expected = createHmac('sha512', secret).update(signed.toString(), 'utf8').digest('hex');
    const a = Buffer.from(provided.toLowerCase());
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = process.env.VNPAY_HASH_SECRET;
    if (!secret || !validSignature(searchParams, secret)) {
        return NextResponse.json({ RspCode: '97', Message: 'Invalid Checksum' });
    }
    const vnp_Params = Object.fromEntries(searchParams.entries());
    console.log("VNPAY IPN Params:", vnp_Params);

    const rspCode = vnp_Params['vnp_ResponseCode'];
    
    if (rspCode === '00') { // 00: Payment Success
        const amount = Math.floor(Number(vnp_Params['vnp_Amount']) / 100);
        if (!Number.isSafeInteger(amount) || amount <= 0) return NextResponse.json({ RspCode: '04', Message: 'Invalid amount' });
        const orderInfo = vnp_Params['vnp_OrderInfo']; 
        const txnRef = vnp_Params['vnp_TxnRef']; 
        const bankTranNo = vnp_Params['vnp_BankTranNo']; 

        const description = orderInfo || "";
        const match = description.match(/(?:GUMZ|KEY|GZ|MC)\s*[:]?\s*([A-Za-z0-9]+)/i);
        const token = match ? match[1] : null;

        if (token) {
            const { data: pendingTxn } = await supabase
                .from('transactions')
                .select('id, metadata, amount')
                .eq('status', 'pending')
                .ilike('description', `%${token}%`)
                .maybeSingle();

            if (pendingTxn) {
                if ((pendingTxn.metadata as { type?: unknown })?.type === 'wallet_topup' && Number(pendingTxn.amount) !== amount) {
                    return NextResponse.json({ RspCode: '04', Message: 'Invalid amount' });
                }
                await supabase.from('transactions').update({
                    status: 'success',
                    transaction_id: bankTranNo || txnRef,
                    amount: amount,
                    metadata: { ...(pendingTxn.metadata as object), bank_desc: description, source: 'vnpay' }
                }).eq('id', pendingTxn.id);
            } else {
                 const { data: existing } = await supabase
                    .from('transactions')
                    .select('id')
                    .eq('transaction_id', bankTranNo || txnRef)
                    .maybeSingle();
                 
                 if (!existing) {
                     await supabase.from('transactions').insert({
                         user_id: 0,
                         amount: amount,
                         description: description,
                         status: 'success',
                         transaction_id: bankTranNo || txnRef,
                         rewarded: false,
                         metadata: { source: 'vnpay' }
                     });
                 }
            }
        }
        
        return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
    }

    return NextResponse.json({ RspCode: '97', Message: 'Invalid Checksum' });
}

export async function POST() {
    return NextResponse.json({ RspCode: '97', Message: 'Invalid Checksum' }, { status: 405 });
}
