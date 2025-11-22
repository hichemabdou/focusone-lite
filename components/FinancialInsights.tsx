"use client";

export default function FinancialInsights() {
    const insights = [
        {
            id: "1",
            type: "positive",
            title: "Great savings rate!",
            message: "You're saving 38% of your income this month, which is above the recommended 20%.",
            action: "Keep it up",
        },
        {
            id: "2",
            type: "warning",
            title: "Dining expenses increasing",
            message: "Your restaurant spending is up 25% from last month. Consider meal prepping to save more.",
            action: "Create budget",
        },
        {
            id: "3",
            type: "info",
            title: "Investment opportunity",
            message: "You have $5,000 in your savings account. Consider investing to maximize returns.",
            action: "Learn more",
        },
        {
            id: "4",
            type: "positive",
            title: "Debt reduction on track",
            message: "You're ahead of schedule on your car loan. You'll save $450 in interest.",
            action: "View details",
        },
    ];

    const financialHealth = 8.5;
    const healthCategories = [
        { name: "Savings Rate", score: 9.2, color: "#10b981" },
        { name: "Debt Management", score: 8.5, color: "#3b82f6" },
        { name: "Budget Adherence", score: 7.8, color: "#f59e0b" },
        { name: "Emergency Fund", score: 8.9, color: "#10b981" },
    ];

    return (
        <div className="financial-insights">
            {/* Financial Health Score */}
            <div className="health-score-card">
                <div className="health-score-header">
                    <h3>Financial Health Score</h3>
                    <p className="text-muted">Based on your spending and savings habits</p>
                </div>
                <div className="health-score-meter">
                    <div className="health-score-value">
                        <span className="health-score-number">{financialHealth}</span>
                        <span className="health-score-max">/10</span>
                    </div>
                    <div className="health-score-bar">
                        <div
                            className="health-score-fill"
                            style={{ width: `${(financialHealth / 10) * 100}%` }}
                        ></div>
                    </div>
                    <div className="health-score-label">Excellent</div>
                </div>

                <div className="health-categories">
                    {healthCategories.map((category) => (
                        <div key={category.name} className="health-category">
                            <div className="health-category__header">
                                <span>{category.name}</span>
                                <span className="health-category__score">{category.score}</span>
                            </div>
                            <div className="health-category__bar">
                                <div
                                    className="health-category__fill"
                                    style={{
                                        width: `${(category.score / 10) * 100}%`,
                                        backgroundColor: category.color,
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI-Powered Insights */}
            <div className="insights-list">
                <div className="insights-header">
                    <h3>Personalized Insights</h3>
                    <p className="text-muted">AI-powered recommendations for your financial goals</p>
                </div>
                <div className="insights-grid">
                    {insights.map((insight) => (
                        <div key={insight.id} className={`insight-card insight-card--${insight.type}`}>
                            <div className="insight-icon">
                                {insight.type === "positive" && (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                )}
                                {insight.type === "warning" && (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                )}
                                {insight.type === "info" && (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                )}
                            </div>
                            <div className="insight-content">
                                <h4 className="insight-title">{insight.title}</h4>
                                <p className="insight-message">{insight.message}</p>
                            </div>
                            <button className="insight-action">{insight.action}</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Goal Progress */}
            <div className="financial-goals-preview">
                <div className="financial-goals-header">
                    <h3>Financial Goals</h3>
                    <button className="btn btn--sm btn--ghost">View all goals</button>
                </div>
                <div className="financial-goals-list">
                    <div className="financial-goal">
                        <div className="financial-goal__info">
                            <span className="financial-goal__name">Emergency Fund</span>
                            <span className="financial-goal__progress">$12,000 / $15,000</span>
                        </div>
                        <div className="financial-goal__bar">
                            <div className="financial-goal__fill" style={{ width: "80%" }}></div>
                        </div>
                        <div className="financial-goal__status">80% complete - On track</div>
                    </div>
                    <div className="financial-goal">
                        <div className="financial-goal__info">
                            <span className="financial-goal__name">House Down Payment</span>
                            <span className="financial-goal__progress">$35,000 / $60,000</span>
                        </div>
                        <div className="financial-goal__bar">
                            <div className="financial-goal__fill" style={{ width: "58%" }}></div>
                        </div>
                        <div className="financial-goal__status">58% complete - 14 months remaining</div>
                    </div>
                    <div className="financial-goal">
                        <div className="financial-goal__info">
                            <span className="financial-goal__name">Retirement Savings</span>
                            <span className="financial-goal__progress">$125,000 / $1,000,000</span>
                        </div>
                        <div className="financial-goal__bar">
                            <div className="financial-goal__fill" style={{ width: "12.5%" }}></div>
                        </div>
                        <div className="financial-goal__status">12.5% complete - Long-term goal</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
