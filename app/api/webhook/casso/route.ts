import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';

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
             
             // Extract Token from "GUMZ", "KEY", "GZ", or "MC"
             const match = description.match(/(?:GUMZ|KEY|GZ|MC)\s*[+:\s]?\s*([A-Za-z0-9]+)/i);
             let token = match ? match[1] : null;

             if (token) {
                 console.log(`Webhook processing: Found raw token '${token}' in '${description}'`);
                 
                 // If token is User ID (e.g. > 6 digits)
                 // We need to look for a PENDING transaction created by the Web App for this User
                 // That has the same Amount. 
                 // If we find one, we FULFILL it (so Web App polling can see success).
                 // If we don't find one, we Create a New Success Record (for manual transfer).

                 // Try to match specific pending transaction first
                 const { data: pendingTxn } = await supabase
                     .from('transactions')
                     .select('id, user_id, created_at, metadata, amount')
                     .eq('status', 'pending')
                     .eq('amount', amount) // Amount must match
                     // Check if description matches OR user_id matches token
                     // Since uniqueCode stores "GUMZ" + ID, we match user_id directly
                     // because we know token IS the user_id (mostly)
                     .ilike('description', `%${token}%`) 
                     .order('created_at', { ascending: false }) // Get latest
                     .limit(1)
                     .maybeSingle();

                 if (pendingTxn) {
                     // Check Time Limit (10 minutes)
                     const createdAt = new Date(pendingTxn.created_at).getTime();
                     const now = Date.now();
                     const diffMinutes = (now - createdAt) / (1000 * 60);
                     
                     let newStatus = 'success';
                     if (diffMinutes > 10) {
                         newStatus = 'late_payment';
                         console.log(`Transaction ${pendingTxn.id} received late (${diffMinutes.toFixed(1)} mins).`);
                     }

                     // Update existing pending transaction
                     await supabase.from('transactions').update({
                         status: newStatus,
                         transaction_id: bankTransId.toString(),
                         metadata: { ...(pendingTxn.metadata as object), bank_desc: description, matched_via: 'web_pending' }
                     }).eq('id', pendingTxn.id);

                     console.log(`Updated PENDING transaction ${pendingTxn.id} to ${newStatus}`);
                 } else {
                     // No pending transaction found. This is likely a Manual Transfer.
                     // Or unexpected flow.
                     // Check if it's already processed to avoid dupes in 'success' state
                     const { data: existing } = await supabase
                        .from('transactions')
                        .select('id')
                        .eq('transaction_id', bankTransId.toString())
                        .maybeSingle();
                    
                     if (!existing) {
                          // Insert new success record
                          await supabase.from('transactions').insert({
                             user_id: parseInt(token), // Token is User ID
                             amount: amount,
                             description: description,
                             status: 'success',
                             transaction_id: bankTransId.toString(),
                             rewarded: false,
                             metadata: { bank_desc: description, matched_via: 'manual_transfer' }
                         });
                         console.log(`Inserted NEW success transaction for user ${token}`);
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
