"use client";

import { useState, useEffect } from "react";

type Insight = {
    id: string;
    insight_type: 'positive' | 'warning' | 'info' | 'recommendation';
    title: string;
    message: string;
    action_label?: string;
    priority: number;
    is_dismissed: boolean;
};

export default function FinancialInsights() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/finance/insights');
            if (!response.ok) throw new Error('Failed to fetch insights');
            const data = await response.json();
            setInsights(data.insights || []);
        } catch (err) {
            console.error('Error fetching insights:', err);
            setError(err instanceof Error ? err.message : 'Failed to load insights');
        } finally {
            setIsLoading(false);
        }
    };

    const dismissInsight = async (id: string) => {
        try {
            const response = await fetch('/api/finance/insights', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_dismissed: true }),
            });

            if (response.ok) {
                setInsights(insights.filter(i => i.id !== id));
            }
        } catch (err) {
            console.error('Error dismissing insight:', err);
        }
    };

    const generateNewInsights = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/finance/insights/generate', {
                method: 'POST',
            });

            if (response.ok) {
                await fetchInsights();
            }
        } catch (err) {
            console.error('Error generating insights:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getInsightIcon = (type: string) => {
        switch (type) {
            case 'positive':
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                );
            case 'info':
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                );
            case 'recommendation':
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                );
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="financial-insights">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading insights...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="financial-insights">
                <div className="error-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <h3>Failed to load insights</h3>
                    <p>{error}</p>
                    <button className="btn btn--primary" onClick={fetchInsights}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="financial-insights">
            <div className="insights-header">
                <div>
                    <h2>Financial Insights</h2>
                    <p>Personalized recommendations based on your financial data</p>
                </div>
                <button className="btn btn--primary" onClick={generateNewInsights}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    Refresh Insights
                </button>
            </div>

            {insights.length > 0 ? (
                <div className="insights-list">
                    {insights.map((insight) => (
                        <div key={insight.id} className={`insight-card insight-card--${insight.insight_type}`}>
                            <div className="insight-card__icon">
                                {getInsightIcon(insight.insight_type)}
                            </div>
                            <div className="insight-card__content">
                                <h3 className="insight-card__title">{insight.title}</h3>
                                <p className="insight-card__message">{insight.message}</p>
                                {insight.action_label && (
                                    <button className="btn btn--sm btn--ghost insight-card__action">
                                        {insight.action_label}
                                    </button>
                                )}
                            </div>
                            <button
                                className="insight-card__dismiss"
                                onClick={() => dismissInsight(insight.id)}
                                title="Dismiss"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <h3>No insights yet</h3>
                    <p>Add some financial data to get personalized recommendations</p>
                    <button className="btn btn--primary" onClick={generateNewInsights}>
                        Generate Insights
                    </button>
                </div>
            )}
        </div>
    );
}
