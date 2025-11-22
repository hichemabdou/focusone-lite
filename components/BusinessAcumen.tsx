"use client";

import { useState } from "react";

type BusinessMetric = {
    id: string;
    name: string;
    score: number; // 1-10
    category: string;
};

export default function BusinessAcumen() {
    const [metrics] = useState<BusinessMetric[]>([
        { id: "1", name: "Financial Literacy", score: 8, category: "Finance" },
        { id: "2", name: "Market Analysis", score: 7, category: "Strategy" },
        { id: "3", name: "Negotiation Skills", score: 8, category: "Communication" },
        { id: "4", name: "Strategic Planning", score: 7, category: "Strategy" },
        { id: "5", name: "Risk Management", score: 6, category: "Finance" },
        { id: "6", name: "Business Development", score: 7, category: "Growth" },
        { id: "7", name: "Data-Driven Decision Making", score: 9, category: "Analytics" },
        { id: "8", name: "Innovation & Creativity", score: 8, category: "Growth" },
    ]);

    const overallScore = Math.round(
        metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length
    );

    const categories = Array.from(new Set(metrics.map((m) => m.category)));

    return (
        <div className="business-acumen">
            {/* Overview Card */}
            <div className="business-overview-card">
                <div className="business-overview-header">
                    <h3>Business Acumen Score</h3>
                    <p>Professional business competency assessment</p>
                </div>
                <div className="business-score-display">
                    <div className="business-score-main">
                        <span className="business-score-number">{overallScore}</span>
                        <span className="business-score-max">/10</span>
                    </div>
                    <div className="business-score-bar">
                        <div
                            className="business-score-fill"
                            style={{ width: `${(overallScore / 10) * 100}%` }}
                        ></div>
                    </div>
                    <div className="business-score-status">Strong Business Leader</div>
                </div>
            </div>

            {/* Metrics by Category */}
            <div className="business-categories">
                <h3>Business Competencies</h3>
                <div className="business-category-grid">
                    {categories.map((category) => {
                        const categoryMetrics = metrics.filter((m) => m.category === category);
                        const avgScore =
                            categoryMetrics.reduce((sum, m) => sum + m.score, 0) /
                            categoryMetrics.length;

                        return (
                            <div key={category} className="business-category-card">
                                <div className="business-category-header">
                                    <h4>{category}</h4>
                                    <span className="business-category-score">
                                        {avgScore.toFixed(1)}/10
                                    </span>
                                </div>
                                <div className="business-metric-list">
                                    {categoryMetrics.map((metric) => (
                                        <div key={metric.id} className="business-metric">
                                            <span className="business-metric-name">{metric.name}</span>
                                            <div className="business-metric-bar">
                                                <div
                                                    className="business-metric-fill"
                                                    style={{ width: `${(metric.score / 10) * 100}%` }}
                                                ></div>
                                                <span className="business-metric-value">{metric.score}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Learning Recommendations */}
            <div className="business-recommendations">
                <h3>Recommended Development Areas</h3>
                <div className="business-rec-grid">
                    <div className="business-rec-card">
                        <div className="business-rec-icon">📈</div>
                        <div className="business-rec-content">
                            <div className="business-rec-title">Risk Management</div>
                            <div className="business-rec-description">
                                Score 6/10 - Consider advanced courses in enterprise risk assessment
                            </div>
                            <div className="business-rec-actions">
                                <button className="btn btn--sm btn--primary">Enroll in Course</button>
                                <button className="btn btn--sm btn--ghost">View Resources</button>
                            </div>
                        </div>
                    </div>

                    <div className="business-rec-card">
                        <div className="business-rec-icon">💡</div>
                        <div className="business-rec-content">
                            <div className="business-rec-title">Strategic Planning</div>
                            <div className="business-rec-description">
                                Score 7/10 - Strengthen with executive leadership training
                            </div>
                            <div className="business-rec-actions">
                                <button className="btn btn--sm btn--ghost">Explore Programs</button>
                            </div>
                        </div>
                    </div>

                    <div className="business-rec-card business-rec-card--success">
                        <div className="business-rec-icon">⭐</div>
                        <div className="business-rec-content">
                            <div className="business-rec-title">Data-Driven Decision Making</div>
                            <div className="business-rec-description">
                                Score 9/10 - Exceptional strength. Consider mentoring others
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Industry Insights */}
            <div className="industry-insights">
                <h3>Industry Benchmarks</h3>
                <div className="benchmark-comparison">
                    <div className="benchmark-item">
                        <div className="benchmark-label">Your Score</div>
                        <div className="benchmark-bar">
                            <div className="benchmark-fill benchmark-fill--yours" style={{ width: "75%" }}></div>
                        </div>
                        <div className="benchmark-value">7.5/10</div>
                    </div>
                    <div className="benchmark-item">
                        <div className="benchmark-label">Industry Average</div>
                        <div className="benchmark-bar">
                            <div className="benchmark-fill benchmark-fill--industry" style={{ width: "60%" }}></div>
                        </div>
                        <div className="benchmark-value">6.0/10</div>
                    </div>
                    <div className="benchmark-item">
                        <div className="benchmark-label">Top 10% Performers</div>
                        <div className="benchmark-bar">
                            <div className="benchmark-fill benchmark-fill--top" style={{ width: "85%" }}></div>
                        </div>
                        <div className="benchmark-value">8.5/10</div>
                    </div>
                </div>
                <div className="benchmark-insight">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    <p>
                        You're performing <strong>25% above industry average</strong> and within reach of top 10%
                        performers. Focus on Risk Management to close the gap.
                    </p>
                </div>
            </div>
        </div>
    );
}
