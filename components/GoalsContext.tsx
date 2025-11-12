"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Priority = "low" | "medium" | "high" | "critical";
export type Status = "open" | "in-progress" | "blocked" | "done";
export type Category = "STRATEGY" | "VISION" | "TACTICAL" | "PROJECT" | "DAILY";

export type Milestone =
  | {
      id: string;
      type: "point";
      label: string;
      date: string;
      color?: string;
    }
  | {
      id: string;
      type: "window";
      label: string;
      windowStart: string;
      windowEnd: string;
      color?: string;
    };

export type Goal = {
  id: string;
  title: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;   // ISO yyyy-mm-dd
  category: Category;
  priority: Priority;
  status: Status;
  notes?: string;
  milestone?: Milestone | null;
};

const STORAGE_KEY = "focusone_goals_v1";

// Category base color + Priority opacity logic
export const CATEGORY_COLORS: Record<Category, string> = {
  STRATEGY: "bg-cyan-500",
  VISION: "bg-amber-500",
  TACTICAL: "bg-sky-500",
  PROJECT: "bg-fuchsia-500",
  DAILY: "bg-emerald-500",
};
const CATEGORY_VALUES: Category[] = ["STRATEGY", "VISION", "TACTICAL", "PROJECT", "DAILY"];
export const PRIORITY_OPACITY: Record<Priority, string> = {
  low: "opacity-50",
  medium: "opacity-70",
  high: "opacity-90",
  critical: "opacity-100",
};
const PRIORITY_VALUES: Priority[] = ["low", "medium", "high", "critical"];
const STATUS_VALUES: Status[] = ["open", "in-progress", "blocked", "done"];

type Filters = {
  categories: Set<Category> | null; // null => all
  priorities: Set<Priority> | null; // null => all
  statuses: Set<Status> | null; // null => all
  query: string;
};

type Ctx = {
  goals: Goal[];
  visibleGoals: Goal[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  addGoal(g: Omit<Goal, "id">): void;
  updateGoal(g: Goal): void;
  deleteGoal(id: string): void;
  importJson(input: Goal[]): void;
  exportJson(): string;
};

const GoalsCtx = createContext<Ctx | null>(null);

// A couple of safe defaults so the timeline renders immediately
const sample: Goal[] = [
  {
    id: "g1",
    title: "Define Life Vision",
    startDate: "2025-11-01",
    endDate: "2025-12-15",
    category: "STRATEGY",
    priority: "medium",
    status: "open",
    milestone: {
      id: "m1",
      type: "point",
      label: "Draft manifesto",
      date: "2025-11-20",
    },
  },
  {
    id: "g2",
    title: "A2 German Course",
    startDate: "2025-11-02",
    endDate: "2026-02-07",
    category: "TACTICAL",
    priority: "critical",
    status: "open",
    milestone: null,
  },
];

type RawGoal = Partial<Goal> & Record<string, unknown>;

function sanitizeGoal(goalInput: RawGoal): Goal {
  const startDate = goalInput.startDate ?? goalInput.endDate ?? new Date().toISOString().slice(0, 10);
  const endDate = goalInput.endDate ?? goalInput.startDate ?? startDate;
  const normalizedMilestone = normalizeMilestone(goalInput.milestone, endDate);

  return {
    id: goalInput.id ?? crypto.randomUUID(),
    title: goalInput.title ?? "Untitled",
    startDate,
    endDate,
    category: goalInput.category ?? "PROJECT",
    priority: goalInput.priority ?? "medium",
    status: goalInput.status ?? "open",
    notes: goalInput.notes,
    milestone: normalizedMilestone,
  };
}

function normalizeMilestone(input: unknown, fallbackDate: string): Goal["milestone"] | null {
  if (!input) return null;
  const data = input as Partial<Milestone> & { date?: string; windowStart?: string; windowEnd?: string };

  if (data.type === "window") {
    const rawStart = data.windowStart ?? fallbackDate;
    const rawEnd = data.windowEnd ?? rawStart;
    const [windowStart, windowEnd] = rawStart <= rawEnd ? [rawStart, rawEnd] : [rawEnd, rawStart];
    return {
      id: data.id ?? crypto.randomUUID(),
      type: "window",
      label: data.label ?? "Milestone window",
      windowStart,
      windowEnd,
      color: data.color,
    };
  }

  const label = data.label ?? "Milestone";
  const date = data.date ?? fallbackDate;
  return {
    id: data.id ?? crypto.randomUUID(),
    type: "point",
    label,
    date,
    color: data.color,
  };
}

function load(): Goal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return sample;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((item) => sanitizeGoal(item as RawGoal));
  } catch {}
  return sample;
}

function persist(goals: Goal[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    // notify any listeners (timeline) that data changed
    window.dispatchEvent(new Event("goals-updated"));
  } catch {}
}

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>(() => load());
  const [filters, setFilters] = useState<Filters>({
    categories: null,
    priorities: null,
    statuses: null,
    query: "",
  });
  useEffect(() => persist(goals), [goals]);

  const visibleGoals = useMemo(() => {
    let arr = goals.slice();
    if (filters.categories && filters.categories.size > 0 && filters.categories.size < CATEGORY_VALUES.length) {
      arr = arr.filter((g) => filters.categories!.has(g.category));
    }
    if (filters.priorities && filters.priorities.size > 0 && filters.priorities.size < PRIORITY_VALUES.length) {
      arr = arr.filter((g) => filters.priorities!.has(g.priority));
    }
    if (filters.statuses && filters.statuses.size > 0 && filters.statuses.size < STATUS_VALUES.length) {
      arr = arr.filter((g) => filters.statuses!.has(g.status));
    }
    if (filters.query.trim()) {
      const q = filters.query.trim().toLowerCase();
      arr = arr.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.notes?.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
      );
    }
    arr.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate));
    return arr;
  }, [goals, filters]);

  const addGoal = (g: Omit<Goal, "id">) =>
    setGoals((s) => [...s, sanitizeGoal({ ...g, id: crypto.randomUUID() })]);
  const updateGoal = (g: Goal) => setGoals((s) => s.map((x) => (x.id === g.id ? sanitizeGoal(g) : x)));
  const deleteGoal = (id: string) => setGoals((s) => s.filter((x) => x.id !== id));
  const importJson = (input: Goal[]) => setGoals((input ?? []).map(sanitizeGoal));
  const exportJson = () => JSON.stringify(goals, null, 2);

  const value: Ctx = {
    goals,
    visibleGoals,
    filters,
    setFilters,
    addGoal,
    updateGoal,
    deleteGoal,
    importJson,
    exportJson,
  };

  return <GoalsCtx.Provider value={value}>{children}</GoalsCtx.Provider>;
}

export function useGoals() {
  const ctx = useContext(GoalsCtx);
  if (!ctx) throw new Error("useGoals must be inside GoalsProvider");
  return ctx;
}
