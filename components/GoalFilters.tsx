"use client";

import { useEffect, useMemo, useState } from "react";
import { Goal, useGoals } from "./GoalsContext";

type Cat = "STRATEGY" | "VISION" | "TACTICAL" | "PROJECT" | "DAILY";
type Pri = "low" | "medium" | "high" | "critical";
type St  = "open" | "in-progress" | "blocked" | "done";

const CATEGORIES: Cat[] = ["STRATEGY", "VISION", "TACTICAL", "PROJECT", "DAILY"];
const PRIORITIES: Pri[] = ["low", "medium", "high", "critical"];
const STATUSES: St[]     = ["open", "in-progress", "blocked", "done"];

export default function GoalFilters() {
  const api = useGoals() as any; // use `any` so we can safely call optional context functions
  const all: Goal[] = (api.goals ?? []) as Goal[];

  // ----- local filter state (mirrors your previous controls) -----
  const [cats, setCats] = useState<Set<Cat>>(new Set());
  const [pris, setPris] = useState<Set<Pri>>(new Set());
  const [sts,  setSts]  = useState<Set<St>>(new Set());
  const [q, setQ] = useState("");

  // compute counts for the header strip
  const counts = useMemo(() => {
    const open = all.filter(g => g.status === "open").length;
    const done = all.filter(g => g.status === "done").length;
    const inprog = all.length - done;
    return { total: all.length, active: inprog, done };
  }, [all]);

  // apply filters → push to context if available (so Timeline & Library update)
  useEffect(() => {
    const text = q.trim().toLowerCase();
    const filtered = all.filter(g => {
      if (cats.size && !cats.has(g.category as Cat)) return false;
      if (pris.size && !pris.has(g.priority as Pri)) return false;
      if (sts.size  && !sts.has(g.status as St)) return false;
      if (text) {
        const hay = `${g.title} ${g.notes ?? ""}`.toLowerCase();
        if (!hay.includes(text)) return false;
      }
      return true;
    });
    api.setVisibleGoals?.(filtered); // optional; falls back gracefully if not present
  }, [all, cats, pris, sts, q, api]);

  const toggle = <T,>(set: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) =>
    set(prev => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });

  const reset = () => {
    setCats(new Set()); setPris(new Set()); setSts(new Set()); setQ("");
    api.setVisibleGoals?.(all);
  };

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
        active ? "chip--on" : "",
        className,
      ].join(" ")}
      onClick={onClick}
    >
      {children}
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
        <div className="stats-strip__item">
          <span className="dot dot--total" />
          <span className="stats-strip__label">Total</span>
          <span className="stats-strip__value">{counts.total}</span>
        </div>
        <div className="stats-strip__item">
          <span className="dot dot--active" />
          <span className="stats-strip__label">Active</span>
          <span className="stats-strip__value">{counts.active}</span>
        </div>
        <div className="stats-strip__item">
          <span className="dot dot--done" />
          <span className="stats-strip__label">Done</span>
          <span className="stats-strip__value">{counts.done}</span>
        </div>
      </div>

      {/* Categories */}
      <div className="filters__section">
        <div className="eyebrow">Focus categories</div>
        <div className="filters__chips">
          {CATEGORIES.map(c => (
            <Chip
              key={c}
              active={cats.has(c)}
              onClick={() => toggle(setCats, c)}
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
              active={pris.has(p)}
              onClick={() => toggle(setPris, p)}
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
              active={sts.has(s)}
              onClick={() => toggle(setSts, s)}
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
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="button" className="btn" onClick={reset}>Reset</button>
        </div>
      </div>
    </div>
  );
}
