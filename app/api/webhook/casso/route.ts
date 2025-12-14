import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Handler for Casso/Sepay Webhook
        // Payload example: { error: 0, data: [ { id: 123, amount: 10000, description: "NAP 123456", ... } ] }
        
        const transactions = body.data || [];

        for (const txn of transactions) {
             const description = txn.description;
             const amount = txn.amount;
             const bankTransId = txn.id || txn.transactionID;
             
             // Extract User ID from "NAP {ID}"
             const match = description.match(/NAP\s*(\d+)/i);
             const userId = match ? match[1] : null;

             if (userId) {
                 // Check duplicate
                 const { data: existing } = await supabase
                    .from('transactions')
                    .select('id')
                    .eq('transaction_id', bankTransId)
                    .single();
                 
                 if (!existing) {
                     await supabase.from('transactions').insert({
                         user_id: userId,
                         amount: amount,
                         description: description,
                         status: 'success',
                         transaction_id: bankTransId,
                         rewarded: false,
                         created_at: new Date().toISOString()
                     });
                 }
             }
        }

        return NextResponse.json({ success: true, message: 'Webhook processed' });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
