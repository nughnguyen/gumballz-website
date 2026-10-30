import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('id');
        // API keys must not be sent in URLs, which are commonly retained in logs.
        const validKey = process.env.MINECRAFT_API_KEY;
        const authorization = request.headers.get('authorization') || '';
        const apiKey = request.headers.get('x-api-key') || (authorization.startsWith('Bearer ') ? authorization.slice(7) : '');
        if (!validKey || apiKey !== validKey) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (!orderId) {
            return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
        }

        // Fetch transaction
        const { data: transaction, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', orderId)
            .maybeSingle();

        if (error || !transaction) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        // Check if it's a minecraft transaction
        if (transaction.metadata?.type !== 'minecraft') {
            return NextResponse.json({ success: false, error: 'Not a minecraft order' }, { status: 400 });
        }

        // Still pending
        if (transaction.status === 'pending') {
            return NextResponse.json({ success: false, status: 'pending' });
        }

        // Late payment or failed
        if (transaction.status === 'late_payment') {
            return NextResponse.json({ success: false, status: 'expired', message: 'Giao dịch quá hạn (>10 phút)' });
        }

        if (transaction.status !== 'success') {
            return NextResponse.json({ success: false, status: transaction.status });
        }

        // Already rewarded → still return success to acknowledge
        if (transaction.rewarded) {
            return NextResponse.json({
                success: true,
                status: 'already_rewarded',
                playerName: transaction.metadata?.playerName,
                rewardType: transaction.metadata?.rewardType,
                rewardValue: transaction.metadata?.rewardValue,
            });
        }

        // Mark as rewarded FIRST to prevent double reward (atomic-style)
        const { data: claimed, error: updateError } = await supabase
            .from('transactions')
            .update({ rewarded: true })
            .eq('id', orderId)
            .eq('rewarded', false)
            .select('id')
            .maybeSingle();

        if (updateError) {
            console.error('Minecraft Check Order: Failed to mark rewarded', updateError);
            return NextResponse.json({ success: false, error: 'Reward processing error' }, { status: 500 });
        }
        if (!claimed) return NextResponse.json({ success: false, status: 'already_rewarded' }, { status: 409 });

        return NextResponse.json({
            success: true,
            status: 'success',
            playerName: transaction.metadata?.playerName,
            packageId: transaction.metadata?.packageId,
            rewardType: transaction.metadata?.rewardType,   // 'rank' | 'money'
            rewardValue: transaction.metadata?.rewardValue, // group name or amount
            amount: transaction.amount,
        });

    } catch (e: unknown) {
        const err = e as Error;
        console.error('Minecraft Check Order Error:', err);
        return NextResponse.json({ success: false, error: err.message || 'Internal Error' }, { status: 500 });
    }
}
