"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Category = "STRATEGY" | "VISION" | "TACTICAL" | "PROJECT" | "DAILY";
export type Priority = "low" | "medium" | "high" | "critical";
export type Status = "open" | "in-progress" | "blocked" | "done";

export type Goal = {
  id: string;
  title: string;
  start: string; // YYYY-MM-DD
  due: string;   // YYYY-MM-DD
  category: Category;
  priority: Priority;
  status: Status;
  notes?: string;
};

type Ctx = {
  goals: Goal[];
  add: (g: Omit<Goal, "id">) => void;
  update: (id: string, patch: Partial<Goal>) => void;
  remove: (id: string) => void;
  importMany: (arr: Goal[]) => void;
  exportJson: () => string;
};

const GoalsCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "focusone-goals-v2";

const SAMPLE: Goal[] = [
  {
    id: "g1",
    title: "Define Life Vision",
    start: "2025-01-10",
    due:   "2025-02-28",
    category: "STRATEGY",
    priority: "high",
    status: "open",
  },
  {
    id: "g2",
    title: "A2 German Course",
    start: "2025-03-01",
    due:   "2025-04-15",
    category: "TACTICAL",
    priority: "critical",
    status: "open",
  },
  {
    id: "g3",
    title: "Daily German 20m",
    start: "2025-11-01",
    due:   "2026-02-01",
    category: "DAILY",
    priority: "medium",
    status: "in-progress",
  },
];

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);

  // load from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Goal[];
        setGoals(Array.isArray(parsed) ? parsed : SAMPLE);
      } else {
        setGoals(SAMPLE);
      }
    } catch {
      setGoals(SAMPLE);
    }
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch {}
  }, [goals]);

  const api = useMemo<Ctx>(() => ({
    goals,
    add: (g) =>
      setGoals((prev) => [
        ...prev,
        { ...g, id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) },
      ]),
    update: (id, patch) =>
      setGoals((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    remove: (id) => setGoals((prev) => prev.filter((x) => x.id !== id)),
    importMany: (arr) => setGoals(arr),
    exportJson: () => JSON.stringify(goals, null, 2),
  }), [goals]);

  return <GoalsCtx.Provider value={api}>{children}</GoalsCtx.Provider>;
}

export function useGoals() {
  const ctx = useContext(GoalsCtx);
  if (!ctx) throw new Error("useGoals must be inside GoalsProvider");
  return ctx;
}
