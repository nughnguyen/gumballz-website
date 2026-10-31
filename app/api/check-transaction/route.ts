import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';
import { generateModKey, generateRobloxKey } from '@/app/lib/key-generator';
import { checkRateLimit, rateLimitResponse } from '@/app/utils/rateLimit';
import { getAuthenticatedUser } from '@/app/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const rate = await checkRateLimit(request, 'check-transaction', 40, 60);
    if (!rate.allowed) return rateLimitResponse(rate);
    const { searchParams } = new URL(request.url);
    const txId = searchParams.get('id');
    const content = searchParams.get('content');

    if (!txId && !content) return NextResponse.json({ success: false });

    let query = supabase
        .from('transactions')
        .select('id,user_id,status,metadata');

    if (txId) {
        query = query.eq('id', txId);
    } else if (content) {
        query = query.ilike('description', content);
    }

    const { data: transaction, error } = await query.maybeSingle();

    if (error || !transaction) {
        return NextResponse.json({ success: false });
    }

    // A successful key transaction contains a bearer credential. Only its owner may retrieve or trigger issuance.
    if (transaction.metadata?.type === 'key') {
        const user = await getAuthenticatedUser(request);
        if (!user || user.id !== transaction.user_id) {
            return NextResponse.json({ success: transaction.status === 'success', status: transaction.status }, { headers: { 'Cache-Control': 'private, no-store' } });
        }
    }

    // Nếu giao dịch thành công
    if (transaction.status === 'success') {
        let vipKey = transaction.metadata?.generated_key;

        // Nếu là giao dịch mua key và chưa có key trong metadata thì tạo mới
        if (transaction.metadata?.type === 'key' && !vipKey) {
            const category = transaction.metadata?.category || 'mod'; // 'mod' or 'roblox'
            const days = transaction.metadata?.duration_days || 30;
            
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + days);

            if (category === 'roblox') {
                vipKey = generateRobloxKey();
                await supabase.from('roblox_keys').insert({
                    key_value: vipKey,
                    key_type: 'premium',
                    category: 'roblox',
                    expires_at: expiresAt.toISOString(),
                    is_used: false,
                    metadata: { transaction_id: transaction.id, duration_days: days }
                });
            } else {
                vipKey = generateModKey();
                await supabase.from('mod_keys').insert({
                    key_value: vipKey,
                    key_type: 'PREMIUM',
                    duration_days: days,
                    expires_at: expiresAt.toISOString(),
                    is_active: true
                });
            }

            // Cập nhật lại metadata của transaction để lần sau refresh vẫn thấy
            const newMetadata = { ...transaction.metadata, generated_key: vipKey };
            await supabase
                .from('transactions')
                .update({ metadata: newMetadata })
                .eq('id', transaction.id);
        }

        return NextResponse.json({ 
            success: true, 
            status: transaction.status,
            key: vipKey,
            type: transaction.metadata?.type,
            category: transaction.metadata?.category
        }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    
    return NextResponse.json({
        success: false,
        status: transaction.status,
        manualReviewRequested: transaction.metadata?.manual_review_requested === true,
    });
}
