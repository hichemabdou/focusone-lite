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
            <div className="strategic-overview w-full p-6 rounded-2xl bg-slate-900/50 border border-white/5 flex flex-col items-center justify-center text-center min-h-[160px]">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-500">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-slate-300">No strategic milestones defined</p>
                <span className="text-xs text-slate-500 mt-1 max-w-xs">Add milestones to your key goals to see your roadmap here.</span>
            </div>
        );
    }

    return (
        <div className="strategic-overview w-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Strategic Horizon</h3>
                    <span className="text-[10px] font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 uppercase tracking-wide">Next 6 Months</span>
                </div>
            </div>

            <div className="relative w-full overflow-x-auto pb-4 scrollbar-hide">
                {/* Timeline Line */}
                <div className="absolute top-[27px] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                <div className="flex gap-12 px-4 min-w-max">
                    {relevantMilestones.map((ms, index) => (
                        <div key={ms.id} className="group relative flex flex-col gap-3 min-w-[140px]">
                            {/* Marker */}
                            <div className="relative z-10 flex items-center">
                                <div
                                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${ms.status === 'done' ? 'bg-current scale-110' : 'bg-slate-900 scale-100 group-hover:scale-110'}`}
                                    style={{
                                        borderColor: ms.color,
                                        color: ms.color,
                                        boxShadow: ms.status === 'done' ? `0 0 12px ${ms.color}60` : `0 0 0 4px ${ms.color}15`
                                    }}
                                />
                                {/* Connector to next point (optional visual enhancement) */}
                                {index < relevantMilestones.length - 1 && (
                                    <div className="h-[2px] flex-1 bg-white/5 ml-2" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex flex-col gap-1">
                                <span
                                    className="text-[11px] font-bold uppercase tracking-wider"
                                    style={{ color: ms.color }}
                                >
                                    {ms.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                                <h4 className="text-sm font-medium text-slate-200 leading-snug group-hover:text-white transition-colors">
                                    {ms.label}
                                </h4>
                                <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                    {ms.goalTitle}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
