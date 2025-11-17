"use client";

import { useMemo } from "react";
import { useGoals } from "./GoalsContext";

export default function VelocityMetric() {
  const { goals } = useGoals();

  const metrics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const last30Days = goals.filter(g => {
      const end = new Date(g.endDate);
      return end >= thirtyDaysAgo && end <= now && g.status === 'done';
    }).length;

    const previous30Days = goals.filter(g => {
      const end = new Date(g.endDate);
      return end >= sixtyDaysAgo && end < thirtyDaysAgo && g.status === 'done';
    }).length;

    const velocity = last30Days;
    const change = previous30Days > 0 
      ? ((last30Days - previous30Days) / previous30Days) * 100 
      : 0;

    const avgDuration = goals.filter(g => g.status === 'done').reduce((sum, g) => {
      const start = new Date(g.startDate);
      const end = new Date(g.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0) / Math.max(goals.filter(g => g.status === 'done').length, 1);

    return {
      velocity,
      change,
      avgDuration: Math.round(avgDuration),
      last30Days,
      previous30Days,
    };
  }, [goals]);

  return (
    <div className="velocity-metric">
      <div className="velocity-metric__header">
        <h3 className="velocity-metric__title">Velocity Metrics</h3>
        <p className="velocity-metric__subtitle">Goal completion trends</p>
      </div>

      <div className="velocity-metric__stats">
        <div className="velocity-stat velocity-stat--primary">
          <div className="velocity-stat__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="velocity-stat__content">
            <div className="velocity-stat__value">{metrics.velocity}</div>
            <div className="velocity-stat__label">Goals / 30 days</div>
            {metrics.change !== 0 && (
              <div className={`velocity-stat__change velocity-stat__change--${metrics.change > 0 ? 'positive' : 'negative'}`}>
                {metrics.change > 0 ? '↑' : '↓'} {Math.abs(Math.round(metrics.change))}%
              </div>
            )}
          </div>
        </div>

        <div className="velocity-stat">
          <div className="velocity-stat__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="velocity-stat__content">
            <div className="velocity-stat__value">{metrics.avgDuration}</div>
            <div className="velocity-stat__label">Avg. days to complete</div>
          </div>
        </div>

        <div className="velocity-stat">
          <div className="velocity-stat__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
          </div>
          <div className="velocity-stat__content">
            <div className="velocity-stat__value">{metrics.last30Days}</div>
            <div className="velocity-stat__label">Last 30 days</div>
          </div>
        </div>

        <div className="velocity-stat">
          <div className="velocity-stat__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18 17v-5" />
              <path d="M13 17V8" />
              <path d="M8 17v-4" />
            </svg>
          </div>
          <div className="velocity-stat__content">
            <div className="velocity-stat__value">{metrics.previous30Days}</div>
            <div className="velocity-stat__label">Previous 30 days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
