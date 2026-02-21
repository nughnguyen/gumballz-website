import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Momo Webhook payload:", body);

        const { amount, orderInfo, transId, resultCode } = body;

        if (resultCode == 0) { // 0 means success
             const description = orderInfo || "";
             const match = description.match(/(?:GUMZ|KEY|GZ|MC)\s*[:]?\s*([A-Za-z0-9]+)/i);
             const token = match ? match[1] : null;

             if (token) {
                 // Try to find pending transaction first
                 const { data: pendingTxn } = await supabase
                     .from('transactions')
                     .select('id, metadata')
                     .eq('status', 'pending')
                     .ilike('description', `%${token}%`)
                     .maybeSingle();

                 if (pendingTxn) {
                     await supabase.from('transactions').update({
                         status: 'success',
                         transaction_id: transId.toString(),
                         amount: amount, 
                         metadata: { ...(pendingTxn.metadata as object), bank_desc: description, source: 'momo' }
                     }).eq('id', pendingTxn.id);
                 } else {
                     const { data: existing } = await supabase
                         .from('transactions')
                         .select('id')
                         .eq('transaction_id', transId.toString())
                         .maybeSingle();
                     
                     if (!existing) {
                         await supabase.from('transactions').insert({
                             user_id: 0,
                             amount: amount,
                             description: description,
                             status: 'success',
                             transaction_id: transId.toString(),
                             rewarded: false,
                             metadata: { source: 'momo' }
                         });
                     }
                 }
             }
        }

        return NextResponse.json({ message: 'Success' }, { status: 200 }); 
    } catch (e) {
        console.error("Momo Webhook Error:", e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
