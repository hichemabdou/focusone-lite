"use client";

import { Goal, Priority, Category } from "./GoalsContext";
import { DomainMode } from "./FilterBar";
import { useMemo } from "react";

const PRI: Record<Priority, string> = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  critical: "bg-rose-500",
};
const CATS: Category[] = ["STRATEGY", "VISION", "TACTICAL", "PROJECT", "DAILY"];

const LABEL_COL_PX = 120;
const MONTH_PX = 96;
const ROW_H = 42;

const mkey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

function monthsFor(goals: Goal[], mode: DomainMode) {
  if (mode === "this-year") {
    const y = new Date().getFullYear();
    const arr: { key: string; label: string }[] = [];
    for (let m = 0; m < 12; m++) {
      const d = new Date(y, m, 1);
      arr.push({ key: mkey(d), label: d.toLocaleString(undefined, { month: "short" }) });
    }
    return arr;
  }
  if (goals.length === 0) {
    const now = new Date();
    const y = now.getFullYear();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(y, i, 1);
      return { key: mkey(d), label: d.toLocaleString(undefined, { month: "short" }) };
    });
  }
  const min = new Date(Math.min(...goals.map(g => new Date(g.start).getTime())));
  const max = new Date(Math.max(...goals.map(g => new Date(g.due).getTime())));
  const start = new Date(min.getFullYear(), min.getMonth(), 1);
  const end = new Date(max.getFullYear(), max.getMonth(), 1);
  const res: { key: string; label: string }[] = [];
  const it = new Date(start);
  while (it <= end) {
    res.push({ key: mkey(it), label: it.toLocaleString(undefined, { month: "short" }) });
    it.setMonth(it.getMonth() + 1);
  }
  return res;
}

export default function Timeline({ goals, mode }: { goals: Goal[]; mode: DomainMode }) {
  const months = useMemo(() => monthsFor(goals, mode), [goals, mode]);
  const todayIdx = useMemo(() => {
    const k = mkey(new Date());
    return months.findIndex((m) => m.key === k);
  }, [months]);

  const colTemplate = `${LABEL_COL_PX}px repeat(${months.length}, ${MONTH_PX}px)`;

  const colIndexFor = (iso: string) => {
    const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
    const k = mkey(d);
    const idx = months.findIndex((m) => m.key === k);
    return idx < 0 ? null : idx + 2; // +1 for grid (starts at 1), +1 for label col
  };

  return (
    <div className="relative rounded-2xl bg-neutral-800 p-3 text-neutral-200">
      {/* Months header */}
      <div className="grid border-b border-white/10" style={{ gridTemplateColumns: colTemplate }}>
        <div className="h-7" />
        {months.map((m) => (
          <div key={m.key} className="h-7 py-1 text-center text-xs font-medium opacity-80">
            {m.label}
          </div>
        ))}
      </div>

      {/* Body rows */}
      <div className="mt-2 grid gap-0" style={{ gridTemplateColumns: colTemplate }}>
        {CATS.map((cat, ri) => (
          <>
            <div key={`${cat}-label`} className="flex h-[42px] items-center pl-2 text-xs font-medium opacity-80">
              {cat}
            </div>
            {months.map((m, ci) => (
              <div
                key={`${cat}-${m.key}`}
                className={`h-[42px] border-l border-white/10 ${ci === months.length - 1 ? "border-r" : ""} border-white/10`}
              />
            ))}
            {/* Bars for this row */}
            {goals.filter(g => g.category === cat).map(g => {
              const start = colIndexFor(g.start);
              const end = colIndexFor(g.due);
              if (!start || !end) return null;
              const span = Math.max(1, end - start + 1);
              const done = g.status === "done";
              const overdue = !done && new Date(g.due) < new Date();

              return (
                <div
                  key={g.id}
                  className="pointer-events-none col-start-[1] col-end-[-1] row-start-[auto] relative"
                  style={{ gridColumn: `${start} / span ${span}`, gridRowStart: ri + 2 }} // +1 header row
                >
                  <div
                    className={`h-6 rounded-full ${PRI[g.priority]} ${done ? "opacity-60" : ""} ${overdue ? "ring-2 ring-rose-400" : ""}`}
                    title={`${g.title} • ${g.priority} • ${g.status}`}
                  />
                  <div className="absolute inset-0 flex items-center px-2 text-[11px] font-medium truncate">
                    {g.title}
                  </div>
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* Today marker */}
      {todayIdx >= 0 && (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            top: 28, // header height
            bottom: 12,
            left: LABEL_COL_PX + todayIdx * MONTH_PX + MONTH_PX / 2,
          }}
        >
          <div className="absolute -top-3 -translate-x-1/2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-neutral-900 shadow">
            Today
          </div>
          <div className="absolute top-3 bottom-0 -translate-x-1/2 w-px bg-white/70" />
        </div>
      )}
    </div>
  );
}
