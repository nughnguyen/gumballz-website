import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const vnp_Params = Object.fromEntries(searchParams.entries());
    console.log("VNPAY IPN Params:", vnp_Params);

    const rspCode = vnp_Params['vnp_ResponseCode'];
    
    if (rspCode === '00') { // 00: Payment Success
        const amount = parseInt(vnp_Params['vnp_Amount']) / 100;
        const orderInfo = vnp_Params['vnp_OrderInfo']; 
        const txnRef = vnp_Params['vnp_TxnRef']; 
        const bankTranNo = vnp_Params['vnp_BankTranNo']; 

        const description = orderInfo || "";
        const match = description.match(/(?:GUMZ|KEY|GZ|MC)\s*[:]?\s*([A-Za-z0-9]+)/i);
        const token = match ? match[1] : null;

        if (token) {
            const { data: pendingTxn } = await supabase
                .from('transactions')
                .select('id, metadata')
                .eq('status', 'pending')
                .ilike('description', `%${token}%`)
                .maybeSingle();

            if (pendingTxn) {
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

export async function POST(request: Request) {
    return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
}
