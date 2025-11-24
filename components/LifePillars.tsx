"use client";

import { useGoals } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";

export default function LifePillars() {
    const { goals } = useGoals();
    const { categories, getCategoryColor } = useCustomization();

    const pillars = categories.map(cat => {
        const catGoals = goals.filter(g => g.category === cat.id);
        const total = catGoals.length;
        const completed = catGoals.filter(g => g.status === 'done').length;
        const active = total - completed;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Find next deadline
        const nextDeadline = catGoals
            .filter(g => g.status !== 'done')
            .map(g => new Date(g.endDate))
            .sort((a, b) => a.getTime() - b.getTime())[0];

        return {
            ...cat,
            total,
            active,
            progress,
            nextDeadline,
            color: getCategoryColor(cat.id)
        };
    });

    return (
        <div className="life-pillars flex flex-col gap-4">
            <div className="life-pillars__header flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-100">Life Pillars</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Balance across key areas</p>
                </div>
            </div>
            <div className="life-pillars__grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {pillars.map(pillar => (
                    <div
                        key={pillar.id}
                        className="pillar-card group relative overflow-hidden rounded-xl bg-white/5 border border-white/5 p-4 hover:bg-white/10 transition-all duration-300"
                    >
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: pillar.color }} />

                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm"
                                    style={{ backgroundColor: `${pillar.color}20`, color: pillar.color }}
                                >
                                    {pillar.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-200 leading-tight">{pillar.name}</h4>
                                    <span className="text-[11px] text-slate-400 font-medium">{pillar.active} active</span>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-slate-300">{pillar.progress}%</span>
                        </div>

                        <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                            <div
                                className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${pillar.progress}%`, backgroundColor: pillar.color }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                            {pillar.nextDeadline ? (
                                <span className="text-slate-400 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                    Next: <span className="text-slate-300 font-medium">{pillar.nextDeadline.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </span>
                            ) : (
                                <span className="text-slate-600 italic">No active goals</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
