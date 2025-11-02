"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Priority = "low" | "medium" | "high" | "critical";
export type Status = "open" | "in-progress" | "blocked" | "done";
export type Category = "STRATEGY" | "VISION" | "TACTICAL" | "PROJECT" | "DAILY";

export type Goal = {
  id: string;
  title: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;   // ISO yyyy-mm-dd
  category: Category;
  priority: Priority;
  status: Status;
  notes?: string;
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
  },
  {
    id: "g2",
    title: "A2 German Course",
    startDate: "2025-11-02",
    endDate: "2026-02-07",
    category: "TACTICAL",
    priority: "critical",
    status: "open",
  },
];

function load(): Goal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return sample;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Goal[];
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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filters, setFilters] = useState<Filters>({
    categories: null,
    priorities: null,
    statuses: null,
    query: "",
  });

  useEffect(() => setGoals(load()), []);
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

  const addGoal = (g: Omit<Goal, "id">) => setGoals((s) => [...s, { ...g, id: crypto.randomUUID() }]);
  const updateGoal = (g: Goal) => setGoals((s) => s.map((x) => (x.id === g.id ? g : x)));
  const deleteGoal = (id: string) => setGoals((s) => s.filter((x) => x.id !== id));
  const importJson = (input: Goal[]) => setGoals(input ?? []);
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
