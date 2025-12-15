import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabaseClient';

export async function GET() {
    try {
        // Calculate threshold (15 minutes ago)
        const threshold = new Date(Date.now() - 15 * 60 * 1000).toISOString();

        // Delete pending
        const { error: err1 } = await supabase
            .from('transactions')
            .delete()
            .eq('status', 'pending')
            .lt('created_at', threshold);

        // Delete expired if any
        const { error: err2 } = await supabase
            .from('transactions')
            .delete()
            .eq('status', 'expired');

        if (err1 || err2) {
             return NextResponse.json({ success: false, error: err1 || err2 });
        }

        return NextResponse.json({ success: true, message: 'Cleanup completed' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
