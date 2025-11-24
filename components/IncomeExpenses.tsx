"use client";

import { useState, useEffect } from "react";
import { calculateFinancialMetrics, calculateCategoryBreakdown } from "@/lib/finance/calculator";

type Transaction = {
    id: string;
    transaction_date: string;
    description: string;
    amount: number;
    category: string;
    transaction_type: string;
};

export default function IncomeExpenses() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch transactions
            const transactionsResponse = await fetch('/api/finance/transactions?limit=100');
            if (!transactionsResponse.ok) throw new Error('Failed to fetch transactions');
            const transactionsData = await transactionsResponse.json();
            setTransactions(transactionsData.transactions || []);

            // Fetch accounts for metrics calculation
            const accountsResponse = await fetch('/api/finance/accounts');
            if (!accountsResponse.ok) throw new Error('Failed to fetch accounts');
            const accountsData = await accountsResponse.json();
            setAccounts(accountsData.accounts || []);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });

    // Calculate metrics using the calculator
    const metrics = accounts.length > 0 && transactions.length > 0
        ? calculateFinancialMetrics(accounts, transactions)
        : {
            monthlyIncome: 0,
            monthlyExpenses: 0,
            monthlySavings: 0,
            savingsRate: 0,
            netWorth: 0,
            totalAssets: 0,
            totalLiabilities: 0,
            debtToIncomeRatio: 0,
            emergencyFundMonths: 0,
        };

    // Get category breakdown
    const categoryBreakdown = transactions.length > 0
        ? calculateCategoryBreakdown(transactions)
        : [];

    // Get recent transactions (last 10)
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
        .slice(0, 10);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    if (isLoading) {
        return (
            <div className="income-expenses">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading transactions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="income-expenses">
                <div className="error-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <h3>Failed to load data</h3>
                    <p>{error}</p>
                    <button className="btn btn--primary" onClick={fetchData}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="income-expenses">
            {/* Monthly Summary */}
            <div className="financial-summary">
                <div className="financial-card">
                    <div className="financial-card__label">Monthly Income</div>
                    <div className="financial-card__value financial-card__value--success">
                        {formatCurrency(metrics.monthlyIncome)}
                    </div>
                </div>

                <div className="financial-card">
                    <div className="financial-card__label">Monthly Expenses</div>
                    <div className="financial-card__value financial-card__value--danger">
                        {formatCurrency(metrics.monthlyExpenses)}
                    </div>
                </div>

                <div className="financial-card financial-card--primary">
                    <div className="financial-card__label">Monthly Savings</div>
                    <div className="financial-card__value">{formatCurrency(metrics.monthlySavings)}</div>
                    <div className="financial-card__change">
                        Savings Rate: {metrics.savingsRate.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Expense Breakdown */}
            <div className="expense-breakdown">
                <h3>Spending by Category ({currentMonth})</h3>
                <div className="category-list">
                    {categoryBreakdown.length > 0 ? (
                        categoryBreakdown.slice(0, 8).map((category) => (
                            <div key={category.category} className="category-item">
                                <div className="category-item__header">
                                    <span className="category-item__name">{category.category}</span>
                                    <span className="category-item__amount">{formatCurrency(category.amount)}</span>
                                </div>
                                <div className="category-item__bar">
                                    <div
                                        className="category-item__fill"
                                        style={{ width: `${category.percentage}%` }}
                                    />
                                </div>
                                <div className="category-item__details">
                                    <span>{category.transactionCount} transaction{category.transactionCount !== 1 ? 's' : ''}</span>
                                    <span>{category.percentage.toFixed(1)}%</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>No transactions to categorize yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="recent-transactions">
                <div className="recent-transactions__header">
                    <h3>Recent Transactions</h3>
                    <button className="btn btn--sm btn--ghost">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Transaction
                    </button>
                </div>
                <div className="transactions-list">
                    {recentTransactions.length > 0 ? (
                        recentTransactions.map((transaction) => (
                            <div key={transaction.id} className="transaction-item">
                                <div className="transaction-item__icon">
                                    {transaction.amount > 0 ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 19V5M5 12l7-7 7 7" />
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 5v14M19 12l-7 7-7-7" />
                                        </svg>
                                    )}
                                </div>
                                <div className="transaction-item__details">
                                    <div className="transaction-item__description">{transaction.description}</div>
                                    <div className="transaction-item__meta">
                                        <span>{formatDate(transaction.transaction_date)}</span>
                                        <span className="transaction-item__category">{transaction.category}</span>
                                    </div>
                                </div>
                                <div className={`transaction-item__amount ${transaction.amount > 0 ? 'transaction-item__amount--income' : 'transaction-item__amount--expense'}`}>
                                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>No transactions yet</p>
                            <button className="btn btn--sm btn--primary">Add Your First Transaction</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
