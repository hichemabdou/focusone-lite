import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase';
import { calculateNetWorth } from '@/lib/finance/calculator';

// GET /api/finance/net-worth - Get current net worth and historical data
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'ALL'; // 1M, 3M, 6M, 1Y, ALL

        // Get all accounts
        const { data: accounts, error: accountsError } = await supabase
            .from('financial_accounts')
            .select('*')
            .eq('user_id', user.id);

        if (accountsError) {
            console.error('Error fetching accounts:', accountsError);
            return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
        }

        // Calculate current net worth
        const currentNetWorth = calculateNetWorth(accounts || []);

        // Get historical snapshots based on period
        let startDate: string | undefined;
        const now = new Date();

        switch (period) {
            case '1M':
                startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
                break;
            case '3M':
                startDate = new Date(now.setMonth(now.getMonth() - 3)).toISOString().split('T')[0];
                break;
            case '6M':
                startDate = new Date(now.setMonth(now.getMonth() - 6)).toISOString().split('T')[0];
                break;
            case '1Y':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
                break;
            default:
                // ALL - no start date filter
                break;
        }

        let snapshotsQuery = supabase
            .from('net_worth_snapshots')
            .select('*')
            .eq('user_id', user.id)
            .order('snapshot_date', { ascending: true });

        if (startDate) {
            snapshotsQuery = snapshotsQuery.gte('snapshot_date', startDate);
        }

        const { data: snapshots, error: snapshotsError } = await snapshotsQuery;

        if (snapshotsError) {
            console.error('Error fetching snapshots:', snapshotsError);
            return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
        }

        return NextResponse.json({
            current: currentNetWorth,
            history: snapshots || [],
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/finance/net-worth/snapshot - Create a net worth snapshot
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create snapshot using database function
        const { error } = await supabase.rpc('create_net_worth_snapshot', {
            p_user_id: user.id
        });

        if (error) {
            console.error('Error creating snapshot:', error);
            return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
        }

        // Fetch the created snapshot
        const { data: snapshot } = await supabase
            .from('net_worth_snapshots')
            .select('*')
            .eq('user_id', user.id)
            .eq('snapshot_date', new Date().toISOString().split('T')[0])
            .single();

        return NextResponse.json({ snapshot }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
