"use client";

import { Goal } from "./GoalsContext";

const toISO = (date: Date) => date.toISOString().slice(0, 10);

export function createDefaultGoal(): Omit<Goal, "id"> {
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + 30);
  return {
    title: "",
    notes: "",
    category: "PROJECT",
    priority: "medium",
    status: "open",
    startDate: toISO(today),
    endDate: toISO(end),
    milestone: null,
  };
}

export function ensureMilestoneDraft(
  milestone: Goal["milestone"] | null | undefined,
  fallbackDate: string,
  type: "point" | "window" = "point"
): Goal["milestone"] {
  if (milestone) return milestone;
  if (type === "window") {
    return {
      id: crypto.randomUUID(),
      label: "",
      type: "window",
      windowStart: fallbackDate,
      windowEnd: fallbackDate,
    };
  }
  return {
    id: crypto.randomUUID(),
    label: "",
    type: "point",
    date: fallbackDate,
  };
}

export function normalizeMilestoneDraft(
  input: Goal["milestone"] | null | undefined,
  fallbackDate: string
): Goal["milestone"] | null {
  if (!input) return null;
  if (input.type === "window") {
    const label = input.label?.trim() ?? "";
    const start = input.windowStart ?? fallbackDate;
    const end = input.windowEnd ?? start;
    if (!label && !input.windowStart && !input.windowEnd) return null;
    const [windowStart, windowEnd] = start <= end ? [start, end] : [end, start];
    return {
      id: input.id ?? crypto.randomUUID(),
      type: "window",
      label: label || "Milestone window",
      windowStart,
      windowEnd,
      color: input.color,
    };
  }

  const label = input.label?.trim() ?? "";
  const date = input.date ?? fallbackDate;
  if (!label && !input.date) return null;
  return {
    id: input.id ?? crypto.randomUUID(),
    type: "point",
    label: label || "Milestone",
    date,
    color: input.color,
  };
}
