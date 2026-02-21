import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';

export async function GET() {
    return NextResponse.json({ success: true, message: 'Casso Webhook is active' });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Casso Webhook payload:", body);

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
                 console.log(`Casso Webhook: Found raw token '${token}' in '${description}'`);
                 
                 // Try to find a pending transaction with this token in description
                 const { data: pendingTxn } = await supabase
                     .from('transactions')
                     .select('id, user_id, created_at, metadata, amount')
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
                     
                     // Optional: Check if amount matches. If not, log it but still mark as successful if token is unique enough.
                     // For Minecraft/Roblox we want exact match usually. 
                     if (Math.abs(pendingTxn.amount - amount) > 10) {
                         console.warn(`Amount mismatch for ${token}: expected ${pendingTxn.amount}, got ${amount}`);
                     }

                     await supabase.from('transactions').update({
                         status: newStatus,
                         transaction_id: bankTransId.toString(),
                         amount: amount, 
                         metadata: { ...(pendingTxn.metadata as object), bank_desc: description, source: 'casso' }
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
                             status: 'success', // We assume success here if token matched nothing pending but is valid format
                             transaction_id: bankTransId.toString(),
                             rewarded: false,
                             metadata: { source: 'casso', original_desc: description }
                         });
                     }
                 }
             } else {
                 // No token found - Legacy fallback
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
                          metadata: { source: 'casso' }
                     });
                 }
             }
        }

        return NextResponse.json({ success: true, message: 'Casso Webhook processed' });
    } catch (e) {
        console.error("Casso Webhook Error:", e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
