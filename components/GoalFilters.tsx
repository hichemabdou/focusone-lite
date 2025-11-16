"use client";

import { useMemo } from "react";
import { Goal, useGoals } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";

type Pri = "low" | "medium" | "high" | "critical";
type St  = "open" | "in-progress" | "blocked" | "done";
const PRIORITIES: Pri[] = ["low", "medium", "high", "critical"];
const STATUSES: St[] = ["open", "in-progress", "blocked", "done"];

export default function GoalFilters() {
  const { goals = [], filters, setFilters } = useGoals();
  const { categories } = useCustomization();
  const all: Goal[] = goals;

  const counts = useMemo(() => {
    return all.reduce(
      (acc, goal) => {
        acc.total += 1;
        acc.status[goal.status] += 1;
        acc.categories[goal.category] = (acc.categories[goal.category] ?? 0) + 1;
        acc.priorities[goal.priority] += 1;
        return acc;
      },
      {
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
      }
    );
  }, [all]);

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

      {/* Compact stats */}
      <div className="filters__stats" role="group" aria-label="Goal statistics">
        <div className="filters__stat filters__stat--total">
          <span className="filters__stat-label">Total</span>
          <span className="filters__stat-value">{counts.total}</span>
        </div>
        <div className="filters__stat-grid">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              className={[
                "filters__stat",
                "filters__stat--status",
                filters.statuses?.has(status) ? "is-active" : "",
                `filters__stat--${status.replace("in-progress", "inprog")}`,
              ].join(" ")}
              onClick={() => toggleStatus(status)}
              aria-pressed={filters.statuses?.has(status) ?? false}
            >
              <span className="filters__stat-label">
                {status === "in-progress" ? "In progress" : status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              <span className="filters__stat-value">{counts.status[status]}</span>
            </button>
          ))}
        </div>
      </div>

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

      <div className="filters__section filters__integrations">
        <div className="filters__integrations-card">
          <p className="filters__integrations-title">Notifications & calendar</p>
          <p className="filters__integrations-copy">
            Manage email nudges and calendar sync from the customization panel next to the timeline.
          </p>
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
