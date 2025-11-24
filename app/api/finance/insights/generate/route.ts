import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { generateInsights } from '@/lib/finance/insightsEngine';
import { calculateFinancialMetrics, calculateCategoryBreakdown } from '@/lib/finance/calculator';

// POST /api/finance/insights/generate - Generate new insights
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

        // Fetch user's financial data
        const { data: accounts } = await supabase
            .from('financial_accounts')
            .select('*')
            .eq('user_id', user.id);

        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('transaction_date', { ascending: false })
            .limit(1000);

        if (!accounts || !transactions || accounts.length === 0 || transactions.length === 0) {
            return NextResponse.json({
                message: 'Not enough data to generate insights',
                insights: [],
            });
        }

        // Calculate metrics
        const metrics = calculateFinancialMetrics(accounts, transactions);
        const categoryBreakdown = calculateCategoryBreakdown(transactions);

        // Generate insights
        const insights = generateInsights(metrics, categoryBreakdown, transactions);

        // Save insights to database
        const insightsToSave = insights.map(insight => ({
            user_id: user.id,
            insight_type: insight.type,
            title: insight.title,
            message: insight.message,
            action_label: insight.actionLabel,
            priority: insight.priority,
        }));

        if (insightsToSave.length > 0) {
            await supabase
                .from('financial_insights')
                .insert(insightsToSave);
        }

        return NextResponse.json({
            message: 'Insights generated successfully',
            count: insights.length,
        }, { status: 201 });
    } catch (error) {
        console.error('Error generating insights:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
