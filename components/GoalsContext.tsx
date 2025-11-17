"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { showToast } from "./Toast";

export type Priority = "low" | "medium" | "high" | "critical";
export type Status = "open" | "in-progress" | "blocked" | "done";
export type Category = string; // Now dynamic, can be any string

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

export type GoalComment = {
  id: string;
  body: string;
  createdAt: string;
};

type AddCommentInput = {
  id?: string;
  body: string;
  createdAt?: string;
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
  comments: GoalComment[];
};

const STORAGE_KEY = "focusone_goals_v1";

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
  addComment(goalId: string, input: AddCommentInput): void;
  updateComment(goalId: string, commentId: string, body: string): void;
  deleteComment(goalId: string, commentId: string): void;
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
    comments: [],
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
    comments: [],
  },
];

type RawGoal = Partial<Goal> & Record<string, unknown>;

function sanitizeComments(input: unknown): GoalComment[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const data = item as Partial<GoalComment>;
      const body = typeof data.body === "string" ? data.body.trim() : "";
      if (!body) return null;
      return {
        id: typeof data.id === "string" ? data.id : crypto.randomUUID(),
        body,
        createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
      };
    })
    .filter((entry): entry is GoalComment => Boolean(entry));
}

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
    comments: sanitizeComments(goalInput.comments),
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

// Convert database fields (snake_case) to frontend fields (camelCase)
function dbGoalToFrontend(dbGoal: any): Goal {
  const comments = (dbGoal.comments || []).map((c: any) => ({
    id: c.id,
    body: c.text,
    createdAt: c.timestamp || c.created_at,
  }));

  return sanitizeGoal({
    id: dbGoal.id,
    title: dbGoal.title,
    startDate: dbGoal.start_date,
    endDate: dbGoal.end_date,
    category: dbGoal.category,
    priority: dbGoal.priority,
    status: dbGoal.status,
    notes: dbGoal.notes,
    milestone: dbGoal.milestone,
    comments,
  });
}

// Fallback to localStorage for guest/unauthenticated mode
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
    window.dispatchEvent(new Event("goals-updated"));
  } catch {}
}

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [goals, setGoals] = useState<Goal[]>(() => load());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    categories: null,
    priorities: null,
    statuses: null,
    query: "",
  });

  // Fetch goals from API when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchGoals();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [isAuthenticated, status]);

  // Persist to localStorage for unauthenticated users
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      persist(goals);
    }
  }, [goals, isAuthenticated, loading]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/goals");
      if (response.ok) {
        const data = await response.json();
        const frontendGoals = (data.goals || []).map(dbGoalToFrontend);
        setGoals(frontendGoals);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const visibleGoals = useMemo(() => {
    let arr = goals.slice();
    if (filters.categories && filters.categories.size > 0) {
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

  const addGoal = async (g: Omit<Goal, "id">) => {
    if (isAuthenticated) {
      try {
        const response = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: g.title,
            startDate: g.startDate,
            endDate: g.endDate,
            category: g.category,
            priority: g.priority,
            status: g.status,
            notes: g.notes,
            milestone: g.milestone,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          const newGoal = dbGoalToFrontend(data.goal);
          setGoals((s) => [...s, newGoal]);
          showToast("Goal created successfully!", "success");
        } else {
          showToast("Failed to create goal", "error");
        }
      } catch (error) {
        console.error("Error adding goal:", error);
        showToast("Failed to create goal", "error");
      }
    } else {
      setGoals((s) => [...s, sanitizeGoal({ ...g, id: crypto.randomUUID() })]);
      showToast("Goal created!", "success");
    }
  };

  const updateGoal = async (g: Goal) => {
    if (isAuthenticated) {
      try {
        const response = await fetch(`/api/goals/${g.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: g.title,
            startDate: g.startDate,
            endDate: g.endDate,
            category: g.category,
            priority: g.priority,
            status: g.status,
            notes: g.notes,
            milestone: g.milestone,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          const updatedGoal = dbGoalToFrontend(data.goal);
          setGoals((s) => s.map((x) => (x.id === g.id ? updatedGoal : x)));
          showToast("Goal updated!", "success");
        } else {
          showToast("Failed to update goal", "error");
        }
      } catch (error) {
        console.error("Error updating goal:", error);
        showToast("Failed to update goal", "error");
      }
    } else {
      setGoals((s) => s.map((x) => (x.id === g.id ? sanitizeGoal(g) : x)));
      showToast("Goal updated!", "success");
    }
  };

  const deleteGoal = async (id: string) => {
    if (isAuthenticated) {
      try {
        const response = await fetch(`/api/goals/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setGoals((s) => s.filter((x) => x.id !== id));
          showToast("Goal deleted", "info");
        } else {
          showToast("Failed to delete goal", "error");
        }
      } catch (error) {
        console.error("Error deleting goal:", error);
        showToast("Failed to delete goal", "error");
      }
    } else {
      setGoals((s) => s.filter((x) => x.id !== id));
      showToast("Goal deleted", "info");
    }
  };

  const addComment = async (goalId: string, input: AddCommentInput) => {
    const trimmed = input.body.trim();
    if (!trimmed) return;

    if (isAuthenticated) {
      try {
        const response = await fetch(`/api/goals/${goalId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        });
        if (response.ok) {
          const data = await response.json();
          const newComment = {
            id: data.comment.id,
            body: data.comment.text,
            createdAt: data.comment.timestamp,
          };
          setGoals((s) =>
            s.map((goal) =>
              goal.id === goalId ? { ...goal, comments: [...goal.comments, newComment] } : goal
            )
          );
        }
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    } else {
      setGoals((s) =>
        s.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                comments: [
                  ...goal.comments,
                  {
                    id: input.id ?? crypto.randomUUID(),
                    body: trimmed,
                    createdAt: input.createdAt ?? new Date().toISOString(),
                  },
                ],
              }
            : goal
        )
      );
    }
  };

  const updateComment = async (goalId: string, commentId: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;

    // Note: API doesn't support comment updates yet, fallback to local only
    setGoals((s) =>
      s.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              comments: goal.comments.map((comment) =>
                comment.id === commentId ? { ...comment, body: trimmed } : comment
              ),
            }
          : goal
      )
    );
  };

  const deleteComment = async (goalId: string, commentId: string) => {
    if (isAuthenticated) {
      try {
        const response = await fetch(`/api/goals/${goalId}/comments/${commentId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setGoals((s) =>
            s.map((goal) =>
              goal.id === goalId
                ? { ...goal, comments: goal.comments.filter((comment) => comment.id !== commentId) }
                : goal
            )
          );
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    } else {
      setGoals((s) =>
        s.map((goal) =>
          goal.id === goalId ? { ...goal, comments: goal.comments.filter((comment) => comment.id !== commentId) } : goal
        )
      );
    }
  };

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
    addComment,
    updateComment,
    deleteComment,
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
