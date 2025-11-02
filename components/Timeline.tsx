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

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: "fit", label: "Fit all" },
  { value: "this-month", label: "This month" },
  { value: "next-2m", label: "2 months" },
  { value: "next-3m", label: "3 months" },
  { value: "next-4m", label: "4 months" },
  { value: "this-year", label: "This year" },
  { value: "next-365", label: "365 days" },
];

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export default function Timeline() {
  const { visibleGoals } = useGoals();
  const goals = visibleGoals ?? [];

  const [view, setView] = useState<View>("fit");
  const [density, setDensity] = useState(18);

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
  const widthPx = totalDays * density;
  const contentHeight = Math.max(goals.length * 40 + 24, 320);

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
  const todayLeft = diffDays(from, today) * density;

  // Sticky titles vs grid scroll sync
  const scrollerRef = useRef<HTMLDivElement>(null);
  const titlesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const s = scrollerRef.current;
    const t = titlesRef.current;
    if (!s || !t) return;
    const onScroll = () => {
      t.scrollTop = s.scrollTop;
    };
    s.addEventListener("scroll", onScroll);
    return () => s.removeEventListener("scroll", onScroll);
  }, []);

  // helpers to place bars
  const leftPx = (g: Goal) => Math.max(0, diffDays(from, new Date(g.startDate)) * density);
  const widthFor = (g: Goal) =>
    Math.max(
      density,
      Math.max(1, diffDays(new Date(g.startDate), addDays(new Date(g.endDate), 1))) * density,
    );

  const recenter = (smooth = true) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (!showToday) {
      scroller.scrollTo({ left: 0, behavior: smooth ? "smooth" : "auto" });
      return;
    }
    const desired = Math.max(0, todayLeft - scroller.clientWidth / 2);
    scroller.scrollTo({ left: desired, behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    recenter(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, from, to, density]);

  return (
    <div className="flex h-full flex-1 flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-white/10 p-1">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setView(option.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                view === option.value ? "bg-white text-neutral-900 shadow" : "text-white/70 hover:bg-white/10"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
          <span className="font-medium uppercase tracking-[0.2em] text-white/40">Zoom</span>
          <input
            type="range"
            min={12}
            max={32}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="h-1 w-28 accent-white"
          />
        </div>
        <button
          type="button"
          onClick={() => recenter()}
          className="ml-auto rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 transition hover:bg-white/20"
        >
          Center on today
        </button>
        <span className="text-xs text-neutral-400">
          {goals.length} goal{goals.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.25em] text-white/40">
        {Object.entries(CATEGORY_COLORS).map(([key, value]) => (
          <span key={key} className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${value}`} />
            {key.toLowerCase()}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-2 text-white/50">
          <span className="inline-block h-2 w-2 rounded-sm bg-red-500" /> Today marker
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60">
        {/* Header months */}
        <div className="sticky top-0 z-10 border-b border-white/10 bg-neutral-900/80 backdrop-blur">
          <div className="relative pl-56" style={{ width: "100%" }}>
            <div className="relative" style={{ width: widthPx }}>
              {months.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 flex h-9 items-center border-r border-white/10 px-2 text-xs text-neutral-300"
                  style={{ left: m.offsetDays * density, width: m.spanDays * density }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex h-full">
          {/* Sticky titles column */}
          <div
            ref={titlesRef}
            className="h-full w-56 shrink-0 overflow-y-auto border-r border-white/10"
          >
            {goals.map((g) => (
              <div
                key={g.id}
                title={g.title}
                className="flex h-10 items-center truncate px-4 text-sm text-neutral-200"
              >
                {g.title}
              </div>
            ))}
          </div>

          {/* Scrollable grid */}
          <div
            ref={scrollerRef}
            className="relative h-full w-full overflow-x-auto overflow-y-auto"
          >
            <div className="relative" style={{ width: widthPx, height: contentHeight }}>
              {/* vertical grid lines (days) */}
              {Array.from({ length: totalDays }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute top-0 ${i % 7 === 0 ? "bg-white/10" : "bg-white/5"}`}
                  style={{ left: i * density, width: 1, height: contentHeight }}
                />
              ))}

              {/* Today marker */}
              {showToday && (
                <div
                  className="absolute top-0 w-0.5 bg-red-500"
                  style={{ left: todayLeft, height: contentHeight }}
                >
                  <div className="sticky top-2 -mt-1 -translate-x-1/2">
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white shadow">
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
                        "flex h-6 items-center truncate px-2 text-xs text-white ring-1 ring-white/15 shadow",
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
