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
        .select('id,user_id,status,amount,metadata');

    if (txId) {
        query = query.eq('id', txId);
    } else if (content) {
        query = query.ilike('description', content);
    }

    const { data: transaction, error } = await query.maybeSingle();

    if (error || !transaction) {
        return NextResponse.json({ success: false });
    }

    let transactionStatus = transaction.status;
    let transactionMetadata = transaction.metadata || {};

    // PayOS return URLs are only a browser redirect, so confirm the order with
    // PayOS's authenticated API as well as accepting the signed webhook.
    const orderCode = transactionMetadata.payos_order_code;
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    if (['pending', 'expired'].includes(transactionStatus) && orderCode && clientId && apiKey) {
        try {
            const payosResponse = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${encodeURIComponent(String(orderCode))}`, {
                headers: { 'x-client-id': clientId, 'x-api-key': apiKey },
                cache: 'no-store',
                signal: AbortSignal.timeout(5000),
            });
            const payosResult = await payosResponse.json().catch(() => null);
            const payosData = payosResult?.data;
            if (payosResponse.ok && payosResult?.code === '00'
                && String(payosData?.orderCode) === String(orderCode)
                && Number(payosData?.amount) === Number(transaction.amount)
                && payosData?.status === 'PAID'
                && Number(payosData?.amountPaid ?? payosData?.amount) >= Number(payosData?.amount)) {
                const paymentReference = String(payosData?.transactions?.[0]?.reference || payosData?.id || orderCode);
                const paidMetadata = {
                    ...transactionMetadata,
                    source: 'payos',
                    payos_payment_link_id: String(payosData?.id || ''),
                    payos_reference: paymentReference,
                    payos_paid_at: new Date().toISOString(),
                };
                const { data: settled, error: settleError } = await supabase.from('transactions')
                    .update({ status: 'success', transaction_id: paymentReference, metadata: paidMetadata })
                    .eq('id', transaction.id).eq('amount', payosData.amount).in('status', ['pending', 'expired'])
                    .select('id').maybeSingle();
                if (settleError) console.error('PayOS status reconciliation failed:', settleError);
                else if (settled) {
                    transactionStatus = 'success';
                    transactionMetadata = paidMetadata;
                } else {
                    const { data: latest } = await supabase.from('transactions').select('status,metadata').eq('id', transaction.id).maybeSingle();
                    if (latest?.status === 'success') {
                        transactionStatus = 'success';
                        transactionMetadata = latest.metadata || transactionMetadata;
                    }
                }
            }
        } catch (error) {
            console.error('PayOS status check failed:', error);
        }
    }

    // A successful key transaction contains a bearer credential. Only its owner may retrieve or trigger issuance.
    if (transactionMetadata?.type === 'key') {
        const user = await getAuthenticatedUser(request);
        if (!user || user.id !== transaction.user_id) {
            return NextResponse.json({ success: transactionStatus === 'success', status: transactionStatus }, { headers: { 'Cache-Control': 'private, no-store' } });
        }
    }

    // Nếu giao dịch thành công
    if (transactionStatus === 'success') {
        let vipKey = transactionMetadata?.generated_key;

        // Nếu là giao dịch mua key và chưa có key trong metadata thì tạo mới
        if (transactionMetadata?.type === 'key' && !vipKey) {
            const category = transactionMetadata?.category || 'mod'; // 'mod' or 'roblox'
            const days = transactionMetadata?.duration_days || 30;
            
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
            const newMetadata = { ...transactionMetadata, generated_key: vipKey };
            await supabase
                .from('transactions')
                .update({ metadata: newMetadata })
                .eq('id', transaction.id);
        }

        return NextResponse.json({ 
            success: true, 
            status: transactionStatus,
            key: vipKey,
            type: transactionMetadata?.type,
            category: transactionMetadata?.category
        }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    
    return NextResponse.json({
        success: false,
        status: transactionStatus,
        manualReviewRequested: transactionMetadata?.manual_review_requested === true,
    });
}
