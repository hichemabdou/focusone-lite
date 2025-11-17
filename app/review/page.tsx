"use client";

import { useMemo, useState } from "react";
import { useGoals } from "@/components/GoalsContext";
import { useCustomization } from "@/components/CustomizationContext";
import TrendChart from "@/components/TrendChart";

type Quarter = 1 | 2 | 3 | 4;

interface QuarterData {
  year: number;
  quarter: Quarter;
  startDate: Date;
  endDate: Date;
}

export default function ReviewPage() {
  const { goals } = useGoals();
  const { categories, getPriorityColor, getStatusColor } = useCustomization();

  // Get current quarter
  const getCurrentQuarter = (): QuarterData => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    const quarter = (Math.floor(month / 3) + 1) as Quarter;

    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0);

    return { year, quarter, startDate, endDate };
  };

  const [selectedQuarter, setSelectedQuarter] = useState<QuarterData>(getCurrentQuarter());

  // Get available quarters from goals
  const availableQuarters = useMemo(() => {
    const quarters = new Set<string>();
    goals.forEach(goal => {
      const date = new Date(goal.endDate);
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      quarters.add(`${year}-Q${quarter}`);
    });
    return Array.from(quarters).sort().reverse();
  }, [goals]);

  // Filter goals for selected quarter
  const quarterGoals = useMemo(() => {
    return goals.filter(goal => {
      const start = new Date(goal.startDate);
      const end = new Date(goal.endDate);
      // Goal overlaps with quarter if it starts before quarter ends and ends after quarter starts
      return start <= selectedQuarter.endDate && end >= selectedQuarter.startDate;
    });
  }, [goals, selectedQuarter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = quarterGoals.length;
    const completed = quarterGoals.filter(g => g.status === 'done').length;
    const inProgress = quarterGoals.filter(g => g.status === 'in-progress').length;
    const blocked = quarterGoals.filter(g => g.status === 'blocked').length;
    const open = quarterGoals.filter(g => g.status === 'open').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Category breakdown
    const categoryStats = categories.map(cat => {
      const catGoals = quarterGoals.filter(g => g.category === cat.name);
      const catCompleted = catGoals.filter(g => g.status === 'done').length;
      return {
        ...cat,
        total: catGoals.length,
        completed: catCompleted,
        rate: catGoals.length > 0 ? Math.round((catCompleted / catGoals.length) * 100) : 0,
      };
    }).filter(c => c.total > 0);

    // Priority breakdown
    const priorities = ['critical', 'high', 'medium', 'low'] as const;
    const priorityStats = priorities.map(pri => {
      const priGoals = quarterGoals.filter(g => g.priority === pri);
      const priCompleted = priGoals.filter(g => g.status === 'done').length;
      return {
        name: pri,
        total: priGoals.length,
        completed: priCompleted,
        rate: priGoals.length > 0 ? Math.round((priCompleted / priGoals.length) * 100) : 0,
        color: getPriorityColor(pri),
      };
    }).filter(p => p.total > 0);

    return {
      total,
      completed,
      inProgress,
      blocked,
      open,
      completionRate,
      categoryStats,
      priorityStats,
    };
  }, [quarterGoals, categories, getPriorityColor]);

  // Navigate quarters
  const navigateQuarter = (direction: 'prev' | 'next') => {
    const { year, quarter } = selectedQuarter;
    let newYear = year;
    let newQuarter = quarter;

    if (direction === 'next') {
      newQuarter = (quarter % 4) + 1 as Quarter;
      if (quarter === 4) newYear++;
    } else {
      newQuarter = (quarter === 1 ? 4 : quarter - 1) as Quarter;
      if (quarter === 1) newYear--;
    }

    const startMonth = (newQuarter - 1) * 3;
    const startDate = new Date(newYear, startMonth, 1);
    const endDate = new Date(newYear, startMonth + 3, 0);

    setSelectedQuarter({ year: newYear, quarter: newQuarter, startDate, endDate });
  };

  const quarterLabel = `Q${selectedQuarter.quarter} ${selectedQuarter.year}`;
  const isCurrentQuarter = JSON.stringify(selectedQuarter) === JSON.stringify(getCurrentQuarter());

  return (
    <main className="review">
      <div className="review__container">
        {/* Header */}
        <header className="review__header">
          <div className="review__header-content">
            <div className="review__title-group">
              <p className="workspace__eyebrow">Quarterly review</p>
              <h1 className="review__title">Reflect, learn, plan ahead</h1>
            </div>

            {/* Quarter navigation */}
            <div className="review__quarter-nav">
              <button
                type="button"
                className="btn btn--icon"
                onClick={() => navigateQuarter('prev')}
                aria-label="Previous quarter"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <div className="review__quarter-display">
                <span className="review__quarter-label">{quarterLabel}</span>
                {isCurrentQuarter && <span className="review__current-badge">Current</span>}
              </div>

              <button
                type="button"
                className="btn btn--icon"
                onClick={() => navigateQuarter('next')}
                aria-label="Next quarter"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Key Metrics */}
        <section className="review__section">
          <h2 className="review__section-title">Overview</h2>
          <div className="review__metrics-grid">
            <div className="metric-card metric-card--primary">
              <div className="metric-card__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4 12 14.01l-3-3" />
                </svg>
              </div>
              <div className="metric-card__content">
                <div className="metric-card__value">{metrics.completionRate}%</div>
                <div className="metric-card__label">Completion rate</div>
                <div className="metric-card__sublabel">{metrics.completed} of {metrics.total} goals</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card__icon" style={{ color: getStatusColor('done') }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="metric-card__content">
                <div className="metric-card__value">{metrics.completed}</div>
                <div className="metric-card__label">Completed</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card__icon" style={{ color: getStatusColor('in-progress') }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="metric-card__content">
                <div className="metric-card__value">{metrics.inProgress}</div>
                <div className="metric-card__label">In progress</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card__icon" style={{ color: getStatusColor('blocked') }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6M9 9l6 6" />
                </svg>
              </div>
              <div className="metric-card__content">
                <div className="metric-card__value">{metrics.blocked}</div>
                <div className="metric-card__label">Blocked</div>
              </div>
            </div>
          </div>
        </section>

        {/* Trend Chart */}
        <section className="review__section">
          <h2 className="review__section-title">Activity trends</h2>
          <div className="review__chart-container">
            <TrendChart />
          </div>
        </section>

        {/* Category & Priority Breakdown */}
        <div className="review__two-column">
          {/* Category Breakdown */}
          <section className="review__section">
            <h2 className="review__section-title">Focus by category</h2>
            <div className="review__breakdown">
              {metrics.categoryStats.length > 0 ? (
                metrics.categoryStats.map(cat => (
                  <div key={cat.id} className="breakdown-item">
                    <div className="breakdown-item__header">
                      <div className="breakdown-item__label">
                        <span className="breakdown-item__dot" style={{ backgroundColor: cat.color }} />
                        <span className="breakdown-item__name">{cat.name}</span>
                      </div>
                      <span className="breakdown-item__stat">
                        {cat.completed}/{cat.total}
                      </span>
                    </div>
                    <div className="breakdown-item__bar">
                      <div
                        className="breakdown-item__fill"
                        style={{
                          width: `${cat.rate}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                    <div className="breakdown-item__rate">{cat.rate}% complete</div>
                  </div>
                ))
              ) : (
                <p className="review__empty">No goals in selected quarter</p>
              )}
            </div>
          </section>

          {/* Priority Breakdown */}
          <section className="review__section">
            <h2 className="review__section-title">Focus by priority</h2>
            <div className="review__breakdown">
              {metrics.priorityStats.length > 0 ? (
                metrics.priorityStats.map(pri => (
                  <div key={pri.name} className="breakdown-item">
                    <div className="breakdown-item__header">
                      <div className="breakdown-item__label">
                        <span className="breakdown-item__dot" style={{ backgroundColor: pri.color }} />
                        <span className="breakdown-item__name">
                          {pri.name.charAt(0).toUpperCase() + pri.name.slice(1)}
                        </span>
                      </div>
                      <span className="breakdown-item__stat">
                        {pri.completed}/{pri.total}
                      </span>
                    </div>
                    <div className="breakdown-item__bar">
                      <div
                        className="breakdown-item__fill"
                        style={{
                          width: `${pri.rate}%`,
                          backgroundColor: pri.color,
                        }}
                      />
                    </div>
                    <div className="breakdown-item__rate">{pri.rate}% complete</div>
                  </div>
                ))
              ) : (
                <p className="review__empty">No goals in selected quarter</p>
              )}
            </div>
          </section>
        </div>

        {/* Completed Goals (Achievements) */}
        <section className="review__section">
          <h2 className="review__section-title">Achievements</h2>
          {metrics.completed > 0 ? (
            <div className="review__achievements">
              {quarterGoals
                .filter(g => g.status === 'done')
                .map(goal => {
                  const category = categories.find(c => c.name === goal.category);
                  return (
                    <div key={goal.id} className="achievement-card">
                      <div className="achievement-card__icon" style={{ backgroundColor: category?.color }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </div>
                      <div className="achievement-card__content">
                        <h3 className="achievement-card__title">{goal.title}</h3>
                        <div className="achievement-card__meta">
                          <span className="achievement-card__category" style={{ color: category?.color }}>
                            {goal.category}
                          </span>
                          <span className="achievement-card__date">
                            Completed {new Date(goal.endDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        {goal.notes && (
                          <p className="achievement-card__notes">{goal.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="review__empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <p>No completed goals this quarter yet</p>
            </div>
          )}
        </section>

        {/* Reflection Section */}
        <section className="review__section">
          <h2 className="review__section-title">Reflections & planning</h2>
          <div className="review__reflections">
            <div className="reflection-card">
              <div className="reflection-card__header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2 L16 8 L23 9 L17.5 14.5 L19 22 L12 18 L5 22 L6.5 14.5 L1 9 L8 8 Z" fill="currentColor" />
                </svg>
                <h3>Key wins</h3>
              </div>
              <p className="reflection-card__hint">What went well this quarter? What are you proud of?</p>
              <textarea
                className="reflection-card__textarea"
                placeholder="Document your successes, milestones achieved, and positive outcomes..."
                rows={4}
              />
            </div>

            <div className="reflection-card">
              <div className="reflection-card__header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2 L2 7 L12 12 L22 7 Z" />
                  <path d="M2 17 L12 22 L22 17" />
                  <path d="M2 12 L12 17 L22 12" />
                </svg>
                <h3>Lessons learned</h3>
              </div>
              <p className="reflection-card__hint">What challenges did you face? What would you do differently?</p>
              <textarea
                className="reflection-card__textarea"
                placeholder="Capture insights, obstacles overcome, and areas for improvement..."
                rows={4}
              />
            </div>

            <div className="reflection-card">
              <div className="reflection-card__header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M2 12h20" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
                <h3>Next quarter focus</h3>
              </div>
              <p className="reflection-card__hint">What are your priorities for the next quarter?</p>
              <textarea
                className="reflection-card__textarea"
                placeholder="Set intentions, define priorities, and outline key initiatives..."
                rows={4}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
