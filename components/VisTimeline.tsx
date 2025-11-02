"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Goal, Category } from "./GoalsContext";
import type { DomainMode } from "./FilterBar";

type VisNS = typeof import("vis-timeline/standalone");

const CATS: Category[] = ["STRATEGY", "VISION", "TACTICAL", "PROJECT", "DAILY"];

function addDays(iso: string, n: number) {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  d.setDate(d.getDate() + n);
  return d; // return Date; vis accepts Date
}

// ---- Safe helpers ---------------------------------------------------------
function toMs(x: any): number {
  const d = x instanceof Date ? x : new Date(x);
  const t = d.getTime();
  return Number.isFinite(t) ? t : NaN;
}

function safeFit(timeline: any) {
  try { timeline.fit({ animation: false }); } catch {}
}

function safeSetWindow(timeline: any, start: Date, end: Date) {
  const s = start?.getTime?.();
  const e = end?.getTime?.();
  if (!Number.isFinite(s) || !Number.isFinite(e) || s >= e) {
    safeFit(timeline);
    return;
    }
  try { timeline.setWindow(start, end, { animation: false }); } catch { safeFit(timeline); }
}

function setWindow(timeline: any, mode: DomainMode, goals: Goal[]) {
  if (!timeline) return;

  if (mode === "this-year") {
    const y = new Date().getFullYear();
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59);
    return safeSetWindow(timeline, start, end);
  }

  // mode === "fit"
  if (goals.length === 0) {
    return safeFit(timeline);
  }

  // Fit first, then pad defensively
  safeFit(timeline);
  let range: { start: Date | string; end: Date | string };
  try {
    range = timeline.getWindow();
  } catch {
    safeFit(timeline);
    return;
  }

  const s = toMs(range?.start);
  const e = toMs(range?.end);
  if (!Number.isFinite(s) || !Number.isFinite(e) || s >= e) {
    safeFit(timeline);
    return;
  }

  const span = e - s;
  // At least 1 day of padding, 5% otherwise
  const oneDay = 1000 * 60 * 60 * 24;
  const pad = Math.max(oneDay, Math.floor(span * 0.05));

  safeSetWindow(timeline, new Date(s - pad), new Date(e + pad));
}
// ---------------------------------------------------------------------------

export default function VisTimeline({ goals, mode }: { goals: Goal[]; mode: DomainMode }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const visRef = useRef<{ timeline: any; DataSet: any } | null>(null);

  const groups = useMemo(
    () => CATS.map((c, idx) => ({ id: c, content: c, order: idx })),
    []
  );

  const items = useMemo(
    () =>
      goals.map((g) => {
        const done = g.status === "done";
        const overdue = !done && new Date(g.due) < new Date();
        return {
          id: g.id,
          group: g.category,
          content: g.title ? g.title.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "Untitled",
          start: new Date(g.start),
          end: addDays(g.due, 1),        // inclusive range, return Date
          type: "range",
          className: `prio-${g.priority} ${done ? "is-done" : ""} ${overdue ? "is-overdue" : ""}`,
          title: `${g.title} • ${g.priority} • ${g.status}`,
        };
      }),
    [goals]
  );

  useEffect(() => {
    let ro: ResizeObserver | null = null;
    let mounted = true;

    (async () => {
      const vis: VisNS = await import("vis-timeline/standalone");
      if (!mounted || !elRef.current) return;

      const { Timeline, DataSet } = vis;
      const timeline = new Timeline(
        elRef.current,
        new DataSet(items),
        new DataSet(groups),
        {
          stack: false,
          orientation: "top",
          zoomKey: "ctrlKey",
          horizontalScroll: true,
          showCurrentTime: true,
          selectable: false,
          multiselect: false,
          margin: { item: 8, axis: 12 },
          timeAxis: { scale: "month", step: 1 },
          zoomMin: 1000 * 60 * 60 * 24 * 7,
          zoomMax: 1000 * 60 * 60 * 24 * 365 * 5,
          height: "380px",
          groupOrder: (a: any, b: any) => a.order - b.order,
          template: (item: any) => `<div class="bar">${item.content}</div>`,
        }
      );

      visRef.current = { timeline, DataSet };

      ro = new ResizeObserver(() => timeline.redraw());
      ro.observe(elRef.current);

      setWindow(timeline, mode, goals);
    })();

    return () => {
      mounted = false;
      if (ro) ro.disconnect();
      try { visRef.current?.timeline?.destroy(); } catch {}
      visRef.current = null;
    };
  }, []); // mount

  // Update datasets + window safely on every change
  useEffect(() => {
    const api = visRef.current;
    if (!api) return;
    const { timeline, DataSet } = api;

    try {
      timeline.setGroups(new DataSet(groups));
      timeline.setItems(new DataSet(items));
    } catch {
      // worst case: try to refit
      safeFit(timeline);
    }
    setWindow(timeline, mode, goals);
  }, [groups, items, mode, goals]);

  return <div ref={elRef} className="vis-dark rounded-xl border border-white/10 bg-neutral-850 p-1" />;
}
