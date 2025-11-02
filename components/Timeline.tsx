"use client";

import { useMemo } from "react";
import { useGoals, Goal, Priority, Category } from "./GoalsContext";

const PRI_COLOR: Record<Priority, string> = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  critical: "bg-rose-500",
};

const CATEGORIES: Category[] = ["STRATEGY", "VISION", "TACTICAL", "PROJECT", "DAILY"];
const LABEL_WIDTH = 120;     // left label column (px)
const MONTH_WIDTH = 96;      // width per month column
const ROW_H = 42;            // height per lane row
const HEADER_H = 28;

const mkey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

function buildMonths(goals: Goal[]) {
  if (goals.length === 0) {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 1);
    const arr: { key: string; label: string }[] = [];
    const it = new Date(start);
    while (it <= end) {
      arr.push({ key: mkey(it), label: it.toLocaleString(undefined, { month: "short" }) });
      it.setMonth(it.getMonth() + 1);
    }
    return arr;
  }

  const min = new Date(Math.min(...goals.map((g) => new Date(g.start).getTime())));
  const max = new Date(Math.max(...goals.map((g) => new Date(g.due).getTime())));
  const start = new Date(min.getFullYear(), 0, 1);
  const end = new Date(max.getFullYear(), 11, 1);

  const arr: { key: string; label: string }[] = [];
  const it = new Date(start);
  while (it <= end) {
    arr.push({ key: mkey(it), label: it.toLocaleString(undefined, { month: "short" }) });
    it.setMonth(it.getMonth() + 1);
  }
  return arr;
}

export default function Timeline() {
  const { goals } = useGoals();
  const months = useMemo(() => buildMonths(goals), [goals]);

  const indexOfMonth = (iso: string) => {
    const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
    const k = mkey(d);
    return months.findIndex((m) => m.key === k);
  };

  const todayIdx = useMemo(() => {
    const k = mkey(new Date());
    return months.findIndex((m) => m.key === k);
  }, [months]);

  return (
    <div className="relative rounded-2xl bg-neutral-800 p-3 text-neutral-200" style={{ paddingLeft: LABEL_WIDTH }}>
      {/* Left category labels */}
      <div className="absolute left-3 top-[44px] select-none">
        {CATEGORIES.map((c, i) => (
          <div key={c} className="h-[42px] flex items-center text-xs font-medium opacity-80">{c}</div>
        ))}
      </div>

      {/* Header months */}
      <div
        className="grid border-b border-white/10"
        style={{ gridTemplateColumns: `repeat(${months.length}, ${MONTH_WIDTH}px)` }}
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
          className="pointer-events-none absolute z-20"
          style={{ top: HEADER_H, bottom: 12, left: LABEL_WIDTH + todayIdx * MONTH_WIDTH + MONTH_WIDTH / 2 }}
        >
          <div className="absolute -top-3 -translate-x-1/2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-neutral-900 shadow">
            Today
          </div>
          <div className="absolute top-3 bottom-0 -translate-x-1/2 w-px bg-white/60" />
        </div>
      )}

      {/* Grid body (rows x months) */}
      <div
        className="relative mt-2"
        style={{
          height: ROW_H * CATEGORIES.length,
          backgroundImage: `linear-gradient(to bottom, transparent 41px, rgba(255,255,255,0.07) 41px),
                            linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: `100% ${ROW_H}px, ${MONTH_WIDTH}px 100%`,
          backgroundPosition: `0 ${HEADER_H}px, ${LABEL_WIDTH}px 0`,
          backgroundRepeat: "repeat",
        }}
      >
        {/* Bars */}
        {goals.map((g) => {
          const row = CATEGORIES.indexOf(g.category ?? "PROJECT");
          if (row < 0) return null;
          const a = indexOfMonth(g.start);
          const b = indexOfMonth(g.due);
          if (a < 0 || b < 0) return null;

          const left = LABEL_WIDTH + a * MONTH_WIDTH + 8;
          const width = Math.max(1, b - a + 1) * MONTH_WIDTH - 16;
          const top = HEADER_H + row * ROW_H + 8;

          const done = g.status === "done";
          const overdue = !done && new Date(g.due) < new Date();

          return (
            <div key={g.id} className="absolute" style={{ top, left, width, height: 26 }}>
              <div
                className={`h-full rounded-full ${PRI_COLOR[g.priority]} ${done ? "opacity-60" : ""} ${
                  overdue ? "ring-2 ring-rose-400" : ""
                }`}
                title={`${g.title} • ${g.priority} • ${g.status}`}
              />
              <div className="absolute inset-0 px-2 text-[11px] font-medium flex items-center truncate">
                {g.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
