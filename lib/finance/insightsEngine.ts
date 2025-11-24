// Financial Insights Generation Engine

import {
    FinancialInsight,
    FinancialMetrics,
    Transaction,
    CategoryBreakdown,
    InsightType,
} from './types';
import { calculateCategoryMoMChange } from './calculator';

interface InsightRule {
    check: (data: FinancialData) => boolean;
    generate: (data: FinancialData) => Omit<FinancialInsight, 'id' | 'user_id' | 'created_at'>;
}

interface FinancialData {
    metrics: FinancialMetrics;
    transactions: Transaction[];
    categoryBreakdown: CategoryBreakdown[];
}

/**
 * Generate financial insights based on user's financial data
 */
export function generateInsights(data: FinancialData): Omit<FinancialInsight, 'id' | 'user_id' | 'created_at'>[] {
    const insights: Omit<FinancialInsight, 'id' | 'user_id' | 'created_at'>[] = [];

    // Run all insight rules
    for (const rule of INSIGHT_RULES) {
        try {
            if (rule.check(data)) {
                insights.push(rule.generate(data));
            }
        } catch (error) {
            console.error('Error generating insight:', error);
        }
    }

    // Sort by priority (higher first)
    return insights.sort((a, b) => b.priority - a.priority);
}

/**
 * Insight Rules
 */
const INSIGHT_RULES: InsightRule[] = [
    // Positive: Great savings rate
    {
        check: (data) => data.metrics.savingsRate >= 20,
        generate: (data) => ({
            insight_type: 'positive',
            title: 'Excellent savings rate!',
            message: `You're saving ${data.metrics.savingsRate.toFixed(1)}% of your income this month, which is above the recommended 20%. Keep up the great work!`,
            action_label: 'View Savings',
            is_dismissed: false,
            priority: 5,
        }),
    },

    // Warning: Low savings rate
    {
        check: (data) => data.metrics.savingsRate < 10 && data.metrics.savingsRate > 0,
        generate: (data) => ({
            insight_type: 'warning',
            title: 'Low savings rate',
            message: `You're only saving ${data.metrics.savingsRate.toFixed(1)}% of your income. Financial experts recommend saving at least 20%.`,
            action_label: 'Create Budget',
            is_dismissed: false,
            priority: 8,
        }),
    },

    // Warning: Spending more than earning
    {
        check: (data) => data.metrics.monthlySavings < 0,
        generate: (data) => ({
            insight_type: 'warning',
            title: 'Spending exceeds income',
            message: `You're spending $${Math.abs(data.metrics.monthlySavings).toFixed(0)} more than you earn this month. This is unsustainable long-term.`,
            action_label: 'Review Expenses',
            is_dismissed: false,
            priority: 10,
        }),
    },

    // Warning: Category spending increase
    {
        check: (data) => {
            const topCategory = data.categoryBreakdown[0];
            if (!topCategory) return false;

            const change = calculateCategoryMoMChange(data.transactions, topCategory.category);
            return change.percentage > 15;
        },
        generate: (data) => {
            const topCategory = data.categoryBreakdown[0];
            const change = calculateCategoryMoMChange(data.transactions, topCategory.category);

            return {
                insight_type: 'warning',
                title: `${topCategory.category} spending increased`,
                message: `Your ${topCategory.category} spending is up ${change.percentage.toFixed(1)}% from last month. Consider reviewing these expenses.`,
                action_label: 'View Transactions',
                action_data: { category: topCategory.category },
                is_dismissed: false,
                priority: 7,
            };
        },
    },

    // Recommendation: Build emergency fund
    {
        check: (data) => data.metrics.emergencyFundMonths < 3,
        generate: (data) => ({
            insight_type: 'recommendation',
            title: 'Build your emergency fund',
            message: `You have ${data.metrics.emergencyFundMonths.toFixed(1)} months of expenses saved. Financial experts recommend 3-6 months. Consider building your emergency fund.`,
            action_label: 'Set Goal',
            is_dismissed: false,
            priority: 9,
        }),
    },

    // Positive: Strong emergency fund
    {
        check: (data) => data.metrics.emergencyFundMonths >= 6,
        generate: (data) => ({
            insight_type: 'positive',
            title: 'Strong emergency fund',
            message: `You have ${data.metrics.emergencyFundMonths.toFixed(1)} months of expenses saved. Your emergency fund is well-funded!`,
            action_label: 'View Assets',
            is_dismissed: false,
            priority: 4,
        }),
    },

    // Recommendation: High debt-to-income ratio
    {
        check: (data) => data.metrics.debtToIncomeRatio > 36,
        generate: (data) => ({
            insight_type: 'recommendation',
            title: 'High debt-to-income ratio',
            message: `Your debt payments are ${data.metrics.debtToIncomeRatio.toFixed(1)}% of your income. Lenders prefer this to be below 36%. Consider debt reduction strategies.`,
            action_label: 'Learn More',
            is_dismissed: false,
            priority: 8,
        }),
    },

    // Info: Investment opportunity
    {
        check: (data) => {
            // Check if user has significant cash in checking (more than 2 months expenses)
            const checkingBalance = data.metrics.totalAssets * 0.2; // Estimate
            return checkingBalance > data.metrics.monthlyExpenses * 2;
        },
        generate: (data) => ({
            insight_type: 'info',
            title: 'Investment opportunity',
            message: 'You have excess cash in your checking account. Consider investing to maximize returns and build long-term wealth.',
            action_label: 'Explore Options',
            is_dismissed: false,
            priority: 6,
        }),
    },

    // Recommendation: Recurring subscriptions
    {
        check: (data) => {
            const subscriptions = data.transactions.filter(t =>
                t.is_recurring &&
                t.category === 'Streaming Services'
            );
            return subscriptions.length > 3;
        },
        generate: (data) => {
            const subscriptions = data.transactions.filter(t =>
                t.is_recurring &&
                t.category === 'Streaming Services'
            );
            const total = subscriptions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

            return {
                insight_type: 'recommendation',
                title: 'Multiple streaming subscriptions detected',
                message: `You have ${subscriptions.length} streaming subscriptions costing $${total.toFixed(0)}/month. Consider consolidating to save money.`,
                action_label: 'Review Subscriptions',
                is_dismissed: false,
                priority: 5,
            };
        },
    },

    // Positive: Debt reduction progress
    {
        check: (data) => {
            // Check if debt payments are happening regularly
            const debtPayments = data.transactions.filter(t =>
                t.category === 'Loan Payment' || t.category === 'Credit Card Payment'
            );
            return debtPayments.length > 0 && data.metrics.debtToIncomeRatio < 30;
        },
        generate: (data) => ({
            insight_type: 'positive',
            title: 'Debt reduction on track',
            message: 'You\'re making consistent debt payments and maintaining a healthy debt-to-income ratio. Keep it up!',
            action_label: 'View Progress',
            is_dismissed: false,
            priority: 6,
        }),
    },

    // Info: Positive net worth
    {
        check: (data) => data.metrics.netWorth > 0 && data.metrics.netWorth < 10000,
        generate: (data) => ({
            insight_type: 'info',
            title: 'Positive net worth milestone',
            message: `Your net worth is $${data.metrics.netWorth.toFixed(0)}. You're building wealth! Keep focusing on increasing assets and reducing liabilities.`,
            action_label: 'View Net Worth',
            is_dismissed: false,
            priority: 5,
        }),
    },

    // Recommendation: Dining out expenses
    {
        check: (data) => {
            const diningCategory = data.categoryBreakdown.find(c => c.category === 'Dining Out');
            if (!diningCategory) return false;

            return diningCategory.percentage > 15; // More than 15% of expenses on dining
        },
        generate: (data) => {
            const diningCategory = data.categoryBreakdown.find(c => c.category === 'Dining Out')!;

            return {
                insight_type: 'recommendation',
                title: 'High dining expenses',
                message: `You're spending $${diningCategory.amount.toFixed(0)} on dining out (${diningCategory.percentage.toFixed(1)}% of expenses). Meal prepping could save you money.`,
                action_label: 'See Alternatives',
                is_dismissed: false,
                priority: 6,
            };
        },
    },
];

/**
 * Get priority level description
 */
export function getPriorityLabel(priority: number): string {
    if (priority >= 9) return 'Critical';
    if (priority >= 7) return 'High';
    if (priority >= 5) return 'Medium';
    return 'Low';
}

/**
 * Get insight icon based on type
 */
export function getInsightIcon(type: InsightType): string {
    const icons: Record<InsightType, string> = {
        positive: '✓',
        warning: '⚠',
        info: 'ℹ',
        recommendation: '💡',
    };
    return icons[type];
}
