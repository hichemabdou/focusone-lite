"use client";

import { useMemo } from "react";
import { useGoals } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";

type Props = {
    onAction: (type: 'blocked' | 'overdue' | 'balance' | 'strategic', payload?: any) => void;
};

export default function SmartSuggestions({ onAction }: Props) {
    const { goals } = useGoals();
    const { categories, getCategoryColor } = useCustomization();

    const suggestions = useMemo(() => {
        const list: Array<{
            id: string;
            type: 'urgent' | 'balance' | 'cleanup' | 'strategic';
            actionType: 'blocked' | 'overdue' | 'balance' | 'strategic';
            title: string;
            description: string;
            actionLabel: string;
            color: string;
            payload?: any;
        }> = [];

        const activeGoals = goals.filter(g => g.status !== 'completed' && g.status !== 'cancelled');
        const blockedGoals = activeGoals.filter(g => g.status === 'on-hold');
        const overdueGoals = activeGoals.filter(g => new Date(g.endDate) < new Date());

        // 1. Urgent: Blocked Items
        if (blockedGoals.length > 0) {
            list.push({
                id: 'blocked',
                type: 'urgent',
                actionType: 'blocked',
                title: `${blockedGoals.length} goals are blocked`,
                description: "Clear these blockers to maintain momentum.",
                actionLabel: "Review Blockers",
                color: "#ef4444"
            });
        }

        // 2. Cleanup: Overdue Items
        if (overdueGoals.length > 0) {
            list.push({
                id: 'overdue',
                type: 'cleanup',
                actionType: 'overdue',
                title: `${overdueGoals.length} overdue items`,
                description: "Reschedule or drop them to clean up your list.",
                actionLabel: "Reschedule",
                color: "#f97316"
            });
        }

        // 3. Balance: Neglected Categories
        const categoryCounts: Record<string, number> = {};
        activeGoals.forEach(g => { categoryCounts[g.category] = (categoryCounts[g.category] || 0) + 1; });

        const neglectedCategory = categories.find(c => !categoryCounts[c.id] || categoryCounts[c.id] === 0);
        if (neglectedCategory) {
            list.push({
                id: 'balance',
                type: 'balance',
                actionType: 'balance',
                title: `No focus on ${neglectedCategory.name}`,
                description: "Consider adding a small goal to maintain balance.",
                actionLabel: `Plan ${neglectedCategory.name} Goal`,
                color: getCategoryColor(neglectedCategory.id),
                payload: neglectedCategory.name
            });
        }

        // 4. Strategic: No High Priority Goals
        const highPriGoals = activeGoals.filter(g => g.priority === 'p1' || g.priority === 'p2');
        if (highPriGoals.length === 0 && activeGoals.length > 0) {
            list.push({
                id: 'strategic',
                type: 'strategic',
                actionType: 'strategic',
                title: "Missing Strategic Focus",
                description: "You have active goals but none are High Priority.",
                actionLabel: "Set Priorities",
                color: "#8b5cf6"
            });
        }

        return list.slice(0, 3); // Show max 3 suggestions
    }, [goals, categories, getCategoryColor]);

    if (suggestions.length === 0) {
        return (
            <div className="smart-suggestions smart-suggestions--empty">
                <div className="smart-suggestions__icon">✨</div>
                <div>
                    <h4 className="text-sm font-medium text-white">All systems go</h4>
                    <p className="text-xs text-muted">You are perfectly aligned. Keep it up!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="smart-suggestions flex flex-col gap-4">
            <div className="smart-suggestions__header flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-100">Smart Suggestions</h3>
                <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">AI Insights</span>
            </div>
            <div className="smart-suggestions__list flex flex-col gap-3">
                {suggestions.map(s => (
                    <div key={s.id} className="suggestion-card group relative overflow-hidden rounded-xl bg-white/5 border border-white/5 p-4 hover:bg-white/10 transition-all duration-300">
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: s.color }} />
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-slate-100 mb-1 leading-tight">{s.title}</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
                            </div>
                            <button
                                className="shrink-0 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                                onClick={() => onAction(s.actionType, s.payload)}
                            >
                                {s.actionLabel}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
