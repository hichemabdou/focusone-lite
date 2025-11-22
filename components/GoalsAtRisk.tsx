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
        <div className="goals-at-risk">
            <div className="goals-at-risk__header">
                <div className="goals-at-risk__title-group">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <h3>Needs Attention</h3>
                </div>
                <span className="badge badge--urgent">{atRiskGoals.length}</span>
            </div>

            <div className="goals-at-risk__list">
                {atRiskGoals.map(goal => {
                    const isOverdue = new Date(goal.endDate) < new Date();
                    const isBlocked = goal.status === 'on-hold';

                    return (
                        <div key={goal.id} className="risk-item">
                            <div className="risk-item__indicator" style={{ backgroundColor: getCategoryColor(goal.category) }} />
                            <div className="risk-item__content">
                                <h4 className="risk-item__title">{goal.title}</h4>
                                <p className="risk-item__reason">
                                    {isBlocked ? 'Blocked' : isOverdue ? `Overdue by ${Math.ceil((new Date().getTime() - new Date(goal.endDate).getTime()) / (1000 * 60 * 60 * 24))} days` : 'Stalled'}
                                </p>
                            </div>
                            <button
                                className="btn btn--xs btn--secondary"
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
