import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { amount, userId, content, method } = body;

        // Ensure amount is a number
        const amountNum = parseInt(amount);
        if (isNaN(amountNum) || amountNum < 1000) {
            return NextResponse.json({ success: false, error: 'Invalid amount' });
        }

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: userId, // Assuming Supabase handles BigInt string or column is text
                amount: amountNum,
                description: content,
                status: 'pending',
                rewarded: false,
                metadata: { method, user_created: true }
            })
            .select()
            .single();
        
        if (error) {
            console.error("Supabase Create Error:", error);
            // Handle specific errors potentially, but generic for now
            return NextResponse.json({ success: false, error: error.message });
        }

        return NextResponse.json({ success: true, data });

    } catch (e: any) {
        console.error("Create Transaction Error:", e);
        return NextResponse.json({ success: false, error: e.message || 'Internal Error' }, { status: 500 });
    }
}
