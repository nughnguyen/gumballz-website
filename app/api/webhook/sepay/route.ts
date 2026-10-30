import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';

const success = () => NextResponse.json({ success: true });

export async function GET() {
    return NextResponse.json({ success: true, message: 'SePay Webhook is active' });
}

function constantTimeEqual(left: string, right: string) {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
    const rawBody = await request.text();
    const apiKey = process.env.SEPAY_API_KEY;
    const hmacSecret = process.env.SEPAY_WEBHOOK_SECRET;
    let authenticated = false;

    if (hmacSecret) {
        const timestamp = request.headers.get('x-sepay-timestamp') || '';
        const signature = request.headers.get('x-sepay-signature') || '';
        const expected = `sha256=${createHmac('sha256', hmacSecret).update(`${timestamp}.${rawBody}`).digest('hex')}`;
        authenticated = /^\d+$/.test(timestamp)
            && Math.abs(Date.now() / 1000 - Number(timestamp)) <= 300
            && constantTimeEqual(signature, expected);
    }
    if (!authenticated && apiKey) {
        authenticated = constantTimeEqual(request.headers.get('authorization') || '', `Apikey ${apiKey}`);
    }
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });

    try {
        const body: Record<string, unknown> = JSON.parse(rawBody);
        const transactions: Record<string, unknown>[] = Array.isArray(body.data)
            ? body.data as Record<string, unknown>[]
            : Array.isArray(body.transactions)
                ? body.transactions as Record<string, unknown>[]
                : body.id !== undefined ? [body] : [];

        for (const txn of transactions) {
            const eventId = txn.id;
            if (eventId === undefined || eventId === null || !/^\d+$/.test(String(eventId))) {
                // Without SePay's stable event id we cannot safely prevent replayed credits.
                return NextResponse.json({ error: 'Missing SePay event id' }, { status: 400 });
            }

            const { error: claimError } = await supabase
                .from('sepay_webhook_events')
                .insert({ event_id: String(eventId), status: 'processing' });
            if (claimError?.code === '23505') {
                const { data: prior } = await supabase
                    .from('sepay_webhook_events')
                    .select('status')
                    .eq('event_id', String(eventId))
                    .maybeSingle();
                if (prior?.status === 'processed') continue;
                return NextResponse.json({ error: 'Event is being processed; retry later' }, { status: 503 });
            }
            if (claimError) throw claimError;

            try {
                const transferType = String(txn.transferType || 'in').toLowerCase();
                if (transferType === 'in') {
                    const description = String(txn.content || txn.description || '');
                    const amount = Number(txn.transferAmount ?? txn.amount ?? 0);
                    if (Number.isSafeInteger(amount) && amount > 0) {
                        const code = typeof txn.code === 'string' && txn.code.trim()
                            ? txn.code.trim()
                            : description.match(/\b((?:GUMZ\d{17,20}|GZ[A-Z0-9]{4,10}|MC[A-Z0-9]{4,10}|KEY[A-Z0-9]{4,20}|TOOL[A-Z0-9]{4,20}))\b/i)?.[1];
                        const bankTransactionId = String(eventId);

                        if (code) {
                            const { data: pending } = await supabase.from('transactions')
                                .select('id, user_id, created_at, metadata, amount')
                                .eq('status', 'pending')
                                .ilike('description', `%${code}%`)
                                .maybeSingle();
                            if (pending && Number(pending.amount) === amount) {
                                const late = Date.now() - new Date(pending.created_at).getTime() > 10 * 60 * 1000;
                                const { error } = await supabase.from('transactions').update({
                                    status: late ? 'late_payment' : 'success',
                                    transaction_id: bankTransactionId,
                                    metadata: { ...(pending.metadata as Record<string, unknown>), bank_desc: description, source: 'sepay' },
                                }).eq('id', pending.id).eq('status', 'pending');
                                if (error) throw error;
                            } else {
                                const { error } = await supabase.from('transactions').insert({
                                    user_id: null,
                                    amount,
                                    description,
                                    status: 'ignored_code_not_found',
                                    transaction_id: bankTransactionId,
                                    rewarded: false,
                                    metadata: { source: 'sepay', original_desc: description, order_code: code },
                                });
                                if (error) throw error;
                            }
                        } else {
                            const { error } = await supabase.from('transactions').insert({
                                user_id: null,
                                amount,
                                description,
                                status: 'ignored_code_not_found',
                                transaction_id: bankTransactionId,
                                rewarded: false,
                                metadata: { source: 'sepay', original_desc: description },
                            });
                            if (error) throw error;
                        }
                    }
                }

                const { error: completeError } = await supabase.from('sepay_webhook_events')
                    .update({ status: 'processed', processed_at: new Date().toISOString() })
                    .eq('event_id', String(eventId));
                if (completeError) throw completeError;
            } catch (error) {
                // Release an uncompleted claim so SePay can retry safely.
                await supabase.from('sepay_webhook_events').delete().eq('event_id', String(eventId)).eq('status', 'processing');
                throw error;
            }
        }

        // SePay requires this exact response body to stop retrying.
        return success();
    } catch (error) {
        console.error('SePay webhook processing failed:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
