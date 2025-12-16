import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const txId = searchParams.get('id');
    const content = searchParams.get('content');

    if (!txId && !content) return NextResponse.json({ success: false });

    let query = supabase
        .from('transactions')
        .select('status')
        .eq('status', 'success');

    if (txId) {
        query = query.eq('id', txId);
    } else if (content) {
        // Use ilike for case-insensitive matching of the order code
        query = query.ilike('description', content);
    }

    const { data } = await query.maybeSingle();

    if (data) {
        return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false });
}
