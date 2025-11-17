"use client";

import { useMemo } from "react";
import { useGoals } from "./GoalsContext";

export default function BurndownChart() {
  const { goals } = useGoals();

  const chartData = useMemo(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'done').length;
    const remaining = totalGoals - completedGoals;
    
    return {
      total: totalGoals,
      completed: completedGoals,
      remaining,
      completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
    };
  }, [goals]);

  return (
    <div className="burndown-chart">
      <div className="burndown-chart__header">
        <div>
          <h3 className="burndown-chart__title">Goal Progress</h3>
          <p className="burndown-chart__subtitle">Overall completion status</p>
        </div>
      </div>

      <div className="burndown-chart__visual">
        <svg viewBox="0 0 200 200" className="burndown-chart__circle">
          <circle
            className="burndown-chart__bg"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="20"
          />
          <circle
            className="burndown-chart__progress"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="20"
            strokeDasharray={`${chartData.completionRate * 5.65} 565`}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <text
            x="100"
            y="95"
            textAnchor="middle"
            className="burndown-chart__percentage"
            fontSize="32"
            fontWeight="700"
            fill="rgba(248,250,252,0.95)"
          >
            {Math.round(chartData.completionRate)}%
          </text>
          <text
            x="100"
            y="115"
            textAnchor="middle"
            fontSize="12"
            fill="rgba(226,232,240,0.6)"
          >
            Complete
          </text>
        </svg>
      </div>

      <div className="burndown-chart__stats">
        <div className="burndown-chart__stat">
          <div className="burndown-chart__stat-value">{chartData.completed}</div>
          <div className="burndown-chart__stat-label">Completed</div>
        </div>
        <div className="burndown-chart__stat">
          <div className="burndown-chart__stat-value">{chartData.remaining}</div>
          <div className="burndown-chart__stat-label">Remaining</div>
        </div>
        <div className="burndown-chart__stat">
          <div className="burndown-chart__stat-value">{chartData.total}</div>
          <div className="burndown-chart__stat-label">Total</div>
        </div>
      </div>
    </div>
  );
}
