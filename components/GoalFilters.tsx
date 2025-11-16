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

  return (
    <div className="filters">
      {/* Title */}
      <div className="filters__header filters__header--compact">
        <span className="filters__eyebrow">Control centre</span>
      </div>

      <section className="filters__pulse" aria-label="Workspace pulse">
        <div className="filters__pulse-head">
          <div>
            <p className="filters__pulse-meta">Workspace pulse · {currentYear}</p>
            <span className="filters__pulse-total">
              {currentYearTotal} goals · {currentYearDone} done
            </span>
          </div>
          <div className="filters__pulse-score">
            <span>Done</span>
            <strong>{completionPct}%</strong>
          </div>
        </div>
        <div className="filters__pulse-bar" aria-hidden>
          <span style={{ width: `${completionPct}%` }} />
        </div>
        <div className="filters__status-pills">
          {statusPills.map(({ key, label, className }) => (
            <button
              key={key}
              type="button"
              className={["filters__status-pill", className].join(" ")}
              onClick={() => toggleStatus(key)}
              aria-pressed={filters.statuses?.has(key) ?? false}
            >
              <span>{label}</span>
              <strong>{counts.status[key]}</strong>
            </button>
          ))}
        </div>
        <div className="filters__year-card filters__year-card--next">
          <p>{nextYear} · Next year</p>
          <strong>{nextYearInfo.total} goals planned</strong>
          <small>{nextYearInfo.done ? `${nextYearInfo.done} pre-completed` : "Preview your upcoming focus"}</small>
        </div>
      </section>

      {/* Categories */}
      <div className="filters__section">
        <div className="eyebrow">Focus categories</div>
        <div className="filters__chips">
          {categories.map(cat => {
            const catName = cat.name;
            const count = counts.categories[catName] || 0;
            return (
              <Chip
                key={cat.id}
                active={filters.categories?.has(catName) ?? false}
                onClick={() => toggleCategory(catName)}
                className={`chip--cat-${catName.toLowerCase()}`}
                count={count}
              >
                {catName.charAt(0) + catName.slice(1).toLowerCase()}
              </Chip>
            );
          })}
        </div>
      </div>

      {/* Priority */}
      <div className="filters__section">
        <div className="eyebrow">Priority</div>
        <div className="filters__chips">
          {PRIORITIES.map(p => (
            <Chip
              key={p}
              active={filters.priorities?.has(p) ?? false}
              onClick={() => togglePriority(p)}
              className={`chip--pri-${p}`}
              count={counts.priorities[p]}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Chip>
          ))}
        </div>
      </div>

      {/* Search + Reset */}
      <div className="filters__section">
        <div className="eyebrow">Quick search</div>
        <div className="filters__actions">
          <input
            className="field filters__search"
            placeholder="Find a goal by title or notes"
            value={filters.query}
            onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
          />
          <button type="button" className="btn" onClick={reset}>Reset</button>
        </div>
      </div>
    </div>
  );
}
