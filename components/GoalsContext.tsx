"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Priority = "low" | "medium" | "high" | "critical";
export type Status = "open" | "in-progress" | "blocked" | "done";

export interface Goal {
  id: string;
  title: string;
  start: string; // YYYY-MM-DD
  due: string;   // YYYY-MM-DD
  priority: Priority;
  status: Status;
  category?: "STRATEGY" | "VISION" | "TACTICAL" | "PROJECT" | "DAILY";
}

interface GoalsContextType {
  goals: Goal[];
  createGoal: (g: Omit<Goal, "id">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

const STORAGE_KEY = "goals_v1";

function load(): Goal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function save(goals: Goal[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch {}
}

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    setGoals(load());
  }, []);

  useEffect(() => {
    save(goals);
  }, [goals]);

  const api = useMemo<GoalsContextType>(() => {
    return {
      goals,
      createGoal: (g) =>
        setGoals((prev) => [
          ...prev,
          { ...g, id: Math.random().toString(36).slice(2) },
        ]),
      updateGoal: (id, patch) =>
        setGoals((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),
      deleteGoal: (id) => setGoals((prev) => prev.filter((x) => x.id !== id)),
    };
  }, [goals]);

  return <GoalsContext.Provider value={api}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("useGoals must be used inside GoalsProvider");
  return ctx;
}
