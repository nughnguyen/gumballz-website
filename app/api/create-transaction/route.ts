import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';
import { getAuthenticatedUser } from '@/app/utils/adminAuth';
import { checkRateLimit, rateLimitResponse } from '@/app/utils/rateLimit';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { amount, userId, content, method, metadata } = body;

        // Ensure amount is a number
        const amountNum = Number(amount);
        if (!Number.isSafeInteger(amountNum) || amountNum < 1000 || amountNum > 10000000 || typeof content !== 'string' || !/^[A-Za-z0-9_-]{4,80}$/.test(content) || !['Banking', 'Momo'].includes(method)) {
            return NextResponse.json({ success: false, error: 'Invalid transaction details' }, { status: 400 });
        }

        let safeMetadata: Record<string, unknown>;
        let transactionUserId: string | null = null;
        if (metadata?.type === 'key') {
            const account = await getAuthenticatedUser(request);
            if (!account) return NextResponse.json({ success: false, error: 'Đăng nhập để mua key.' }, { status: 401 });
            const daysByPrice: Record<number, number> = { 2000: 1, 12000: 7, 50000: 30, 500000: 365 };
            if (!content.startsWith('KEY') || !['mod', 'roblox'].includes(metadata.category) || daysByPrice[amountNum] !== Number(metadata.duration_days)) return NextResponse.json({ success: false, error: 'Invalid key package' }, { status: 400 });
            safeMetadata = { type: 'key', category: metadata.category, duration_days: daysByPrice[amountNum] };
            transactionUserId = account.id;
        } else if (metadata?.type === 'deposit') {
            if (typeof userId !== 'string' || !/^\d{17,20}$/.test(userId) || content !== `GUMZ${userId}`) return NextResponse.json({ success: false, error: 'Invalid Discord ID' }, { status: 400 });
            safeMetadata = { type: 'deposit' };
            transactionUserId = userId;
        } else {
            return NextResponse.json({ success: false, error: 'Invalid purchase type' }, { status: 400 });
        }

        const rate = await checkRateLimit(request, 'create-transaction', 8, 60);
        if (!rate.allowed) return rateLimitResponse(rate);

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: transactionUserId,
                amount: amountNum,
                description: content,
                status: 'pending',
                rewarded: false,
                metadata: { ...safeMetadata, method, user_created: true }
            })
            .select()
            .single();
        
        if (error) {
            console.error("Supabase Create Error:", error);
            // Handle specific errors potentially, but generic for now
            return NextResponse.json({ success: false, error: error.message });
        }

        return NextResponse.json({ success: true, id: data.id });

    } catch (e: unknown) {
        console.error("Create Transaction Error:", e);
        return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal Error' }, { status: 500 });
    }
}
