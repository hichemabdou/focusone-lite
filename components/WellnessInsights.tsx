"use client";

export default function WellnessInsights() {
    const insights = [
        {
            id: "1",
            type: "positive",
            title: "Great sleep consistency!",
            message: "You've maintained 7+ hours of sleep for 14 consecutive days. Keep it up!",
            action: "View sleep data",
        },
        {
            id: "2",
            type: "warning",
            title: "Hydration below target",
            message: "You've averaged only 6 glasses of water daily this week. Aim for 8 glasses.",
            action: "Set reminder",
        },
        {
            id: "3",
            type: "info",
            title: "Heart rate variability improving",
            message: "Your HRV has increased by 12% over the past month, indicating better recovery.",
            action: "Learn more",
        },
    ];

    const healthGoals = [
        {
            id: "1",
            name: "Lose 10 pounds",
            current: 165,
            target: 155,
            unit: "lbs",
            progress: 80,
            deadline: "2024-12-31",
        },
        {
            id: "2",
            name: "Run 5K under 25 min",
            current: 26.5,
            target: 25,
            unit: "min",
            progress: 60,
            deadline: "2025-01-15",
        },
        {
            id: "3",
            name: "Meditate daily",
            current: 24,
            target: 30,
            unit: "days",
            progress: 80,
            deadline: "2024-12-22",
        },
    ];

    return (
        <div className="wellness-insights">
            {/* Wellness Score */}
            <div className="wellness-score-card">
                <div className="wellness-score-header">
                    <h3>Overall Wellness Score</h3>
                    <p className="text-muted">Based on your activity, sleep, nutrition, and metrics</p>
                </div>
                <div className="wellness-score-meter">
                    <div className="wellness-score-value">
                        <span className="wellness-score-number">87</span>
                        <span className="wellness-score-max">/100</span>
                    </div>
                    <div className="wellness-score-bar">
                        <div className="wellness-score-fill" style={{ width: "87%" }}></div>
                    </div>
                    <div className="wellness-score-label">Excellent</div>
                </div>

                <div className="wellness-categories">
                    <div className="wellness-category">
                        <div className="wellness-category__header">
                            <span>Physical Activity</span>
                            <span className="wellness-category__score">92</span>
                        </div>
                        <div className="wellness-category__bar">
                            <div
                                className="wellness-category__fill"
                                style={{ width: "92%", backgroundColor: "#10b981" }}
                            ></div>
                        </div>
                    </div>
                    <div className="wellness-category">
                        <div className="wellness-category__header">
                            <span>Sleep Quality</span>
                            <span className="wellness-category__score">88</span>
                        </div>
                        <div className="wellness-category__bar">
                            <div
                                className="wellness-category__fill"
                                style={{ width: "88%", backgroundColor: "#3b82f6" }}
                            ></div>
                        </div>
                    </div>
                    <div className="wellness-category">
                        <div className="wellness-category__header">
                            <span>Nutrition</span>
                            <span className="wellness-category__score">78</span>
                        </div>
                        <div className="wellness-category__bar">
                            <div
                                className="wellness-category__fill"
                                style={{ width: "78%", backgroundColor: "#f59e0b" }}
                            ></div>
                        </div>
                    </div>
                    <div className="wellness-category">
                        <div className="wellness-category__header">
                            <span>Mental Health</span>
                            <span className="wellness-category__score">90</span>
                        </div>
                        <div className="wellness-category__bar">
                            <div
                                className="wellness-category__fill"
                                style={{ width: "90%", backgroundColor: "#8b5cf6" }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI-Powered Insights */}
            <div className="wellness-insights-list">
                <div className="wellness-insights-header">
                    <h3>Personalized Insights</h3>
                    <p className="text-muted">AI-powered recommendations for your wellness goals</p>
                </div>
                <div className="wellness-insights-grid">
                    {insights.map((insight) => (
                        <div key={insight.id} className={`wellness-insight-card wellness-insight-card--${insight.type}`}>
                            <div className="wellness-insight-icon">
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
                            <div className="wellness-insight-content">
                                <h4 className="wellness-insight-title">{insight.title}</h4>
                                <p className="wellness-insight-message">{insight.message}</p>
                            </div>
                            <button className="wellness-insight-action">{insight.action}</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Health Goals */}
            <div className="health-goals-section">
                <div className="health-goals-header">
                    <h3>Health Goals</h3>
                    <button className="btn btn--sm btn--ghost">View all goals</button>
                </div>
                <div className="health-goals-list">
                    {healthGoals.map((goal) => (
                        <div key={goal.id} className="health-goal">
                            <div className="health-goal__info">
                                <span className="health-goal__name">{goal.name}</span>
                                <span className="health-goal__progress">
                                    {goal.current} / {goal.target} {goal.unit}
                                </span>
                            </div>
                            <div className="health-goal__bar">
                                <div className="health-goal__fill" style={{ width: `${goal.progress}%` }}></div>
                            </div>
                            <div className="health-goal__status">
                                {goal.progress}% complete • Due{" "}
                                {new Date(goal.deadline).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
