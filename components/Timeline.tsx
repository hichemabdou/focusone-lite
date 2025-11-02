"use client";

import { useEffect, useMemo, useState } from "react";
import { Goal, useGoals } from "./GoalsContext";

/* -------- utilities -------- */
const clampNum = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
const fmtMonth = (d: Date) => d.toLocaleString(undefined, { month: "short", year: "numeric" });
function parseISO(s: string) { const [y, m, dd] = s.split("-").map(Number); return new Date(y, (m || 1) - 1, dd || 1); }

type Range = { start: Date; end: Date };

function getFitAllRange(goals: Goal[]): Range {
  if (!goals.length) {
    const today = new Date();
    return { start: startOfMonth(today), end: endOfMonth(addMonths(today, 5)) };
  }
  const minS = goals.reduce((a, g) => (parseISO(g.startDate) < a ? parseISO(g.startDate) : a), parseISO(goals[0].startDate));
  const maxE = goals.reduce((a, g) => (parseISO(g.endDate) > a ? parseISO(g.endDate) : a), parseISO(goals[0].endDate));
  return { start: startOfMonth(minS), end: endOfMonth(maxE) };
}
function monthsBetween(r: Range) { const out: Date[] = []; let cur = startOfMonth(r.start); const end = startOfMonth(r.end); while (cur <= end) { out.push(cur); cur = addMonths(cur, 1); } return out; }

const statusLabel: Record<string, string> = {
  open: "Open",
  inprog: "In progress",
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Done",
};

export default function Timeline() {
  const { visibleGoals, goals } = useGoals();
  const items = (visibleGoals ?? goals ?? []) as Goal[];

  /* ----- RANGE ----- */
  const [range, setRange] = useState<Range>(() => getFitAllRange(items));
  useEffect(() => {
    setRange((prev) => {
      const fit = getFitAllRange(items);
      if (!items.length) return fit;
      const days = Math.max(1, Math.round((prev.end.getTime() - prev.start.getTime()) / 86400000));
      return days < 3 ? fit : prev;
    });
  }, [items.length]);

  /* ----- positioning ----- */
  const msStart = range.start.getTime();
  const msSpan = Math.max(1, range.end.getTime() - range.start.getTime());
  const spans = useMemo(
    () => items.map((g) => {
      const s = parseISO(g.startDate), e = parseISO(g.endDate);
      const leftPct = clampNum(((s.getTime() - msStart) / msSpan) * 100, -5, 105);
      const rightPct = clampNum(((e.getTime() - msStart) / msSpan) * 100, -5, 105);
      const widthPct = Math.max(1, rightPct - leftPct);

      const catClass = `bar--cat-${(g.category || "DAILY").toLowerCase()}`;
      const stKey = (g.status === "in-progress" ? "inprog" : g.status) || "open";
      const stClass = `bar--st-${stKey}`;

      return { g, leftPct, widthPct, catClass, stClass, stKey };
    }),
    [items, msStart, msSpan]
  );

  /* ----- compact rows: fit inside fixed timeline height ----- */
  const rowCount = Math.max(spans.length, 1);
  const TARGET_VISUAL = 520 - 56; // ~panel-body area (px)
  const rawRow = Math.floor(TARGET_VISUAL / rowCount);
  const rowHeight = Math.max(16, Math.min(rawRow, 38));

  /* ----- months + buttons ----- */
  const months = monthsBetween(range);
  const setMonthsWindow = (m: number) => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(addMonths(start, m - 1));
    setRange({ start, end });
  };
  const buttons = [
    { label: "Fit all", onClick: () => setRange(getFitAllRange(items)) },
    { label: "This month", onClick: () => setMonthsWindow(1) },
    { label: "2 months", onClick: () => setMonthsWindow(2) },
    { label: "3 months", onClick: () => setMonthsWindow(3) },
    { label: "4 months", onClick: () => setMonthsWindow(4) },
    { label: "This year", onClick: () => {
        const now = new Date(); setRange({ start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) });
      } },
    { label: "365 days", onClick: () => { const s = startOfMonth(new Date()); setRange({ start: s, end: addMonths(s, 12) }); } },
  ];

  return (
    <div
      className="timeline"
      style={{ ["--row-h" as any]: `${rowHeight}px` } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 p-2">
        {buttons.map((b) => (
          <button key={b.label} className="btn" onClick={b.onClick}>{b.label}</button>
        ))}
      </div>

      <div className="timeline__header">
        {months.map((m) => (
          <div key={m.toISOString()} className="timeline__month">{fmtMonth(m)}</div>
        ))}
      </div>

      <div className="timeline__grid">
        <div className="timeline__rows">
          {spans.map(({ g, leftPct, widthPct, catClass, stClass, stKey }) => (
            <div key={g.id} className="timeline__row">
              <div
                className={["timeline__bar", catClass, stClass].join(" ")}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                title={`${g.title} • ${g.startDate} → ${g.endDate}`}
              >
                <span className={["timeline__badge", `status--${stKey}`].join(" ")}>
                  {statusLabel[stKey] ?? "Open"}
                </span>
                <span className="timeline__title">{g.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
