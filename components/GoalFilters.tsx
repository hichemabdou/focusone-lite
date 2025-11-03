"use client";

import { useMemo } from "react";
import { Goal, useGoals } from "./GoalsContext";

type Cat = "STRATEGY" | "VISION" | "TACTICAL" | "PROJECT" | "DAILY";
type Pri = "low" | "medium" | "high" | "critical";
type St  = "open" | "in-progress" | "blocked" | "done";
type StatChip = "total" | "active" | "done";

const CATEGORIES: Cat[] = ["STRATEGY", "VISION", "TACTICAL", "PROJECT", "DAILY"];
const PRIORITIES: Pri[] = ["low", "medium", "high", "critical"];
const STATUSES: St[]     = ["open", "in-progress", "blocked", "done"];

export default function GoalFilters() {
  const { goals = [], filters, setFilters } = useGoals();
  const all: Goal[] = goals;

  const counts = useMemo(() => {
    const done = all.filter((g) => g.status === "done").length;
    const active = all.length - done;
    return { total: all.length, active, done };
  }, [all]);

  const activeStatChip: StatChip | null = useMemo(() => {
    const statuses = filters.statuses;
    if (!statuses || statuses.size === 0) return "total";
    const isDoneOnly = statuses.size === 1 && statuses.has("done");
    if (isDoneOnly) return "done";

    const activeSet: Set<St> = new Set(["open", "in-progress", "blocked"]);
    if (statuses.size === activeSet.size && [...activeSet].every((s) => statuses.has(s))) {
      return "active";
    }
    return null;
  }, [filters.statuses]);

  const applyStatChip = (chip: StatChip) => {
    setFilters((prev) => {
      if (chip === "total") {
        return { ...prev, statuses: null };
      }

      if (chip === "active") {
        const target = new Set<St>(["open", "in-progress", "blocked"]);
        const alreadyActive =
          prev.statuses?.size === target.size && [...target].every((s) => prev.statuses?.has(s));
        return { ...prev, statuses: alreadyActive ? null : target };
      }

      if (chip === "done") {
        const alreadyDone = prev.statuses?.size === 1 && prev.statuses.has("done");
        return { ...prev, statuses: alreadyDone ? null : new Set<St>(["done"]) };
      }

      return prev;
    });
  };

  const toggleCategory = (value: Cat) => {
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
  }: { active?: boolean; onClick?: () => void; children: React.ReactNode; className?: string }) => (
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
      </span>
    </button>
  );

  return (
    <div className="filters">
      {/* Title & description */}
      <div className="filters__header">
        <h2 className="filters__title">Your goal control centre</h2>
        <p className="filters__subtitle">
          Filter by horizon, urgency, or progress to tailor the timeline to exactly what you want to see.
        </p>
      </div>

      {/* Elegant stats strip */}
      <div className="stats-strip" role="group" aria-label="Goal statistics">
        <button
          type="button"
          className={[
            "stats-strip__item",
            "stats-strip__item--total",
            activeStatChip === "total" ? "is-active" : "",
          ].join(" ")}
          onClick={() => applyStatChip("total")}
          aria-pressed={activeStatChip === "total"}
        >
          <span className="dot dot--total" />
          <span className="stats-strip__label">Total</span>
          <span className="stats-strip__value">{counts.total}</span>
        </button>
        <button
          type="button"
          className={[
            "stats-strip__item",
            "stats-strip__item--active",
            activeStatChip === "active" ? "is-active" : "",
          ].join(" ")}
          onClick={() => applyStatChip("active")}
          aria-pressed={activeStatChip === "active"}
        >
          <span className="dot dot--active" />
          <span className="stats-strip__label">Active</span>
          <span className="stats-strip__value">{counts.active}</span>
        </button>
        <button
          type="button"
          className={[
            "stats-strip__item",
            "stats-strip__item--done",
            activeStatChip === "done" ? "is-active" : "",
          ].join(" ")}
          onClick={() => applyStatChip("done")}
          aria-pressed={activeStatChip === "done"}
        >
          <span className="dot dot--done" />
          <span className="stats-strip__label">Done</span>
          <span className="stats-strip__value">{counts.done}</span>
        </button>
      </div>

      {/* Categories */}
      <div className="filters__section">
        <div className="eyebrow">Focus categories</div>
        <div className="filters__chips">
          {CATEGORIES.map(c => (
            <Chip
              key={c}
              active={filters.categories?.has(c) ?? false}
              onClick={() => toggleCategory(c)}
              className={`chip--cat-${c.toLowerCase()}`}
            >
              {c.charAt(0) + c.slice(1).toLowerCase()}
            </Chip>
          ))}
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
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Chip>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="filters__section">
        <div className="eyebrow">Status</div>
        <div className="filters__chips">
          {STATUSES.map(s => (
            <Chip
              key={s}
              active={filters.statuses?.has(s) ?? false}
              onClick={() => toggleStatus(s)}
              className={`chip--st-${s.replace("in-progress", "inprog")}`}
            >
              {s === "in-progress" ? "In progress" : s.charAt(0).toUpperCase() + s.slice(1)}
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
