"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_COLORS, PRIORITY_OPACITY, Goal, useGoals } from "./GoalsContext";

type View =
  | "fit"
  | "this-month"
  | "next-2m"
  | "next-3m"
  | "next-4m"
  | "this-year"
  | "next-365";

const DAY_PX = 18;

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function diffDays(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

export default function Timeline() {
  const { visibleGoals } = useGoals();
  const goals = visibleGoals ?? [];

  const [view, setView] = useState<View>("fit");

  // Compute visible domain
  const [from, to] = useMemo<[Date, Date]>(() => {
    const now = new Date();

    const minStart = goals.length
      ? goals.map((g) => new Date(g.startDate)).reduce((a, b) => (a < b ? a : b))
      : startOfMonth(now);
    const maxEnd = goals.length
      ? goals.map((g) => new Date(g.endDate)).reduce((a, b) => (a > b ? a : b))
      : endOfMonth(now);

    switch (view) {
      case "this-month": {
        const s = startOfMonth(now);
        const e = endOfMonth(now);
        return [s, e];
      }
      case "next-2m":
      case "next-3m":
      case "next-4m": {
        const months = Number(view.split("-")[1].replace("m", ""));
        const s = startOfMonth(now);
        const e = endOfMonth(new Date(now.getFullYear(), now.getMonth() + months - 1, 1));
        return [s, e];
      }
      case "this-year": {
        const s = new Date(now.getFullYear(), 0, 1);
        const e = new Date(now.getFullYear(), 11, 31);
        return [s, e];
      }
      case "next-365": {
        const s = new Date(now);
        const e = addDays(now, 365);
        return [s, e];
      }
      case "fit":
      default: {
        const padLeft = addDays(minStart, -3);
        const padRight = addDays(maxEnd, 3);
        return [padLeft, padRight];
      }
    }
  }, [goals, view]);

  // Grid & header math
  const totalDays = Math.max(1, diffDays(from, addDays(to, 1)));
  const widthPx = totalDays * DAY_PX;

  const months = useMemo(() => {
    const arr: { label: string; start: Date; end: Date; offsetDays: number; spanDays: number }[] = [];
    let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cursor <= to) {
      const s = new Date(cursor);
      const e = endOfMonth(cursor);
      const startClip = s < from ? from : s;
      const endClip = e > to ? to : e;
      arr.push({
        label: startClip.toLocaleString(undefined, { month: "long", year: "2-digit" }),
        start: startClip,
        end: endClip,
        offsetDays: diffDays(from, startClip),
        spanDays: diffDays(startClip, addDays(endClip, 1)),
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return arr;
  }, [from, to]);

  // Today marker
  const today = new Date();
  const showToday = today >= from && today <= to;
  const todayLeft = diffDays(from, today) * DAY_PX;

  // Sticky titles vs grid scroll sync
  const scrollerRef = useRef<HTMLDivElement>(null);
  const titlesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const s = scrollerRef.current;
    const t = titlesRef.current;
    if (!s || !t) return;
    const onScroll = () => (t.scrollTop = s.scrollTop);
    s.addEventListener("scroll", onScroll);
    return () => s.removeEventListener("scroll", onScroll);
  }, []);

  // helpers to place bars
  const leftPx = (g: Goal) => Math.max(0, diffDays(from, new Date(g.startDate)) * DAY_PX);
  const widthFor = (g: Goal) =>
    Math.max(DAY_PX, Math.max(1, diffDays(new Date(g.startDate), addDays(new Date(g.endDate), 1))) * DAY_PX);

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-neutral-400">View:</span>
        <select
          value={view}
          onChange={(e) => setView(e.target.value as View)}
          className="rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1 text-sm"
        >
          <option value="fit">Fit all</option>
          <option value="this-month">This month</option>
          <option value="next-2m">Next 2 months</option>
          <option value="next-3m">Next 3 months</option>
          <option value="next-4m">Next 4 months</option>
          <option value="this-year">This year</option>
          <option value="next-365">Next 365 days</option>
        </select>
        <span className="ml-auto text-xs text-neutral-500">
          {goals.length} goal{goals.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="relative rounded-2xl bg-neutral-900/60 border border-white/10 overflow-hidden">
        {/* Header months */}
        <div className="sticky top-0 z-10 bg-neutral-900/80 backdrop-blur border-b border-white/10">
          <div className="pl-48 relative" style={{ width: "100%" }}>
            <div className="relative" style={{ width: widthPx }}>
              {months.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-9 border-r border-white/10 flex items-center px-2 text-xs text-neutral-300"
                  style={{ left: m.offsetDays * DAY_PX, width: m.spanDays * DAY_PX }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex">
          {/* Sticky titles column */}
          <div
            ref={titlesRef}
            className="shrink-0 w-48 border-r border-white/10 max-h-[420px] overflow-y-auto"
          >
            {goals.map((g) => (
              <div
                key={g.id}
                title={g.title}
                className="h-10 flex items-center px-3 text-sm text-neutral-300 truncate"
              >
                {g.title}
              </div>
            ))}
          </div>

          {/* Scrollable grid */}
          <div
            ref={scrollerRef}
            className="relative overflow-auto max-h-[420px] w-full"
          >
            <div className="relative" style={{ width: widthPx }}>
              {/* vertical grid lines (days) */}
              {Array.from({ length: totalDays }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute top-0 bottom-0 ${i % 7 === 0 ? "bg-white/10" : "bg-white/5"}`}
                  style={{ left: i * DAY_PX, width: 1 }}
                />
              ))}

              {/* Today marker */}
              {showToday && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                  style={{ left: todayLeft }}
                >
                  <div className="sticky top-2 -translate-x-1/2 -mt-1">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-500 text-white shadow">
                      Today
                    </span>
                  </div>
                </div>
              )}

              {/* Bars */}
              {goals.map((g, row) => {
                const top = row * 40 + 6;
                const left = leftPx(g);
                const w = widthFor(g);
                const cat = CATEGORY_COLORS[g.category];
                const op = PRIORITY_OPACITY[g.priority];
                const title = `${g.title}\n${g.startDate} → ${g.endDate}\n${g.category} • ${g.priority}`;
                return (
                  <div key={g.id} className="absolute left-0 right-0" style={{ top }}>
                    <div
                      title={title}
                      className={[
                        "h-6 rounded-md shadow ring-1 ring-white/15 text-xs text-white truncate px-2 flex items-center",
                        cat,
                        op,
                      ].join(" ")}
                      style={{ left, width: w, position: "absolute" }}
                    >
                      {g.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
