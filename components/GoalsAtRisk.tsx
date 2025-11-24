"use client";

import { useGoals, Goal } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";

type Props = {
    onEditGoal: (goal: Goal) => void;
};

export default function GoalsAtRisk({ onEditGoal }: Props) {
    const { goals } = useGoals();
    const { getCategoryColor } = useCustomization();

    const atRiskGoals = goals.filter(g => {
        if (g.status === 'completed' || g.status === 'cancelled') return false;

        // 1. On Hold
        if (g.status === 'on-hold') return true;

        // 2. Overdue
        if (new Date(g.endDate) < new Date()) return true;

        // 3. Stalled High Priority (Active for > 14 days)
        if ((g.priority === 'p1' || g.priority === 'p2') && g.status === 'active') {
            const start = new Date(g.startDate);
            const now = new Date();
            const diffDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 14) return true;
        }

        return false;
    }).slice(0, 5); // Limit to 5

    if (atRiskGoals.length === 0) {
        return (
            <div className="p-4 text-center text-muted text-sm">
                No immediate risks detected.
            </div>
        );
    }

    return (
        <div className="goals-at-risk flex flex-col h-full">
            <div className="goals-at-risk__header flex items-center justify-between mb-4">
                <div className="goals-at-risk__title-group flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200">Needs Attention</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/20">{atRiskGoals.length}</span>
            </div>

            <div className="goals-at-risk__list flex flex-col gap-2">
                {atRiskGoals.map(goal => {
                    const isOverdue = new Date(goal.endDate) < new Date();
                    const isBlocked = goal.status === 'on-hold';

                    return (
                        <div key={goal.id} className="risk-item group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-200">
                            <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(goal.category) }} />
                            <div className="risk-item__content flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-slate-200 truncate">{goal.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                        {isBlocked ? 'BLOCKED' : 'OVERDUE'}
                                    </span>
                                    {isOverdue && !isBlocked && (
                                        <span className="text-[10px] text-slate-500">
                                            {Math.ceil((new Date().getTime() - new Date(goal.endDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium text-slate-300 hover:bg-white/20 hover:text-white"
                                onClick={() => onEditGoal(goal)}
                            >
                                View
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
