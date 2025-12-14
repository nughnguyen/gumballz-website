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
        // Casso structure: { error, data: [...] }
        // SePay structure: { id, gateway, ... } (Single object) OR { transactions: [...] }
        
        let transactions: any[] = [];
        
        if (body.data && Array.isArray(body.data)) {
            // Casso
            transactions = body.data;
        } else if (body.id && (body.gateway || body.transferAmount)) {
            // SePay Single Transaction
            transactions = [body];
        } else if (body.transactions && Array.isArray(body.transactions)) {
            // Generic list
            transactions = body.transactions;
        }

        if (transactions.length === 0) {
             return NextResponse.json({ success: true, message: 'No transactions found' });
        }

        for (const txn of transactions) {
             // Unified field extraction
             const description = txn.description || txn.content || "";
             const amount = txn.amount || txn.transferAmount || 0;
             const bankTransId = txn.id || txn.transactionID || txn.referenceCode || `txn_${Date.now()}`;
             
             // Extract User ID from "GUMZ {ID}"
             // Handles: "GUMZ 123", "Gumz123", "GUMZ: 123"
             const match = description.match(/GUMZ\s*[:]?\s*(\d+)/i);
             const userId = match ? match[1] : null;

             if (userId) {
                 // Check duplicate in Supabase
                 // Note: 'transaction_id' column must be unique ideally
                 const { data: existing } = await supabase
                    .from('transactions')
                    .select('id')
                    .eq('transaction_id', bankTransId.toString())
                    .single();
                 
                 if (!existing) {
                     await supabase.from('transactions').insert({
                         user_id: parseInt(userId),
                         amount: amount,
                         description: description,
                         status: 'success',
                         transaction_id: bankTransId.toString(),
                         rewarded: false
                     });
                 }
             }
        }

        return NextResponse.json({ success: true, message: 'Webhook processed' });
    } catch (e) {
        console.error("Webhook Error:", e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
