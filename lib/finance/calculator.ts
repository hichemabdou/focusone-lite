// Financial Calculations and Metrics

import {
    FinancialAccount,
    Transaction,
    NetWorthSnapshot,
    FinancialMetrics,
    CategoryBreakdown,
    TrendData,
} from './types';
import { isSameMonth, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Calculate net worth from accounts
 */
export function calculateNetWorth(accounts: FinancialAccount[]) {
    const totalAssets = accounts
        .filter(a => a.is_asset)
        .reduce((sum, a) => sum + a.current_balance, 0);

    const totalLiabilities = accounts
        .filter(a => !a.is_asset)
        .reduce((sum, a) => sum + Math.abs(a.current_balance), 0);

    const netWorth = totalAssets - totalLiabilities;

    // Calculate asset breakdown by type
    const assetBreakdown = accounts
        .filter(a => a.is_asset)
        .reduce((acc, a) => {
            acc[a.account_type] = (acc[a.account_type] || 0) + a.current_balance;
            return acc;
        }, {} as Record<string, number>);

    // Calculate liability breakdown by type
    const liabilityBreakdown = accounts
        .filter(a => !a.is_asset)
        .reduce((acc, a) => {
            acc[a.account_type] = (acc[a.account_type] || 0) + Math.abs(a.current_balance);
            return acc;
        }, {} as Record<string, number>);

    return {
        totalAssets,
        totalLiabilities,
        netWorth,
        assetBreakdown,
        liabilityBreakdown,
    };
}

/**
 * Calculate monthly income from transactions
 */
export function calculateMonthlyIncome(transactions: Transaction[], month: Date = new Date()): number {
    return transactions
        .filter(t => {
            const transactionDate = new Date(t.transaction_date);
            return isSameMonth(transactionDate, month) &&
                (t.amount > 0 && t.transaction_type === 'income');
        })
        .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate monthly expenses from transactions
 */
export function calculateMonthlyExpenses(transactions: Transaction[], month: Date = new Date()): number {
    return transactions
        .filter(t => {
            const transactionDate = new Date(t.transaction_date);
            return isSameMonth(transactionDate, month) &&
                (t.amount < 0 || t.transaction_type === 'expense');
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/**
 * Calculate savings rate
 */
export function calculateSavingsRate(income: number, expenses: number): number {
    if (income <= 0) return 0;
    const savings = income - expenses;
    return (savings / income) * 100;
}

/**
 * Calculate debt-to-income ratio
 */
export function calculateDebtRatio(monthlyDebtPayments: number, monthlyIncome: number): number {
    if (monthlyIncome <= 0) return 0;
    return (monthlyDebtPayments / monthlyIncome) * 100;
}

/**
 * Calculate category breakdown from transactions
 */
export function calculateCategoryBreakdown(
    transactions: Transaction[],
    month?: Date
): CategoryBreakdown[] {
    const filteredTransactions = month
        ? transactions.filter(t => isSameMonth(new Date(t.transaction_date), month))
        : transactions;

    const breakdown = filteredTransactions.reduce((acc, t) => {
        const category = t.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = { amount: 0, count: 0 };
        }
        acc[category].amount += Math.abs(t.amount);
        acc[category].count += 1;
        return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    const total = Object.values(breakdown).reduce((sum, val) => sum + val.amount, 0);

    return Object.entries(breakdown)
        .map(([category, data]) => ({
            category,
            amount: data.amount,
            percentage: total > 0 ? (data.amount / total) * 100 : 0,
            transactionCount: data.count,
        }))
        .sort((a, b) => b.amount - a.amount);
}

/**
 * Detect trends from net worth snapshots
 */
export function detectTrends(snapshots: NetWorthSnapshot[]): TrendData | null {
    if (snapshots.length < 2) return null;

    const sorted = [...snapshots].sort((a, b) =>
        new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
    );

    const latest = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];

    const change = latest.net_worth - previous.net_worth;
    const percentChange = previous.net_worth !== 0
        ? (change / Math.abs(previous.net_worth)) * 100
        : 0;

    const period = differenceInDays(
        new Date(latest.snapshot_date),
        new Date(previous.snapshot_date)
    );

    let direction: 'up' | 'down' | 'stable';
    if (Math.abs(percentChange) < 0.5) {
        direction = 'stable';
    } else {
        direction = change > 0 ? 'up' : 'down';
    }

    return {
        direction,
        amount: Math.abs(change),
        percentage: Math.abs(percentChange),
        period,
    };
}

/**
 * Calculate emergency fund coverage in months
 */
export function calculateEmergencyFundCoverage(
    liquidAssets: number,
    monthlyExpenses: number
): number {
    if (monthlyExpenses <= 0) return 0;
    return liquidAssets / monthlyExpenses;
}

/**
 * Calculate comprehensive financial metrics
 */
export function calculateFinancialMetrics(
    accounts: FinancialAccount[],
    transactions: Transaction[],
    currentMonth: Date = new Date()
): FinancialMetrics {
    const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth(accounts);
    const monthlyIncome = calculateMonthlyIncome(transactions, currentMonth);
    const monthlyExpenses = calculateMonthlyExpenses(transactions, currentMonth);
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = calculateSavingsRate(monthlyIncome, monthlyExpenses);

    // Calculate monthly debt payments (loan and credit card payments)
    const monthlyDebtPayments = transactions
        .filter(t => {
            const transactionDate = new Date(t.transaction_date);
            return isSameMonth(transactionDate, currentMonth) &&
                (t.category === 'Loan Payment' || t.category === 'Credit Card Payment');
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const debtToIncomeRatio = calculateDebtRatio(monthlyDebtPayments, monthlyIncome);

    // Calculate liquid assets (checking + savings)
    const liquidAssets = accounts
        .filter(a => a.is_asset && (a.account_type === 'checking' || a.account_type === 'savings'))
        .reduce((sum, a) => sum + a.current_balance, 0);

    const emergencyFundMonths = calculateEmergencyFundCoverage(liquidAssets, monthlyExpenses);

    return {
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        savingsRate,
        netWorth,
        totalAssets,
        totalLiabilities,
        debtToIncomeRatio,
        emergencyFundMonths,
    };
}

/**
 * Calculate month-over-month change for a category
 */
export function calculateCategoryMoMChange(
    transactions: Transaction[],
    category: string,
    currentMonth: Date = new Date()
): { amount: number; percentage: number } {
    const currentMonthStart = startOfMonth(currentMonth);
    const currentMonthEnd = endOfMonth(currentMonth);

    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const previousMonthStart = startOfMonth(previousMonth);
    const previousMonthEnd = endOfMonth(previousMonth);

    const currentAmount = transactions
        .filter(t => {
            const date = new Date(t.transaction_date);
            return date >= currentMonthStart &&
                date <= currentMonthEnd &&
                t.category === category;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const previousAmount = transactions
        .filter(t => {
            const date = new Date(t.transaction_date);
            return date >= previousMonthStart &&
                date <= previousMonthEnd &&
                t.category === category;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const change = currentAmount - previousAmount;
    const percentChange = previousAmount > 0 ? (change / previousAmount) * 100 : 0;

    return {
        amount: change,
        percentage: percentChange,
    };
}

/**
 * Get spending trend for a category over time
 */
export function getCategoryTrend(
    transactions: Transaction[],
    category: string,
    months: number = 6
): Array<{ month: string; amount: number }> {
    const result: Array<{ month: string; amount: number }> = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const targetMonth = new Date(now);
        targetMonth.setMonth(targetMonth.getMonth() - i);

        const monthStart = startOfMonth(targetMonth);
        const monthEnd = endOfMonth(targetMonth);

        const amount = transactions
            .filter(t => {
                const date = new Date(t.transaction_date);
                return date >= monthStart &&
                    date <= monthEnd &&
                    t.category === category;
            })
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        result.push({
            month: targetMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            amount,
        });
    }

    return result;
}
