"use client";

import Link from "next/link";
import { useGoals } from "@/components/GoalsContext";
import { useCustomization } from "@/components/CustomizationContext";
import { useState } from "react";
import TrendChart from "@/components/TrendChart";
import BurndownChart from "@/components/BurndownChart";
import HeatMap from "@/components/HeatMap";
import FocusDistribution from "@/components/FocusDistribution";
import VelocityMetric from "@/components/VelocityMetric";
import CategoryRadar from "@/components/CategoryRadar";

export default function DashboardPage() {
  const { goals } = useGoals();
  const { categories, priorities, statuses, getCategoryColor, getPriorityColor, getStatusColor } = useCustomization();
  const [selectedView, setSelectedView] = useState<'overview' | 'analytics'>('overview');

  // Calculate stats
  const totalGoals = goals.length;
  const activeGoals = goals.filter(g => g.status !== 'done').length;
  const completedGoals = goals.filter(g => g.status === 'done').length;
  const blockedGoals = goals.filter(g => g.status === 'blocked').length;
  const inProgressGoals = goals.filter(g => g.status === 'in-progress').length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // Goals by status
  const goalsByStatus = statuses.map(status => ({
    label: status.name,
    count: goals.filter(g => g.status === status.id).length,
    color: status.color,
  }));

  // Goals by priority
  const goalsByPriority = priorities.map(priority => ({
    label: priority.name,
    count: goals.filter(g => g.priority === priority.id).length,
    color: priority.color,
  }));

  // Upcoming deadlines (next 30 days)
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingGoals = goals
    .filter(g => {
      const endDate = new Date(g.endDate);
      return endDate >= now && endDate <= thirtyDaysFromNow && g.status !== 'done';
    })
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 5);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    return `${diff} days`;
  };

  return (
    <main className="workspace">
      <div className="dashboard">
        <header className="dashboard__header">
          <div>
            <p className="workspace__eyebrow">ANALYTICS</p>
            <h1 className="dashboard__title">Goals Dashboard</h1>
          </div>
          <div className="dashboard__header-actions">
            <div className="view-switcher">
              <button
                className={`view-switcher__btn ${selectedView === 'overview' ? 'view-switcher__btn--active' : ''}`}
                onClick={() => setSelectedView('overview')}
              >
                Overview
              </button>
              <button
                className={`view-switcher__btn ${selectedView === 'analytics' ? 'view-switcher__btn--active' : ''}`}
                onClick={() => setSelectedView('analytics')}
              >
                Analytics
              </button>
            </div>
            <Link href="/classic" className="btn btn--secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Workspace
            </Link>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="dashboard__kpis">
          <div className="kpi-card kpi-card--primary">
            <div className="kpi-card__icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="kpi-card__content">
              <p className="kpi-card__label">COMPLETION RATE</p>
              <p className="kpi-card__value">{completionRate}%</p>
              <div className="kpi-card__progress">
                <div className="kpi-card__progress-bar" style={{ width: `${completionRate}%` }} />
              </div>
              <p className="kpi-card__meta">{completedGoals} of {totalGoals} goals completed</p>
            </div>
          </div>

          <div className="kpi-card kpi-card--success">
            <div className="kpi-card__icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className="kpi-card__content">
              <p className="kpi-card__label">IN PROGRESS</p>
              <p className="kpi-card__value">{inProgressGoals}</p>
              <p className="kpi-card__meta">{activeGoals} total active</p>
            </div>
          </div>

          <div className="kpi-card kpi-card--warning">
            <div className="kpi-card__icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="kpi-card__content">
              <p className="kpi-card__label">BLOCKED</p>
              <p className="kpi-card__value">{blockedGoals}</p>
              <p className="kpi-card__meta">Need attention</p>
            </div>
          </div>

          <div className="kpi-card kpi-card--info">
            <div className="kpi-card__icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="kpi-card__content">
              <p className="kpi-card__label">UPCOMING</p>
              <p className="kpi-card__value">{upcomingGoals.length}</p>
              <p className="kpi-card__meta">Next 30 days</p>
            </div>
          </div>
        </div>

        {selectedView === 'overview' ? (
          <div className="dashboard__content">
            {/* Top Row - Main Charts */}
            <div className="dashboard__row dashboard__row--primary">
              <div className="dashboard__card dashboard__card--large">
                <TrendChart />
              </div>
              <div className="dashboard__card dashboard__card--large">
                <BurndownChart />
              </div>
            </div>

            {/* Second Row - Distribution */}
            <div className="dashboard__row">
              <div className="dashboard__card dashboard__card--medium">
                <FocusDistribution />
              </div>
              <div className="dashboard__card dashboard__card--medium">
                <div className="dashboard__card-header">
                  <h3>Goals by Status</h3>
                  <span className="badge">{totalGoals} total</span>
                </div>
                <div className="distribution-bars">
                  {goalsByStatus.map(status => {
                    const percentage = totalGoals > 0 ? (status.count / totalGoals) * 100 : 0;
                    return (
                      <div key={status.label} className="distribution-bar">
                        <div className="distribution-bar__header">
                          <span className="distribution-bar__label">{status.label}</span>
                          <span className="distribution-bar__count">{status.count}</span>
                        </div>
                        <div className="distribution-bar__track">
                          <div
                            className="distribution-bar__fill"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: status.color,
                            }}
                          />
                        </div>
                        <div className="distribution-bar__percentage">{percentage.toFixed(0)}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="dashboard__card dashboard__card--medium">
                <div className="dashboard__card-header">
                  <h3>Goals by Priority</h3>
                  <span className="badge">{totalGoals} total</span>
                </div>
                <div className="distribution-bars">
                  {goalsByPriority.map(priority => {
                    const percentage = totalGoals > 0 ? (priority.count / totalGoals) * 100 : 0;
                    return (
                      <div key={priority.label} className="distribution-bar">
                        <div className="distribution-bar__header">
                          <span className="distribution-bar__label">{priority.label}</span>
                          <span className="distribution-bar__count">{priority.count}</span>
                        </div>
                        <div className="distribution-bar__track">
                          <div
                            className="distribution-bar__fill"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: priority.color,
                            }}
                          />
                        </div>
                        <div className="distribution-bar__percentage">{percentage.toFixed(0)}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Third Row - Activity */}
            <div className="dashboard__row">
              <div className="dashboard__card dashboard__card--wide">
                <HeatMap />
              </div>
              <div className="dashboard__card dashboard__card--narrow">
                <div className="dashboard__card-header">
                  <h3>Upcoming Deadlines</h3>
                  <span className="badge badge--urgent">{upcomingGoals.length}</span>
                </div>
                {upcomingGoals.length === 0 ? (
                  <div className="dashboard__empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <p>No upcoming deadlines</p>
                  </div>
                ) : (
                  <div className="goal-list goal-list--compact">
                    {upcomingGoals.map(goal => (
                      <div key={goal.id} className="goal-item goal-item--interactive">
                        <div className="goal-item__indicator" style={{ backgroundColor: getCategoryColor(goal.category) }} />
                        <div className="goal-item__content">
                          <p className="goal-item__title">{goal.title}</p>
                          <p className="goal-item__meta">{formatDate(goal.endDate)}</p>
                        </div>
                        <div className="goal-item__badge" data-urgent={getDaysUntil(goal.endDate).includes('overdue')}>
                          {getDaysUntil(goal.endDate)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard__content">
            {/* Analytics View */}
            <div className="dashboard__row dashboard__row--full">
              <div className="dashboard__card dashboard__card--full">
                <VelocityMetric />
              </div>
            </div>

            <div className="dashboard__row">
              <div className="dashboard__card dashboard__card--large">
                <CategoryRadar variant="full" />
              </div>
              <div className="dashboard__card dashboard__card--large">
                <BurndownChart />
              </div>
            </div>

            <div className="dashboard__row dashboard__row--full">
              <div className="dashboard__card dashboard__card--full">
                <HeatMap />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
