"use client";

import { useMemo } from "react";
import { useGoals } from "./GoalsContext";

export default function TrendChart() {
  const { goals } = useGoals();

  const weekData = useMemo(() => {
    const weeks = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const activeGoals = goals.filter(goal => {
        const start = new Date(goal.startDate);
        const end = new Date(goal.endDate);
        return start <= weekEnd && end >= weekStart && goal.status !== 'done';
      }).length;

      const completedGoals = goals.filter(goal => {
        const end = new Date(goal.endDate);
        return end >= weekStart && end <= weekEnd && goal.status === 'done';
      }).length;

      weeks.push({
        label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        active: activeGoals,
        completed: completedGoals,
      });
    }

    return weeks;
  }, [goals]);

  const maxValue = Math.max(...weekData.map(w => Math.max(w.active, w.completed)), 1);

  return (
    <div className="trend-chart">
      <div className="trend-chart__header">
        <div>
          <h3 className="trend-chart__title">Activity Trend</h3>
          <p className="trend-chart__subtitle">Last 12 weeks performance</p>
        </div>
        <div className="trend-chart__legend">
          <div className="trend-chart__legend-item">
            <span className="trend-chart__legend-dot trend-chart__legend-dot--active" />
            <span>Active</span>
          </div>
          <div className="trend-chart__legend-item">
            <span className="trend-chart__legend-dot trend-chart__legend-dot--completed" />
            <span>Completed</span>
          </div>
        </div>
      </div>

      <div className="trend-chart__canvas">
        <div className="trend-chart__bars">
          {weekData.map((week, i) => {
            const activeHeight = (week.active / maxValue) * 100;
            const completedHeight = (week.completed / maxValue) * 100;

            return (
              <div key={i} className="trend-chart__bar-group group">
                <div className="trend-chart__bars-container">
                  <div
                    className="trend-chart__bar trend-chart__bar--active"
                    style={{ height: `${activeHeight}%` }}
                  >
                    <div className="trend-chart__tooltip">Active: {week.active}</div>
                  </div>
                  <div
                    className="trend-chart__bar trend-chart__bar--completed"
                    style={{ height: `${completedHeight}%` }}
                  >
                    <div className="trend-chart__tooltip">Done: {week.completed}</div>
                  </div>
                </div>
                <div className="trend-chart__x-label">
                  {i % 2 === 0 ? week.label : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
