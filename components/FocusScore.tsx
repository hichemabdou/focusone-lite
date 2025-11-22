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
            <div className="focus-score-compact" style={{ borderColor: `${color}40`, background: `${color}10` }}>
                <div className="focus-score-compact__value" style={{ color }}>{scoreData.score}</div>
                <div className="focus-score-compact__label">Focus Score</div>
            </div>
        );
    }

    return (
        <div className="focus-score-card">
            <div className="focus-score-card__header">
                <h3 className="focus-score-card__title">Focus Score</h3>
                <div className="focus-score-card__badge" style={{ color: color, borderColor: color, backgroundColor: `${color}15` }}>
                    {scoreData.grade}
                </div>
            </div>

            <div className="focus-score-card__main">
                <div className="focus-score-card__gauge">
                    <svg viewBox="0 0 36 36" className="focus-gauge">
                        <path
                            d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="3"
                        />
                        <path
                            d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={color}
                            strokeWidth="3"
                            strokeDasharray={`${scoreData.score}, 100`}
                            className="focus-gauge__fill"
                        />
                        <text x="18" y="20.5" className="focus-gauge__text" fill={color}>{scoreData.score}</text>
                    </svg>
                </div>
                <div className="focus-score-card__details">
                    <p className="focus-score-card__message">{scoreData.message}</p>
                    <div className="focus-score-card__stats">
                        {scoreData.inProgressCount > 5 && <span className="text-red-400">Overloaded ({scoreData.inProgressCount} active)</span>}
                        {scoreData.blockedCount > 0 && <span className="text-red-400">{scoreData.blockedCount} Blocked</span>}
                        {scoreData.overdueCount > 0 && <span className="text-orange-400">{scoreData.overdueCount} Overdue</span>}
                        {scoreData.inProgressCount <= 5 && scoreData.blockedCount === 0 && scoreData.overdueCount === 0 && <span className="text-gray-400">All systems go</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
