"use client";

import { useMemo } from "react";
import { useGoals } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";
import { BarChart3, TrendingUp, Clock, Target } from "lucide-react";
import { parseISO, differenceInDays, format, subDays } from "date-fns";

export default function ProductivityInsights() {
    const { goals } = useGoals();
    const { categories } = useCustomization();

    const insights = useMemo(() => {
        const today = new Date();
        const last30Days = subDays(today, 30);

        // Calculate completion rate
        const completedGoals = goals.filter(g => g.status === "completed" || g.status === "done");
        const totalGoals = goals.length;
        const completionRate = totalGoals > 0 ? Math.round((completedGoals.length / totalGoals) * 100) : 0;

        // Calculate goals completed in last 30 days
        const recentlyCompleted = completedGoals.filter(g => {
            // Assuming we'd track completion date - for now use endDate as proxy
            const endDate = parseISO(g.endDate);
            return endDate >= last30Days;
        }).length;

        // Find most productive category
        const categoryCounts: Record<string, number> = {};
        completedGoals.forEach(g => {
            categoryCounts[g.category] = (categoryCounts[g.category] || 0) + 1;
        });

        const mostProductiveCategory = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])[0];

        // Calculate average goal duration
        const durations = completedGoals.map(g => {
            const start = parseISO(g.startDate);
            const end = parseISO(g.endDate);
            return differenceInDays(end, start);
        });
        const avgDuration = durations.length > 0
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : 0;

        // Active goals by priority
        const activeGoals = goals.filter(g => g.status !== "completed" && g.status !== "cancelled" && g.status !== "done");
        const highPriorityActive = activeGoals.filter(g => g.priority === "p1" || g.priority === "p2").length;

        return {
            completionRate,
            recentlyCompleted,
            mostProductiveCategory,
            avgDuration,
            highPriorityActive,
            totalActive: activeGoals.length,
        };
    }, [goals]);

    return (
        <div className="productivity-insights">
            <div className="productivity-insights__header">
                <h3 className="text-lg font-medium text-white">Productivity Insights</h3>
                <p className="text-sm text-muted mt-1">Your performance over the last 30 days</p>
            </div>

            <div className="productivity-metrics">
                {/* Completion Rate */}
                <div className="metric-card">
                    <div className="metric-card__icon" style={{ backgroundColor: "#3b82f620" }}>
                        <Target className="w-5 h-5" style={{ color: "#3b82f6" }} />
                    </div>
                    <div className="metric-card__content">
                        <div className="metric-card__value">{insights.completionRate}%</div>
                        <div className="metric-card__label">Completion Rate</div>
                    </div>
                </div>

                {/* Recent Completions */}
                <div className="metric-card">
                    <div className="metric-card__icon" style={{ backgroundColor: "#10b98120" }}>
                        <TrendingUp className="w-5 h-5" style={{ color: "#10b981" }} />
                    </div>
                    <div className="metric-card__content">
                        <div className="metric-card__value">{insights.recentlyCompleted}</div>
                        <div className="metric-card__label">Completed (30d)</div>
                    </div>
                </div>

                {/* Average Duration */}
                <div className="metric-card">
                    <div className="metric-card__icon" style={{ backgroundColor: "#f59e0b20" }}>
                        <Clock className="w-5 h-5" style={{ color: "#f59e0b" }} />
                    </div>
                    <div className="metric-card__content">
                        <div className="metric-card__value">{insights.avgDuration}d</div>
                        <div className="metric-card__label">Avg Duration</div>
                    </div>
                </div>

                {/* High Priority Focus */}
                <div className="metric-card">
                    <div className="metric-card__icon" style={{ backgroundColor: "#8b5cf620" }}>
                        <BarChart3 className="w-5 h-5" style={{ color: "#8b5cf6" }} />
                    </div>
                    <div className="metric-card__content">
                        <div className="metric-card__value">{insights.highPriorityActive}/{insights.totalActive}</div>
                        <div className="metric-card__label">High Priority</div>
                    </div>
                </div>
            </div>

            {insights.mostProductiveCategory && (
                <div className="productivity-highlight">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <p className="text-sm text-white">
                            Most productive in <span className="font-medium text-green-400">{insights.mostProductiveCategory[0]}</span> with {insights.mostProductiveCategory[1]} completed goals
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
