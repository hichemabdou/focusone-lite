"use client";

import { CATEGORY_COLORS, Category, Priority, Status, useGoals } from "./GoalsContext";
import { useMemo } from "react";

const CATEGORY_LABELS: Record<Category, string> = {
  STRATEGY: "Strategy",
  VISION: "Vision",
  TACTICAL: "Tactical",
  PROJECT: "Project",
  DAILY: "Daily",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Done",
};

const CATEGORY_ORDER: Category[] = ["STRATEGY", "VISION", "TACTICAL", "PROJECT", "DAILY"];
const PRIORITY_ORDER: Priority[] = ["low", "medium", "high", "critical"];
const STATUS_ORDER: Status[] = ["open", "in-progress", "blocked", "done"];

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-white text-neutral-900 shadow-sm"
          : "bg-white/10 text-white/80 ring-1 ring-white/10 hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function GoalFilters() {
  const { filters, setFilters, goals } = useGoals();

  const totals = useMemo(() => {
    const now = new Date();
    const active = goals.filter((g) => new Date(g.endDate) >= now).length;
    const completed = goals.filter((g) => g.status === "done").length;
    return { total: goals.length, active, completed };
  }, [goals]);

  const toggle = <T extends Category | Priority | Status>(
    field: "categories" | "priorities" | "statuses",
    value: T,
    all: readonly T[],
  ) => {
    setFilters((prev) => {
      const current = prev[field] ? new Set(prev[field] as Set<T>) : new Set(all);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      if (current.size === all.length) {
        return { ...prev, [field]: null };
      }
      return { ...prev, [field]: current };
    });
  };

  const reset = () =>
    setFilters((prev) => ({ ...prev, categories: null, priorities: null, statuses: null, query: "" }));

  const isActive = <T extends Category | Priority | Status>(
    field: "categories" | "priorities" | "statuses",
    value: T,
    all: readonly T[],
  ) => {
    const set = filters[field] as Set<T> | null;
    if (!set) return true;
    if (set.size === all.length) return true;
    return set.has(value);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_60px_-45px_rgba(15,15,25,0.8)]">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Your goal control centre</h2>
          <p className="text-sm text-white/60">
            Filter by horizon, urgency, or progress to tailor the timeline to exactly what you want to see.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/60">
          {totals.total === 0 ? "No goals yet" : `${totals.total} total • ${totals.active} active • ${totals.completed} done`}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Section title="Focus categories">
            {CATEGORY_ORDER.map((category) => (
              <PillButton
                key={category}
                active={isActive("categories", category, CATEGORY_ORDER)}
                onClick={() => toggle("categories", category, CATEGORY_ORDER)}
              >
                <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${CATEGORY_COLORS[category]}`} />
                {CATEGORY_LABELS[category]}
              </PillButton>
            ))}
          </Section>
          <Section title="Priority">
            {PRIORITY_ORDER.map((priority) => (
              <PillButton
                key={priority}
                active={isActive("priorities", priority, PRIORITY_ORDER)}
                onClick={() => toggle("priorities", priority, PRIORITY_ORDER)}
              >
                {PRIORITY_LABELS[priority]}
              </PillButton>
            ))}
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Status">
            {STATUS_ORDER.map((status) => (
              <PillButton
                key={status}
                active={isActive("statuses", status, STATUS_ORDER)}
                onClick={() => toggle("statuses", status, STATUS_ORDER)}
              >
                {STATUS_LABELS[status]}
              </PillButton>
            ))}
          </Section>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Quick search</p>
            <div className="flex gap-2">
              <input
                value={filters.query}
                onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
                placeholder="Find a goal by title or notes"
                className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <button
                type="button"
                onClick={reset}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/20"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
