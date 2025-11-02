"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Goal } from "./GoalsContext";

export type DomainMode = "fit" | "this-year";

const LANES: Record<string, number> = {
  STRATEGY: 0,
  VISION: 1,
  TACTICAL: 2,
  PROJECT: 3,
  DAILY: 4,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parse(iso: string) {
  return new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
}

export default function Timeline({ goals, mode }: { goals: Goal[]; mode: DomainMode }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(1200);

  // responsive width
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // domain
  const { start, end } = useMemo(() => {
    if (mode === "this-year") {
      const y = new Date().getFullYear();
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59) };
    }
    if (!goals.length) {
      const y = new Date().getFullYear();
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59) };
    }
    const s = goals.map((g) => parse(g.start).getTime());
    const e = goals.map((g) => parse(g.due).getTime());
    const min = Math.min(...s);
    const max = Math.max(...e);
    const pad = 1000 * 60 * 60 * 24 * 14; // 14 days
    return { start: new Date(min - pad), end: new Date(max + pad) };
  }, [goals, mode]);

  const span = Math.max(1, end.getTime() - start.getTime());
  const pxPerMs = width / span;

  const months = useMemo(() => {
    const arr: { d: Date; label: string }[] = [];
    const d = new Date(start);
    d.setDate(1);
    while (d <= end) {
      arr.push({ d: new Date(d), label: d.toLocaleString(undefined, { month: "short" }) });
      d.setMonth(d.getMonth() + 1);
    }
    return arr;
  }, [start, end]);

  const today = new Date();

  const bars = useMemo(() => {
    return goals.map((g) => {
      const s = parse(g.start).getTime();
      const e = parse(g.due).getTime();
      const left = clamp((s - start.getTime()) * pxPerMs, -9999, 999999);
      const right = clamp((e - start.getTime()) * pxPerMs, -9999, 999999);
      const width = Math.max(8, right - left);
      const lane = LANES[g.category] ?? 0;
      const overdue = g.status !== "done" && parse(g.due) < today;

      const prioClass =
        g.priority === "critical" ? "bg-rose-500" :
        g.priority === "high"     ? "bg-orange-400" :
        g.priority === "medium"   ? "bg-amber-300" :
                                    "bg-emerald-400";

      return {
        id: g.id,
        left,
        width,
        lane,
        prioClass,
        title: g.title,
        overdue,
        done: g.status === "done",
      };
    });
  }, [goals, pxPerMs, start, today]);

  const todayX = clamp((today.getTime() - start.getTime()) * pxPerMs, -9999, 999999);

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* header */}
      <div className="sticky top-0 z-10 mb-1 flex items-center justify-between bg-transparent">
        <div className="text-xs uppercase tracking-wide text-white/60">Timeline</div>
        <div className="text-xs text-white/50">
          {start.toLocaleDateString()} – {end.toLocaleDateString()}
        </div>
      </div>

      <div className="relative overflow-x-auto rounded-xl border border-white/10 bg-neutral-900/60">
        <div className="relative" style={{ width: Math.max(width, 1200) }}>
          {/* months row */}
          <div className="sticky left-0 right-0 top-0 z-10 flex border-b border-white/10 bg-neutral-900/80 backdrop-blur">
            {months.map((m, i) => {
              const next = i + 1 < months.length ? months[i + 1].d : end;
              const seg = (next.getTime() - m.d.getTime()) * pxPerMs;
              return (
                <div key={i} style={{ width: seg }} className="flex items-center justify-center px-2 py-1 text-xs text-white/70">
                  {m.label}
                </div>
              );
            })}
          </div>

          {/* lanes */}
          <div className="grid grid-rows-5 gap-px">
            {Object.keys(LANES).map((label) => (
              <div key={label} className="relative h-16 border-b border-white/5">
                <div className="sticky left-0 top-0 z-10 -ml-2 inline-block h-6 rounded-md bg-white/5 px-2 text-xs font-semibold tracking-wide text-white/70">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* quarter markers */}
          <div className="pointer-events-none absolute left-0 right-0 top-7 z-[1] h-0.5">
            {["Q1","Q2","Q3","Q4"].map((q, i) => (
              <div key={q} className="absolute -mt-5 text-[10px] text-white/50" style={{ left: `${(i*25)}%` }}>{q}</div>
            ))}
          </div>

          {/* bars */}
          <div className="absolute left-0 right-0 top-0">
            {bars.map((b) => (
              <div
                key={b.id}
                className={`group absolute rounded-md px-2 py-1 text-[11px] font-semibold text-black ${b.prioClass} ${b.done ? "opacity-60" : ""}`}
                style={{
                  transform: `translateX(${b.left}px)`,
                  width: b.width,
                  top: 28 + b.lane * 64,
                }}
                title={b.title}
              >
                <span className="truncate">{b.title}</span>
                {b.overdue && <span className="ml-2 rounded-sm bg-black/20 px-1 text-[10px] text-black">overdue</span>}
              </div>
            ))}
          </div>

          {/* today line */}
          <div className="pointer-events-none absolute top-0 bottom-0" style={{ transform: `translateX(${todayX}px)` }}>
            <div className="relative h-full">
              <div className="absolute left-[-18px] top-[26px] rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-900 shadow">Today</div>
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white/90" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
