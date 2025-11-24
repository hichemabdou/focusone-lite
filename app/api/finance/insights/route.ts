import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase';
import { generateInsights } from '@/lib/finance/insightsEngine';
import { calculateFinancialMetrics, calculateCategoryBreakdown } from '@/lib/finance/calculator';

// GET /api/finance/insights - Get current insights
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
        const includeDismissed = searchParams.get('include_dismissed') === 'true';

        // Fetch insights
        let query = supabase
            .from('financial_insights')
            .select('*')
            .eq('user_id', user.id)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false });

        if (!includeDismissed) {
            query = query.eq('is_dismissed', false);
        }

        const { data: insights, error } = await query;

        if (error) {
            console.error('Error fetching insights:', error);
            return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
        }

        return NextResponse.json({ insights });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/finance/insights/generate - Generate new insights
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch accounts
        const { data: accounts } = await supabase
            .from('financial_accounts')
            .select('*')
            .eq('user_id', user.id);

        // Fetch transactions (last 3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .gte('transaction_date', threeMonthsAgo.toISOString().split('T')[0]);

        if (!accounts || !transactions) {
            return NextResponse.json({ insights: [] });
        }

        // Calculate metrics
        const metrics = calculateFinancialMetrics(accounts, transactions);
        const categoryBreakdown = calculateCategoryBreakdown(transactions);

        // Generate insights
        const newInsights = generateInsights({
            metrics,
            transactions,
            categoryBreakdown,
        });

        // Delete old non-dismissed insights
        await supabase
            .from('financial_insights')
            .delete()
            .eq('user_id', user.id)
            .eq('is_dismissed', false);

        // Insert new insights
        if (newInsights.length > 0) {
            const insightsToInsert = newInsights.map(insight => ({
                ...insight,
                user_id: user.id,
            }));

            const { data: insertedInsights, error: insertError } = await supabase
                .from('financial_insights')
                .insert(insightsToInsert)
                .select();

            if (insertError) {
                console.error('Error inserting insights:', insertError);
                return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
            }

            return NextResponse.json({ insights: insertedInsights }, { status: 201 });
        }

        return NextResponse.json({ insights: [] });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/finance/insights - Dismiss an insight
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
        const { id, is_dismissed = true } = body;

        if (!id) {
            return NextResponse.json({ error: 'Insight ID is required' }, { status: 400 });
        }

        // Update insight
        const { data: insight, error } = await supabase
            .from('financial_insights')
            .update({ is_dismissed })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating insight:', error);
            return NextResponse.json({ error: 'Failed to update insight' }, { status: 500 });
        }

        return NextResponse.json({ insight });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
