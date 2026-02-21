import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';

export async function GET() {
    return NextResponse.json({ success: true, message: 'SePay Webhook is active' });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("SePay Webhook payload:", body);

        // Normalize transactions list
        let transactions: any[] = [];
        
        if (body.data && Array.isArray(body.data)) {
            transactions = body.data;
        } else if (body.id) {
            transactions = [body];
        } else if (body.transactions && Array.isArray(body.transactions)) {
            transactions = body.transactions;
        }

        if (transactions.length === 0) {
             return NextResponse.json({ success: true, message: 'No transactions found' });
        }

        for (const txn of transactions) {
             const description = txn.description || txn.content || "";
             const amount = txn.amount || txn.transferAmount || 0;
             const bankTransId = txn.id || txn.transactionID || txn.referenceCode || `txn_${Date.now()}`;
             
             // Extract Token from "GUMZXXXX", "KEYXXXX", "GZXXXX", or "MCXXXX"
             let match = description.match(/(?:GUMZ|KEY|GZ|MC)\s*[:.\- ]*\s*([A-Za-z0-9]+)/i);
             if (!match) {
                 match = description.match(/(\d{6})/);
             }

             let token = match ? match[1] : null;

             if (token) {
                 console.log(`SePay Webhook: Found raw token '${token}' in '${description}'`);
                 
                 // Try to find a pending transaction with this token in description
                 const { data: pendingTxn } = await supabase
                     .from('transactions')
                     .select('id, user_id, created_at, metadata')
                     .eq('status', 'pending')
                     .ilike('description', `%${token}%`)
                     .maybeSingle();

                 if (pendingTxn) {
                     const createdAt = new Date(pendingTxn.created_at).getTime();
                     const now = Date.now();
                     const diffMinutes = (now - createdAt) / (1000 * 60);
                     
                     let newStatus = 'success';
                     if (diffMinutes > 10) {
                         newStatus = 'late_payment';
                         console.log(`Transaction ${token} received late (${diffMinutes.toFixed(1)} mins).`);
                     }

                     await supabase.from('transactions').update({
                         status: newStatus,
                         transaction_id: bankTransId.toString(),
                         amount: amount, 
                         metadata: { ...(pendingTxn.metadata as object), bank_desc: description, source: 'sepay' }
                     }).eq('id', pendingTxn.id);
                 } else {
                     const { data: existing } = await supabase
                        .from('transactions')
                        .select('id')
                        .eq('transaction_id', bankTransId.toString())
                        .maybeSingle();
                    
                     if (!existing) {
                          await supabase.from('transactions').insert({
                             user_id: 0, 
                             amount: amount,
                             description: description,
                             status: 'ignored_code_not_found',
                             transaction_id: bankTransId.toString(),
                             rewarded: false,
                             metadata: { source: 'sepay', original_desc: description }
                         });
                     }
                 }
             } else {
                 const { data: existing } = await supabase
                    .from('transactions')
                    .select('id')
                    .eq('transaction_id', bankTransId.toString())
                    .maybeSingle();
                 
                 if (!existing) {
                     await supabase.from('transactions').insert({
                         user_id: 0,
                         amount: amount,
                         description: description,
                         status: 'success',
                         transaction_id: bankTransId.toString(),
                         rewarded: false,
                          metadata: { source: 'sepay' }
                     });
                 }
             }
        }

        return NextResponse.json({ success: true, message: 'SePay Webhook processed' });
    } catch (e) {
        console.error("SePay Webhook Error:", e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
