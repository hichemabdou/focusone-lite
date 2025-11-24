"use client";

import { useMemo } from "react";
import { useGoals } from "./GoalsContext";

export default function FocusScore({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
    const { goals } = useGoals();

    const scoreData = useMemo(() => {
        const activeGoals = goals.filter(g => g.status !== 'completed' && g.status !== 'cancelled');
        if (activeGoals.length === 0) return {
            score: 100,
            grade: 'A+',
            message: "Ready to start",
            inProgressCount: 0,
            blockedCount: 0,
            overdueCount: 0
        };

        // 1. Priority Alignment (Do you have too many low priority things?)
        const highPriCount = activeGoals.filter(g => g.priority === 'p1' || g.priority === 'p2').length;
        const lowPriCount = activeGoals.filter(g => g.priority === 'p3' || g.priority === 'p4').length;
        const priorityRatio = highPriCount / (highPriCount + lowPriCount || 1);

        // 2. Overload Factor (Are you doing too much at once?)
        const inProgressCount = activeGoals.filter(g => g.status === 'active').length;
        const overloadPenalty = Math.max(0, (inProgressCount - 5) * 5); // Penalty for > 5 active items

        // 3. Stagnation (Are things blocked or overdue?)
        const now = new Date();
        const blockedCount = activeGoals.filter(g => g.status === 'on-hold').length;
        const overdueCount = activeGoals.filter(g => new Date(g.endDate) < now).length;
        const stagnationPenalty = (blockedCount * 10) + (overdueCount * 5);

        // Calculate Base Score (0-100)
        // Start at 100
        // - Stagnation
        // - Overload
        // + Priority Bonus (small)
        let rawScore = 100 - stagnationPenalty - overloadPenalty;

        // Adjust for priority mix (if you only have low priority stuff, max score is lower)
        if (priorityRatio < 0.3 && activeGoals.length > 3) {
            rawScore -= 10; // Penalty for lack of strategic focus
        }

        const score = Math.max(0, Math.min(100, Math.round(rawScore)));

        let grade = 'A';
        let message = "Excellent focus";

        if (score < 60) { grade = 'D'; message = "Needs immediate attention"; }
        else if (score < 75) { grade = 'C'; message = "Distracted"; }
        else if (score < 90) { grade = 'B'; message = "Good, but sharpen up"; }
        else { grade = 'A'; message = "Laser focused"; }

        return { score, grade, message, inProgressCount, blockedCount, overdueCount };
    }, [goals]);

    const getScoreColor = (s: number) => {
        if (s >= 90) return '#10b981'; // Green
        if (s >= 75) return '#3b82f6'; // Blue
        if (s >= 60) return '#f59e0b'; // Orange
        return '#ef4444'; // Red
    };

    const color = getScoreColor(scoreData.score);

    if (variant === 'compact') {
        return (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full border bg-opacity-10 backdrop-blur-sm transition-all duration-300 hover:bg-opacity-20"
                style={{ borderColor: `${color}30`, backgroundColor: `${color}10` }}>
                <div className="text-lg font-bold leading-none" style={{ color }}>{scoreData.score}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Focus Score</div>
            </div>
        );
    }

    return (
        <div className="w-full p-6 rounded-2xl bg-slate-900/50 border border-white/5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-slate-200">Focus Score</h3>
                <div className="px-2.5 py-1 rounded-lg text-xs font-bold border"
                    style={{ color: color, borderColor: `${color}30`, backgroundColor: `${color}10` }}>
                    {scoreData.grade}
                </div>
            </div>

            <div className="flex items-center gap-6 flex-1">
                <div className="w-24 h-24 shrink-0 relative">
                    <svg viewBox="0 0 36 36" className="transform -rotate-90 w-full h-full drop-shadow-lg">
                        <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="2.5"
                        />
                        <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={color}
                            strokeWidth="2.5"
                            strokeDasharray={`${scoreData.score}, 100`}
                            className="transition-all duration-1000 ease-out"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold" style={{ color }}>{scoreData.score}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <p className="text-lg font-semibold text-slate-100 leading-tight">{scoreData.message}</p>
                    <div className="flex flex-col gap-1 text-xs">
                        {scoreData.inProgressCount > 5 && <span className="text-red-400 font-medium">Overloaded ({scoreData.inProgressCount} active)</span>}
                        {scoreData.blockedCount > 0 && <span className="text-red-400 font-medium">{scoreData.blockedCount} Blocked</span>}
                        {scoreData.overdueCount > 0 && <span className="text-orange-400 font-medium">{scoreData.overdueCount} Overdue</span>}
                        {scoreData.inProgressCount <= 5 && scoreData.blockedCount === 0 && scoreData.overdueCount === 0 && <span className="text-slate-500 italic">All systems go</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
