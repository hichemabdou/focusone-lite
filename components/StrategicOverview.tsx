"use client";

import { useMemo } from "react";
import { useGoals, Goal } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";

export default function StrategicOverview() {
    const { goals } = useGoals();
    const { getCategoryColor } = useCustomization();

    const milestones = useMemo(() => {
        const ms: Array<{
            id: string;
            label: string;
            date: Date;
            color: string;
            goalTitle: string;
            status: Goal["status"];
            type: "point" | "window";
            windowEnd?: Date;
        }> = [];

        goals.forEach((g) => {
            if (g.milestone) {
                const color = g.milestone.color || getCategoryColor(g.category);
                if (g.milestone.type === "point") {
                    ms.push({
                        id: g.milestone.id,
                        label: g.milestone.label,
                        date: new Date(g.milestone.date),
                        color,
                        goalTitle: g.title,
                        status: g.status,
                        type: "point",
                    });
                } else {
                    ms.push({
                        id: g.milestone.id,
                        label: g.milestone.label,
                        date: new Date(g.milestone.windowStart),
                        windowEnd: new Date(g.milestone.windowEnd),
                        color,
                        goalTitle: g.title,
                        status: g.status,
                        type: "window",
                    });
                }
            }
        });

        return ms.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [goals, getCategoryColor]);

    // Filter for next 6 months
    const relevantMilestones = useMemo(() => {
        const now = new Date();
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(now.getMonth() + 6);

        return milestones.filter(m => {
            const date = m.type === 'window' && m.windowEnd ? m.windowEnd : m.date;
            return date >= now && date <= sixMonthsFromNow;
        });
    }, [milestones]);

    if (relevantMilestones.length === 0) {
        return (
            <div className="strategic-overview strategic-overview--empty">
                <div className="strategic-overview__empty-content">
                    <p>No strategic milestones defined for the next 6 months.</p>
                    <span className="text-sm text-muted">Add milestones to your key goals to see your roadmap here.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="strategic-overview strategic-overview--compact">
            <div className="strategic-overview__header">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Strategic Horizon</h3>
                    <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">6 Months</span>
                </div>
            </div>
            <div className="strategic-overview__timeline">
                <div className="strategic-overview__line" />
                {relevantMilestones.map((ms, index) => (
                    <div key={ms.id} className="strategic-overview__item">
                        <div className="strategic-overview__marker">
                            <div
                                className="strategic-overview__dot"
                                style={{
                                    backgroundColor: ms.status === 'done' ? ms.color : 'var(--page-bg)',
                                    borderColor: ms.color,
                                    boxShadow: ms.status === 'done' ? `0 0 12px ${ms.color}40` : 'none'
                                }}
                            />
                        </div>
                        <div className="strategic-overview__content">
                            <div className="strategic-overview__date" style={{ color: ms.color }}>
                                {ms.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                            <h4 className="strategic-overview__title">{ms.label}</h4>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
