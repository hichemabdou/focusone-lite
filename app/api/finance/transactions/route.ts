import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase';
import { Transaction } from '@/lib/finance/types';
import { generateTransactionHash } from '@/lib/finance/duplicateDetector';
import { categorizeTransaction, determineTransactionType, isLikelyRecurring } from '@/lib/finance/transactionCategorizer';

// GET /api/finance/transactions - List transactions with optional filters
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('account_id');
        const category = searchParams.get('category');
        const type = searchParams.get('type');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query
        let query = supabase
            .from('transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id);

        if (accountId) {
            query = query.eq('account_id', accountId);
        }

        if (category) {
            query = query.eq('category', category);
        }

        if (type) {
            query = query.eq('transaction_type', type);
        }

        if (startDate) {
            query = query.gte('transaction_date', startDate);
        }

        if (endDate) {
            query = query.lte('transaction_date', endDate);
        }

        // Execute query with pagination
        const { data: transactions, error, count } = await query
            .order('transaction_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching transactions:', error);
            return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
        }

        return NextResponse.json({
            transactions,
            total: count,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/finance/transactions - Create a new transaction
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const {
            account_id,
            transaction_date,
            description,
            amount,
            category,
            transaction_type,
            is_recurring,
            notes,
        } = body;

        // Validate required fields
        if (!transaction_date || !description || amount === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: transaction_date, description, amount' },
                { status: 400 }
            );
        }

        // Auto-categorize if not provided
        const finalCategory = category || categorizeTransaction(description, amount);
        const finalType = transaction_type || determineTransactionType(description, amount);
        const finalIsRecurring = is_recurring !== undefined ? is_recurring : isLikelyRecurring(description, amount);

        // Generate hash for duplicate detection
        const hash = generateTransactionHash({
            date: new Date(transaction_date),
            description,
            amount,
        });

        // Check for duplicates
        const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('hash', hash)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Duplicate transaction detected' },
                { status: 409 }
            );
        }

        // Insert transaction
        const { data: transaction, error } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                account_id,
                transaction_date,
                description,
                amount,
                category: finalCategory,
                transaction_type: finalType,
                is_recurring: finalIsRecurring,
                notes,
                hash,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating transaction:', error);
            return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
        }

        // Update account balance if account_id is provided
        if (account_id) {
            await updateAccountBalance(supabase, account_id, amount);
        }

        return NextResponse.json({ transaction }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/finance/transactions - Update a transaction
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
        }

        // Get original transaction to calculate balance change
        const { data: original } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        // Update hash if date, description, or amount changed
        if (updates.transaction_date || updates.description || updates.amount) {
            const date = updates.transaction_date || original?.transaction_date;
            const description = updates.description || original?.description;
            const amount = updates.amount !== undefined ? updates.amount : original?.amount;

            updates.hash = generateTransactionHash({ date, description, amount });
        }

        // Update transaction
        const { data: transaction, error } = await supabase
            .from('transactions')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating transaction:', error);
            return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
        }

        // Update account balance if amount changed
        if (original && updates.amount !== undefined && original.account_id) {
            const balanceChange = updates.amount - original.amount;
            await updateAccountBalance(supabase, original.account_id, balanceChange);
        }

        return NextResponse.json({ transaction });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/finance/transactions - Delete a transaction
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get transaction ID from query params
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
        }

        // Get transaction to reverse balance change
        const { data: transaction } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        // Delete transaction
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting transaction:', error);
            return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
        }

        // Reverse account balance if account_id exists
        if (transaction?.account_id) {
            await updateAccountBalance(supabase, transaction.account_id, -transaction.amount);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper function to update account balance
async function updateAccountBalance(supabase: any, accountId: string, amountChange: number) {
    try {
        // Get current balance
        const { data: account } = await supabase
            .from('financial_accounts')
            .select('current_balance')
            .eq('id', accountId)
            .single();

        if (account) {
            const newBalance = account.current_balance + amountChange;

            await supabase
                .from('financial_accounts')
                .update({ current_balance: newBalance })
                .eq('id', accountId);

            // Get user_id to create snapshot
            const { data: accountData } = await supabase
                .from('financial_accounts')
                .select('user_id')
                .eq('id', accountId)
                .single();

            if (accountData) {
                await supabase.rpc('create_net_worth_snapshot', { p_user_id: accountData.user_id });
            }
        }
    } catch (error) {
        console.error('Error updating account balance:', error);
    }
}
