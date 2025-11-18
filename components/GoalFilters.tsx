"use client";

import { useMemo } from "react";
import { Goal, useGoals } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";

type Pri = "low" | "medium" | "high" | "critical";
type St  = "open" | "in-progress" | "blocked" | "done";
const PRIORITIES: Pri[] = ["low", "medium", "high", "critical"];

export default function GoalFilters() {
  const { goals = [], filters, setFilters } = useGoals();
  const { categories } = useCustomization();
  const all: Goal[] = goals;

  const { counts, yearStats } = useMemo(() => {
    const accumulator = {
      total: 0,
      status: {
        open: 0,
        "in-progress": 0,
        blocked: 0,
        done: 0,
      } as Record<St, number>,
      categories: {} as Record<string, number>,
      priorities: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      } as Record<Pri, number>,
    };
    const years: Record<number, { total: number; done: number }> = {};
    all.forEach((goal) => {
      accumulator.total += 1;
      accumulator.status[goal.status] += 1;
      accumulator.categories[goal.category] = (accumulator.categories[goal.category] ?? 0) + 1;
      accumulator.priorities[goal.priority] += 1;
      const year = new Date(goal.endDate).getFullYear();
      if (!Number.isNaN(year)) {
        if (!years[year]) years[year] = { total: 0, done: 0 };
        years[year].total += 1;
        if (goal.status === "done") years[year].done += 1;
      }
    });
    const yearStats = Object.entries(years)
      .map(([year, info]) => ({
        year: Number(year),
        percent: info.total ? Math.round((info.done / info.total) * 100) : 0,
        total: info.total,
        done: info.done,
      }))
      .sort((a, b) => a.year - b.year);
    return { counts: accumulator, yearStats };
  }, [all]);

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const currentYearInfo =
    yearStats.find((entry) => entry.year === currentYear) ?? { year: currentYear, percent: 0, total: 0, done: 0 };
  const nextYearInfo =
    yearStats.find((entry) => entry.year === nextYear) ?? { year: nextYear, percent: 0, total: 0, done: 0 };
  
  const currentYearTotal = currentYearInfo.total || counts.total;
  const currentYearDone = currentYearInfo.done || counts.status.done;
  const completionPct = currentYearTotal ? Math.round((currentYearDone / currentYearTotal) * 100) : 0;
  const statusPills: Array<{ key: St; label: string; className: string }> = [
    { key: "open", label: "Open", className: "filters__status-pill--open" },
    { key: "in-progress", label: "In progress", className: "filters__status-pill--inprog" },
    { key: "blocked", label: "Blocked", className: "filters__status-pill--blocked" },
    { key: "done", label: "Done", className: "filters__status-pill--done" },
  ];

  const toggleCategory = (value: string) => {
    setFilters((prev) => {
      const next = new Set(prev.categories ?? []);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return { ...prev, categories: next.size ? next : null };
    });
  };

  const togglePriority = (value: Pri) => {
    setFilters((prev) => {
      const next = new Set(prev.priorities ?? []);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return { ...prev, priorities: next.size ? next : null };
    });
  };

  const toggleStatus = (value: St) => {
    setFilters((prev) => {
      const next = new Set(prev.statuses ?? []);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return { ...prev, statuses: next.size ? next : null };
    });
  };

  const reset = () =>
    setFilters({
      categories: null,
      priorities: null,
      statuses: null,
      query: "",
    });

  const Chip = ({
    active,
    onClick,
    children,
    className = "",
    count,
  }: {
    active?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    count?: number;
  }) => (
    <button
      type="button"
      className={[
        "chip",
        "chip--interactive",
        active ? "chip--on" : "",
        className,
      ].join(" ")}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="chip__inner">
        {active && <span className="chip__indicator" aria-hidden />}
        <span className="chip__label">{children}</span>
        {typeof count === "number" && <span className="chip__count">{count}</span>}
      </span>
    </button>
  );

  const hasActiveFilters = filters.categories || filters.priorities || filters.statuses;

  return (
    <div className="filters">
      {/* Control Center Title */}
      <div className="filters__control-center-title">
        <h2>Control Center</h2>
      </div>

      {/* Header with Year and Completion */}
      <div className="filters__premium-header">
        <div className="filters__premium-year">{currentYear}</div>
        <div className="filters__premium-completion">
          <span className="filters__premium-completion-value">{completionPct}%</span>
          <span className="filters__premium-completion-label">complete</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="filters__premium-stats">
        <div className="filters__premium-stat">
          <span className="filters__premium-stat-value">{currentYearTotal}</span>
          <span className="filters__premium-stat-label">Goals</span>
        </div>
        <div className="filters__premium-stat-divider" />
        <div className="filters__premium-stat">
          <span className="filters__premium-stat-value">{counts.status.done}</span>
          <span className="filters__premium-stat-label">Done</span>
        </div>
        <div className="filters__premium-stat-divider" />
        <div className="filters__premium-stat">
          <span className="filters__premium-stat-value">{counts.status["in-progress"]}</span>
          <span className="filters__premium-stat-label">Active</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters__premium-section">
        <div className="filters__premium-section-header">
          <span>Status</span>
          {filters.statuses && (
            <button
              type="button"
              className="filters__premium-clear"
              onClick={() => setFilters(prev => ({ ...prev, statuses: null }))}
            >
              Clear
            </button>
          )}
        </div>
        <div className="filters__premium-pills">
          {statusPills.map(({ key, label, className }) => {
            const isActive = filters.statuses?.has(key) ?? false;
            const statusClass = key === "in-progress" ? "inprog" : key;
            return (
              <button
                key={key}
                type="button"
                className={[
                  "filters__premium-pill",
                  `filters__premium-pill--${statusClass}`,
                  isActive ? "is-active" : ""
                ].join(" ")}
                onClick={() => toggleStatus(key)}
                aria-pressed={isActive}
              >
                <span className="filters__premium-pill-label">{label}</span>
                <span className="filters__premium-pill-count">{counts.status[key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="filters__premium-section">
        <div className="filters__premium-section-header">
          <span>Category</span>
          {filters.categories && (
            <button
              type="button"
              className="filters__premium-clear"
              onClick={() => setFilters(prev => ({ ...prev, categories: null }))}
            >
              Clear
            </button>
          )}
        </div>
        <div className="filters__premium-pills">
          {categories.map(cat => {
            const catName = cat.name;
            const count = counts.categories[catName] || 0;
            const isActive = filters.categories?.has(catName) ?? false;
            return (
              <button
                key={cat.id}
                type="button"
                className={[
                  "filters__premium-pill",
                  `filters__premium-pill--cat-${catName.toLowerCase()}`,
                  isActive ? "is-active" : ""
                ].join(" ")}
                onClick={() => toggleCategory(catName)}
                aria-pressed={isActive}
              >
                <span className="filters__premium-pill-label">{catName.charAt(0) + catName.slice(1).toLowerCase()}</span>
                <span className="filters__premium-pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="filters__premium-section">
        <div className="filters__premium-section-header">
          <span>Priority</span>
          {filters.priorities && (
            <button
              type="button"
              className="filters__premium-clear"
              onClick={() => setFilters(prev => ({ ...prev, priorities: null }))}
            >
              Clear
            </button>
          )}
        </div>
        <div className="filters__premium-pills">
          {PRIORITIES.map(p => (
            <button
              key={p}
              type="button"
              className={[
                "filters__premium-pill",
                `filters__premium-pill--pri-${p}`,
                filters.priorities?.has(p) ? "is-active" : ""
              ].join(" ")}
              onClick={() => togglePriority(p)}
              aria-pressed={filters.priorities?.has(p) ?? false}
            >
              <span className="filters__premium-pill-label">{p.charAt(0).toUpperCase() + p.slice(1)}</span>
              <span className="filters__premium-pill-count">{counts.priorities[p]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Next Year & Reset */}
      {(nextYearInfo.total > 0 || hasActiveFilters) && (
        <div className="filters__premium-footer">
          {nextYearInfo.total > 0 && (
            <div className="filters__premium-next-year">
              <div className="filters__premium-next-year-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
              <div className="filters__premium-next-year-content">
                <span>{nextYear}</span>
                <span>{nextYearInfo.total} planned</span>
              </div>
            </div>
          )}
          {hasActiveFilters && (
            <button type="button" className="filters__premium-reset" onClick={reset}>
              Reset filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
