import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';

// DELETE /api/finance/clear - Clear all finance data for the user
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getServiceSupabase();

        // Get user ID
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Delete all finance data for this user
        await supabase.from('transactions').delete().eq('user_id', user.id);
        await supabase.from('financial_accounts').delete().eq('user_id', user.id);
        await supabase.from('net_worth_snapshots').delete().eq('user_id', user.id);
        await supabase.from('financial_insights').delete().eq('user_id', user.id);
        await supabase.from('uploaded_financial_files').delete().eq('user_id', user.id);

        return NextResponse.json({
            message: 'All finance data cleared successfully'
        }, { status: 200 });
    } catch (error) {
        console.error('Error clearing finance data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
