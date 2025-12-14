import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';

export async function GET() {
    return NextResponse.json({ success: true, message: 'Webhook is active' });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Webhook payload:", body);

        // Normalize transactions list
        let transactions: any[] = [];
        
        if (body.data && Array.isArray(body.data)) {
            transactions = body.data;
        } else if (body.id && (body.gateway || body.transferAmount)) {
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
             
             // Extract Token from "GUMZ {TOKEN}"
             const match = description.match(/GUMZ\s*[:]?\s*(\d+)/i);
             const token = match ? match[1] : null;

             if (token) {
                 // Check if token is likely a Discord User ID (Length > 15) or Request Code (Length < 15)
                 if (token.length < 15) {
                     // NEW FLOW: Token is unique order code
                     const { data: pendingTxn } = await supabase
                         .from('transactions')
                         .select('id, user_id, created_at, metadata')
                         .eq('status', 'pending')
                         .ilike('description', `%${token}%`)
                         .maybeSingle();

                     if (pendingTxn) {
                         // Check Time Limit (10 minutes)
                         const createdAt = new Date(pendingTxn.created_at).getTime();
                         const now = Date.now();
                         const diffMinutes = (now - createdAt) / (1000 * 60);
                         
                         let newStatus = 'success';
                         if (diffMinutes > 10) {
                             newStatus = 'late_payment';
                             console.log(`Transaction ${token} received late (${diffMinutes.toFixed(1)} mins).`);
                         }

                         // Update existing pending transaction
                         await supabase.from('transactions').update({
                             status: newStatus,
                             transaction_id: bankTransId.toString(),
                             amount: amount, 
                             metadata: { ...(pendingTxn.metadata as object), bank_desc: description }
                         }).eq('id', pendingTxn.id);
                     } else {
                         // Code not found, check if it's already processed to avoid dupes
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
                                 rewarded: false
                             });
                         }
                     }
                 } else {
                     // OLD FLOW: Token is User ID
                     const { data: existing } = await supabase
                        .from('transactions')
                        .select('id')
                        .eq('transaction_id', bankTransId.toString())
                        .maybeSingle();
                     
                     if (!existing) {
                         await supabase.from('transactions').insert({
                             user_id: parseInt(token),
                             amount: amount,
                             description: description,
                             status: 'success',
                             transaction_id: bankTransId.toString(),
                             rewarded: false
                         });
                     }
                 }
             }
        }

        return NextResponse.json({ success: true, message: 'Webhook processed' });
    } catch (e) {
        console.error("Webhook Error:", e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
