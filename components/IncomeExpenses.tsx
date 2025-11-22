"use client";

import { useState } from "react";

type Transaction = {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    type: "income" | "expense";
};

export default function IncomeExpenses() {
    const [transactions] = useState<Transaction[]>([
        { id: "1", date: "2024-11-20", description: "Salary", amount: 5000, category: "Salary", type: "income" },
        { id: "2", date: "2024-11-18", description: "Freelance Project", amount: 1500, category: "Freelance", type: "income" },
        { id: "3", date: "2024-11-15", description: "Rent", amount: 1800, category: "Housing", type: "expense" },
        { id: "4", date: "2024-11-12", description: "Groceries", amount: 450, category: "Food", type: "expense" },
        { id: "5", date: "2024-11-10", description: "Electric Bill", amount: 120, category: "Utilities", type: "expense" },
        { id: "6", date: "2024-11-08", description: "Restaurant", amount: 85, category: "Dining", type: "expense" },
        { id: "7", date: "2024-11-05", description: "Gas", amount: 60, category: "Transportation", type: "expense" },
    ]);

    const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });

    const monthlyIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    // Group expenses by category
    const expensesByCategory = transactions
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="income-expenses">
            {/* Monthly Summary */}
            <div className="financial-summary">
                <div className="financial-card">
                    <div className="financial-card__label">Monthly Income</div>
                    <div className="financial-card__value financial-card__value--success">
                        {formatCurrency(monthlyIncome)}
                    </div>
                </div>

                <div className="financial-card">
                    <div className="financial-card__label">Monthly Expenses</div>
                    <div className="financial-card__value financial-card__value--danger">
                        {formatCurrency(monthlyExpenses)}
                    </div>
                </div>

                <div className="financial-card financial-card--primary">
                    <div className="financial-card__label">Monthly Savings</div>
                    <div className="financial-card__value">{formatCurrency(monthlySavings)}</div>
                    <div className="financial-card__change">
                        Savings Rate: {savingsRate.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Expense Breakdown */}
            <div className="expense-breakdown">
                <div className="expense-breakdown__header">
                    <h3>Expenses by Category</h3>
                    <span className="text-muted">{currentMonth}</span>
                </div>
                <div className="expense-categories">
                    {Object.entries(expensesByCategory)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, amount]) => (
                            <div key={category} className="expense-category">
                                <div className="expense-category__header">
                                    <span className="expense-category__name">{category}</span>
                                    <span className="expense-category__amount">{formatCurrency(amount)}</span>
                                </div>
                                <div className="expense-category__bar">
                                    <div
                                        className="expense-category__fill"
                                        style={{ width: `${(amount / monthlyExpenses) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="expense-category__percentage">
                                    {((amount / monthlyExpenses) * 100).toFixed(1)}% of expenses
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="financial-table-container">
                <div className="financial-table-header">
                    <h3>Recent Transactions</h3>
                    <button className="btn btn--sm btn--ghost">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Transaction
                    </button>
                </div>
                <div className="financial-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th className="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((transaction) => (
                                <tr key={transaction.id}>
                                    <td className="text-muted">
                                        {new Date(transaction.date).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </td>
                                    <td>{transaction.description}</td>
                                    <td>
                                        <span className={`transaction-category transaction-category--${transaction.type}`}>
                                            {transaction.category}
                                        </span>
                                    </td>
                                    <td
                                        className={`text-right font-mono ${transaction.type === "income" ? "text-success" : "text-danger"
                                            }`}
                                    >
                                        {transaction.type === "income" ? "+" : "-"}
                                        {formatCurrency(Math.abs(transaction.amount))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
