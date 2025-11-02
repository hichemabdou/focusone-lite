"use client";
import React, { useMemo, useEffect, useRef, useState } from "react";
import { Goal } from "@/types/goal";

// Color palette by priority
const PRI_COLOR = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  critical: "bg-rose-500",
} as const;

// Helper to format YYYY-MM for a given Date
const monthKeyFromDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

function parseISO(iso: string) {
  return new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
}

// Builds month span from earliest to latest goal
function monthSpan(fromISO: string, toISO: string) {
  const start = parseISO(fromISO);
  const end = parseISO(toISO);
  const months: { y: number; m: number; key: string }[] = [];
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (d <= last) {
    const y = d.getFullYear();
    const m = d.getMonth();
    months.push({ y, m, key: `${y}-${String(m + 1).padStart(2, "0")}` });
    d.setMonth(d.getMonth() + 1);
  }
  return months;
}

function yearQuarter(dateISO: string) {
  const d = parseISO(dateISO);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return { year: d.getFullYear(), quarter: q };
}

export default function Timeline({ goals }: { goals: Goal[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [monthWidth, setMonthWidth] = useState(72);

  // Determine full range (min start to max due)
  const domain = useMemo(() => {
    if (goals.length === 0) {
      const now = new Date();
      const from = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const to = new Date(now.getFullYear(), 11, 1).toISOString().slice(0, 10);
      return { months: monthSpan(from, to) };
    }
    const minStart = goals.map((g) => parseISO(g.startDate)).sort((a, b) => (a < b ? -1 : 1))[0];
    const maxDue = goals.map((g) => parseISO(g.dueDate)).sort((a, b) => (a > b ? -1 : 1))[0];
    const from = new Date(minStart.getFullYear(), 0, 1).toISOString().slice(0, 10);
    const to = new Date(maxDue.getFullYear(), 11, 1).toISOString().slice(0, 10);
    return { months: monthSpan(from, to) };
  }, [goals]);

  // Fit columns to container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const cols = domain.months.length;
      const w = el.clientWidth;
      const mw = Math.max(48, Math.floor(w / Math.max(cols, 1)));
      setMonthWidth(mw);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [domain.months.length]);

  function monthIndex(iso: string) {
    const k = `${parseISO(iso).getFullYear()}-${String(
      parseISO(iso).getMonth() + 1
    ).padStart(2, "0")}`;
    return domain.months.findIndex((m) => m.key === k);
  }

  function colSpan(fromISO: string, toISO: string) {
    const a = monthIndex(fromISO);
    const b = monthIndex(toISO);
    if (a === -1 || b === -1) return { start: 1, span: 1 };
    return { start: a + 1, span: Math.max(1, b - a + 1) };
  }

  // 🟢 New: “Today” marker index
  const todayIndex = useMemo(() => {
    const k = monthKeyFromDate(new Date());
    return domain.months.findIndex((m) => m.key === k);
  }, [domain.months]);

  return (
    <div className="grid gap-3">
      {/* Header */}
      <div ref={containerRef} className="overflow-hidden">
        <div
          className="relative"
          style={{ width: domain.months.length * monthWidth }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${domain.months.length}, ${monthWidth}px)`,
            }}
          >
            {domain.months.map((m) => {
              const month = m.m + 1;
              const label = month === 1 ? `${m.y}` : "";
              const q = Math.floor(m.m / 3) + 1;
              return (
                <div key={m.key} className="h-10 border-b border-white/10">
                  <div className="text-[10px] uppercase tracking-widest opacity-70">
                    {label}
                  </div>
                  <div className="text-xs opacity-60">Q{q}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        className="relative rounded-2xl border border-white/10 bg-white/5 overflow-auto"
        style={{ height: 360 }}
      >
        <div
          className="relative"
          style={{ width: domain.months.length * monthWidth }}
        >
          {/* Month stripes */}
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${domain.months.length}, ${monthWidth}px)`,
            }}
          >
            {domain.months.map((m) => (
              <div key={m.key} className="border-r border-white/5" />
            ))}
          </div>

          {/* 🟡 Today marker */}
          {todayIndex >= 0 && (
            <div
              className="pointer-events-none absolute inset-y-0 z-20"
              style={{
                left: todayIndex * monthWidth + monthWidth / 2,
              }}
            >
              <div className="absolute top-1 -translate-x-1/2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-neutral-900 shadow">
                Today
              </div>
              <div className="absolute top-6 bottom-2 -translate-x-1/2 w-px bg-white/60" />
            </div>
          )}

          {/* Goal rows */}
          <div className="relative divide-y divide-white/5">
            {goals.map((g) => {
              const { start, span } = colSpan(g.startDate, g.dueDate);
              const { quarter } = yearQuarter(g.dueDate);
              const color = PRI_COLOR[g.priority];
              const done = g.status === "done";
              const overdue = !done && parseISO(g.dueDate) < new Date();

              return (
                <div key={g.id} className="relative h-14 px-3">
                  <div className="absolute left-2 top-1 text-xs opacity-70 truncate max-w-[220px]">
                    {g.title}
                  </div>
                  <div
                    className={`absolute top-6 h-6 rounded-full ${color} ${
                      done ? "opacity-60" : ""
                    } ${overdue ? "ring-2 ring-rose-400" : ""}`}
                    style={{
                      left: (start - 1) * monthWidth + 8,
                      width: span * monthWidth - 16,
                    }}
                    title={`${g.title} • ${g.priority} • ${g.status}`}
                  />
                  <div className="absolute right-2 top-1 text-[10px] opacity-50">
                    D{quarter}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
