"use client";

import { useMemo } from "react";
import { useGoals } from "./GoalsContext";

export default function BurndownChart() {
  const { goals } = useGoals();

  const chartData = useMemo(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'done').length;
    const remaining = totalGoals - completedGoals;
    const blocked = goals.filter(g => g.status === 'blocked').length;

    return {
      total: totalGoals,
      completed: completedGoals,
      remaining,
      blocked,
      completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
    };
  }, [goals]);

  return (
    <div className="burndown-chart">
      <div className="burndown-chart__header">
        <div>
          <h3 className="burndown-chart__title">Overall Progress</h3>
          <p className="burndown-chart__subtitle">Completion status across all goals</p>
        </div>
      </div>

      <div className="burndown-chart__content">
        <div className="burndown-chart__visual">
          <svg viewBox="0 0 200 200" className="burndown-chart__circle">
            <circle
              className="burndown-chart__bg"
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="12"
            />
            <circle
              className="burndown-chart__progress"
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="12"
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
              fontSize="36"
              fontWeight="700"
              fill="currentColor"
            >
              {Math.round(chartData.completionRate)}%
            </text>
            <text
              x="100"
              y="120"
              textAnchor="middle"
              fontSize="13"
              fill="rgba(255,255,255,0.5)"
              fontWeight="500"
            >
              COMPLETED
            </text>
          </svg>
        </div>

        <div className="burndown-chart__stats">
          <div className="stat-row">
            <span className="stat-row__label">Total Goals</span>
            <span className="stat-row__value">{chartData.total}</span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Completed</span>
            <span className="stat-row__value text-green-400">{chartData.completed}</span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Remaining</span>
            <span className="stat-row__value">{chartData.remaining}</span>
          </div>
          {chartData.blocked > 0 && (
            <div className="stat-row">
              <span className="stat-row__label text-red-400">Blocked</span>
              <span className="stat-row__value text-red-400">{chartData.blocked}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
