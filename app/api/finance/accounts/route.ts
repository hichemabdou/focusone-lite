import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/finance/accounts - List all accounts for the user
export async function GET(request: NextRequest) {
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

        // Fetch accounts
        const { data: accounts, error } = await supabase
            .from('financial_accounts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching accounts:', error);
            return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
        }

        return NextResponse.json({ accounts });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/finance/accounts - Create a new account
export async function POST(request: NextRequest) {
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

        // Parse request body
        const body = await request.json();
        const {
            account_name,
            account_type,
            institution,
            account_number_last4,
            currency = 'USD',
            is_asset,
            current_balance = 0,
        } = body;

        // Validate required fields
        if (!account_name || !account_type || is_asset === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: account_name, account_type, is_asset' },
                { status: 400 }
            );
        }

        // Insert account
        const { data: account, error } = await supabase
            .from('financial_accounts')
            .insert({
                user_id: user.id,
                account_name,
                account_type,
                institution,
                account_number_last4,
                currency,
                is_asset,
                current_balance,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating account:', error);
            return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
        }

        // Create net worth snapshot
        await createNetWorthSnapshot(supabase, user.id);

        return NextResponse.json({ account }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/finance/accounts - Update an account
export async function PUT(request: NextRequest) {
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

        // Parse request body
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
        }

        // Update account
        const { data: account, error } = await supabase
            .from('financial_accounts')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating account:', error);
            return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
        }

        // Update net worth snapshot if balance changed
        if (updates.current_balance !== undefined) {
            await createNetWorthSnapshot(supabase, user.id);
        }

        return NextResponse.json({ account });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/finance/accounts - Delete an account
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

        // Get account ID from query params
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
        }

        // Delete account (transactions will be cascade deleted)
        const { error } = await supabase
            .from('financial_accounts')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting account:', error);
            return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
        }

        // Update net worth snapshot
        await createNetWorthSnapshot(supabase, user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper function to create net worth snapshot
async function createNetWorthSnapshot(supabase: any, userId: string) {
    try {
        // Call the database function to create snapshot
        await supabase.rpc('create_net_worth_snapshot', { p_user_id: userId });
    } catch (error) {
        console.error('Error creating net worth snapshot:', error);
        // Don't fail the request if snapshot creation fails
    }
}
