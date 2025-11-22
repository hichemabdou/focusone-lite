"use client";

import { useState } from "react";
import NetWorthDashboard from "@/components/NetWorthDashboard";
import IncomeExpenses from "@/components/IncomeExpenses";
import FinancialInsights from "@/components/FinancialInsights";

export default function FinancesPage() {
    const [activeTab, setActiveTab] = useState<"overview" | "income" | "insights">("overview");

    return (
        <main className="workspace">
            <header className="control-bar">
                <div className="control-bar__left">
                    <h1 className="control-bar__title">Financial Management</h1>
                    <p className="control-bar__subtitle">Track your net worth, income, expenses, and financial health</p>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="finances-tabs">
                <button
                    className={`finances-tab ${activeTab === "overview" ? "finances-tab--active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                    <span>Net Worth</span>
                </button>
                <button
                    className={`finances-tab ${activeTab === "income" ? "finances-tab--active" : ""}`}
                    onClick={() => setActiveTab("income")}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <span>Income & Expenses</span>
                </button>
                <button
                    className={`finances-tab ${activeTab === "insights" ? "finances-tab--active" : ""}`}
                    onClick={() => setActiveTab("insights")}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
                    </svg>
                    <span>Insights</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="finances-content">
                {activeTab === "overview" && <NetWorthDashboard />}
                {activeTab === "income" && <IncomeExpenses />}
                {activeTab === "insights" && <FinancialInsights />}
            </div>
        </main>
    );
}
