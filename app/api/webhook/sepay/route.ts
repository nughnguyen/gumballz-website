import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';

export async function GET() {
    return NextResponse.json({ success: true, message: 'SePay Webhook is active' });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("SePay Webhook payload:", body);

        // Normalize transactions list
        // SePay typically sends a single object, but we'll support array just in case
        let transactions: any[] = [];
        
        if (body.data && Array.isArray(body.data)) {
            transactions = body.data;
        } else if (body.id && (body.gateway || body.transferAmount)) {
            // Standard SePay single transaction payload
            transactions = [body];
        } else if (body.transactions && Array.isArray(body.transactions)) {
            transactions = body.transactions;
        }

        if (transactions.length === 0) {
             console.log("SePay Webhook: No transactions found in payload");
             return NextResponse.json({ success: true, message: 'No transactions found' });
        }

        for (const txn of transactions) {
             const description = txn.description || txn.content || "";
             const amount = txn.amount || txn.transferAmount || 0;
             const bankTransId = txn.id || txn.transactionID || txn.referenceCode || `txn_${Date.now()}`;
             
             // Extract Token from "GUMZ {TOKEN}" - Supports "GUMZ 123456", "GUMZ:123456", "GUMZ+123456"
             const match = description.match(/GUMZ\s*[+:\s]?\s*(\d+)/i);
             let token = match ? match[1] : null;

             if (token) {
                 console.log(`SePay Webhook: Found raw token '${token}' in '${description}'`);
                 
                 // Handle Prefix/Suffix garbage
                 if (token.length < 15) {
                     if (token.length > 6) {
                         token = token.substring(0, 6);
                         console.log(`> Trimmed token to 6 digits: '${token}'`);
                     }
                     
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
                             metadata: { ...(pendingTxn.metadata as object), bank_desc: description, source: 'sepay' }
                         }).eq('id', pendingTxn.id);
                     } else {
                         // Code not found, check if it's already processed
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
                     // Legacy/Fallback flow
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
                             rewarded: false,
                              metadata: { source: 'sepay' }
                         });
                     }
                 }
             }
        }

        return NextResponse.json({ success: true, message: 'SePay Webhook processed' });
    } catch (e) {
        console.error("SePay Webhook Error:", e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
