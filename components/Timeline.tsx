"use client";

import { useMemo } from "react";
import { useGoals, Goal, Priority } from "./GoalsContext";

const PRI_COLOR: Record<Priority, string> = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  critical: "bg-rose-500",
};

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

function monthsBetween(goals: Goal[]) {
  if (goals.length === 0) {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 1);
    const arr: { key: string; label: string }[] = [];
    const iter = new Date(start);
    while (iter <= end) {
      arr.push({ key: monthKey(iter), label: iter.toLocaleString(undefined, { month: "short" }) });
      iter.setMonth(iter.getMonth() + 1);
    }
    return arr;
  }

  const starts = goals.map((g) => new Date(g.start));
  const ends = goals.map((g) => new Date(g.due));
  const min = new Date(Math.min(...starts.map((d) => d.getTime())));
  const max = new Date(Math.max(...ends.map((d) => d.getTime())));

  const arr: { key: string; label: string }[] = [];
  const iter = new Date(min.getFullYear(), min.getMonth(), 1);
  const last = new Date(max.getFullYear(), max.getMonth(), 1);
  while (iter <= last) {
    arr.push({ key: monthKey(iter), label: iter.toLocaleString(undefined, { month: "short" }) });
    iter.setMonth(iter.getMonth() + 1);
  }
  return arr;
}

export default function Timeline() {
  const { goals } = useGoals();
  const months = useMemo(() => monthsBetween(goals), [goals]);
  const monthWidth = 96;

  const indexOf = (iso: string) => {
    const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
    const k = monthKey(d);
    return months.findIndex((m) => m.key === k);
  };

  const todayIdx = useMemo(() => {
    const k = monthKey(new Date());
    return months.findIndex((m) => m.key === k);
  }, [months]);

  return (
    <div className="relative rounded-2xl bg-neutral-800 p-3 text-neutral-200">
      {/* Header months */}
      <div
        className="grid border-b border-white/10"
        style={{ gridTemplateColumns: `repeat(${months.length}, ${monthWidth}px)` }}
      >
        {months.map((m) => (
          <div key={m.key} className="py-1 text-center text-xs font-medium opacity-80">
            {m.label}
          </div>
        ))}
      </div>

      {/* Today marker */}
      {todayIdx >= 0 && (
        <div
          className="pointer-events-none absolute inset-y-0 z-20"
          style={{ left: todayIdx * monthWidth + monthWidth / 2 }}
        >
          <div className="absolute top-1 -translate-x-1/2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-neutral-900 shadow">
            Today
          </div>
          <div className="absolute top-6 bottom-2 -translate-x-1/2 w-px bg-white/60" />
        </div>
      )}

      {/* Rows */}
      <div className="relative mt-2">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${months.length}, ${monthWidth}px)` }}
        >
          {goals.map((g) => {
            const a = indexOf(g.start);
            const b = indexOf(g.due);
            if (a < 0 || b < 0) return null;
            const left = a * monthWidth + 8;
            const width = Math.max(1, b - a + 1) * monthWidth - 16;
            const done = g.status === "done";
            const overdue = !done && new Date(g.due) < new Date();

            return (
              <div key={g.id} className="relative h-10">
                <div
                  className={`absolute top-2 h-6 rounded-full ${PRI_COLOR[g.priority]} ${done ? "opacity-60" : ""} ${
                    overdue ? "ring-2 ring-rose-400" : ""
                  }`}
                  style={{ left, width }}
                  title={`${g.title} • ${g.priority} • ${g.status}`}
                />
                <div className="absolute left-2 top-2 text-[11px] font-medium truncate max-w-[220px]">
                  {g.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
