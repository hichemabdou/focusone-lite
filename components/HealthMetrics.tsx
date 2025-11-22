"use client";

import { useState } from "react";

type HealthMetric = {
    id: string;
    name: string;
    value: number;
    unit: string;
    date: string;
    trend: "up" | "down" | "stable";
    status: "good" | "warning" | "critical";
};

export default function HealthMetrics() {
    const [metrics] = useState<HealthMetric[]>([
        { id: "1", name: "Weight", value: 165, unit: "lbs", date: "2024-11-22", trend: "down", status: "good" },
        { id: "2", name: "Body Fat %", value: 18.5, unit: "%", date: "2024-11-22", trend: "down", status: "good" },
        { id: "3", name: "Resting Heart Rate", value: 62, unit: "bpm", date: "2024-11-22", trend: "stable", status: "good" },
        { id: "4", name: "Blood Pressure", value: 118, unit: "mmHg", date: "2024-11-20", trend: "stable", status: "good" },
        { id: "5", name: "Sleep", value: 7.5, unit: "hours", date: "2024-11-22", trend: "up", status: "good" },
        { id: "6", name: "Steps", value: 9500, unit: "steps", date: "2024-11-22", trend: "up", status: "good" },
    ]);

    const weeklyWorkouts = 5;
    const weeklyGoal = 5;
    const waterIntake = 8;
    const waterGoal = 8;

    const getTrendIcon = (trend: string) => {
        if (trend === "up") {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="18 15 12 9 6 15" />
                </svg>
            );
        }
        if (trend === "down") {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            );
        }
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
        );
    };

    return (
        <div className="health-metrics">
            {/* Overview Cards */}
            <div className="health-summary">
                <div className="health-card health-card--primary">
                    <div className="health-card__icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>
                    <div className="health-card__content">
                        <div className="health-card__label">Wellness Score</div>
                        <div className="health-card__value">8.7/10</div>
                        <div className="health-card__status">Excellent Health</div>
                    </div>
                </div>

                <div className="health-card">
                    <div className="health-card__icon health-card__icon--success">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </div>
                    <div className="health-card__content">
                        <div className="health-card__label">Weekly Workouts</div>
                        <div className="health-card__value">{weeklyWorkouts}/{weeklyGoal}</div>
                        <div className="health-card__progress">
                            <div className="health-card__progress-bar">
                                <div
                                    className="health-card__progress-fill"
                                    style={{ width: `${(weeklyWorkouts / weeklyGoal) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="health-card">
                    <div className="health-card__icon health-card__icon--info">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div className="health-card__content">
                        <div className="health-card__label">Water Intake Today</div>
                        <div className="health-card__value">{waterIntake} glasses</div>
                        <div className="health-card__status">
                            {waterIntake >= waterGoal ? "Goal achieved! 🎉" : `${waterGoal - waterIntake} more to go`}
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid">
                {metrics.map((metric) => (
                    <div key={metric.id} className={`metric-card metric-card--${metric.status}`}>
                        <div className="metric-card__header">
                            <span className="metric-card__name">{metric.name}</span>
                            <span className={`metric-card__trend metric-card__trend--${metric.trend}`}>
                                {getTrendIcon(metric.trend)}
                            </span>
                        </div>
                        <div className="metric-card__value">
                            {metric.value.toLocaleString()}
                            <span className="metric-card__unit">{metric.unit}</span>
                        </div>
                        <div className="metric-card__date">
                            Last updated: {new Date(metric.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Activity Log */}
            <div className="activity-log">
                <div className="activity-log__header">
                    <h3>Recent Activity</h3>
                    <button className="btn btn--sm btn--ghost">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Log Activity
                    </button>
                </div>
                <div className="activity-list">
                    <div className="activity-item">
                        <div className="activity-item__icon activity-item__icon--workout">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6.5 6.5L18 18M18 6.5L6.5 18" />
                            </svg>
                        </div>
                        <div className="activity-item__content">
                            <div className="activity-item__title">Morning Run</div>
                            <div className="activity-item__meta">5.2 miles • 42 min • 320 cal</div>
                        </div>
                        <div className="activity-item__time">Today, 7:00 AM</div>
                    </div>
                    <div className="activity-item">
                        <div className="activity-item__icon activity-item__icon--meal">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                            </svg>
                        </div>
                        <div className="activity-item__content">
                            <div className="activity-item__title">Breakfast Logged</div>
                            <div className="activity-item__meta">Oatmeal, Banana, Coffee • 450 cal</div>
                        </div>
                        <div className="activity-item__time">Today, 8:30 AM</div>
                    </div>
                    <div className="activity-item">
                        <div className="activity-item__icon activity-item__icon--sleep">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        </div>
                        <div className="activity-item__content">
                            <div className="activity-item__title">Sleep Logged</div>
                            <div className="activity-item__meta">7.5 hours • Quality: 85%</div>
                        </div>
                        <div className="activity-item__time">Yesterday, 11:00 PM</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
