import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/app/utils/supabaseServer';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateVipKey(): string {
  const shortKey = crypto.randomBytes(5).toString('hex').toUpperCase();
  return `GUMBALLZ-${shortKey}`;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const txId = searchParams.get('id');
    const content = searchParams.get('content');

    if (!txId && !content) return NextResponse.json({ success: false });

    let query = supabase
        .from('transactions')
        .select('*');

    if (txId) {
        query = query.eq('id', txId);
    } else if (content) {
        query = query.ilike('description', content);
    }

    const { data: transaction, error } = await query.maybeSingle();

    if (error || !transaction) {
        return NextResponse.json({ success: false });
    }

    // Nếu giao dịch thành công
    if (transaction.status === 'success') {
        let vipKey = transaction.metadata?.generated_key;

        // Nếu là giao dịch mua key và chưa có key trong metadata thì tạo mới
        if (transaction.metadata?.type === 'key' && !vipKey) {
            vipKey = generateVipKey();
            const expiresAt = new Date();
            const days = transaction.metadata?.duration_days || 30;
            expiresAt.setDate(expiresAt.getDate() + days);

            // Lưu key vào bảng mod_keys
            await supabase.from('mod_keys').insert({
                key_value: vipKey,
                key_type: 'PREMIUM',
                duration_days: days,
                expires_at: expiresAt.toISOString(),
                is_active: true
            });

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
            type: transaction.metadata?.type
        });
    }
    
    return NextResponse.json({ success: false, status: transaction.status });
}
