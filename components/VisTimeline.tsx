"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Goal, Category } from "./GoalsContext";
import type { DomainMode } from "./FilterBar";

// We import vis-timeline dynamically to avoid SSR issues.
type VisNS = typeof import("vis-timeline/standalone");

const CATS: Category[] = ["STRATEGY", "VISION", "TACTICAL", "PROJECT", "DAILY"];

function addDays(iso: string, n: number) {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

export default function VisTimeline({ goals, mode }: { goals: Goal[]; mode: DomainMode }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const visRef = useRef<{ timeline: any; DataSet: any } | null>(null);

  // Build vis groups/items whenever goals change
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
          start: g.start,
          end: addDays(g.due, 1), // inclusive range
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
          zoomMin: 1000 * 60 * 60 * 24 * 7,          // 1 week
          zoomMax: 1000 * 60 * 60 * 24 * 365 * 5,    // 5 years
          height: "380px",
          groupOrder: (a: any, b: any) => a.order - b.order,
          template: (item: any) => `<div class="bar">${item.content}</div>`,
        }
      );

      visRef.current = { timeline, DataSet };

      // Handle responsive redraws
      ro = new ResizeObserver(() => timeline.redraw());
      ro.observe(elRef.current);

      // Initial window
      setWindow(timeline, mode, goals);
    })();

    return () => {
      mounted = false;
      if (ro) ro.disconnect();
      if (visRef.current?.timeline) {
        try { visRef.current.timeline.destroy(); } catch {}
      }
      visRef.current = null;
    };
  }, []); // mount once

  // Update datasets when data changes
  useEffect(() => {
    const api = visRef.current;
    if (!api) return;
    const { timeline, DataSet } = api;

    timeline.setGroups(new DataSet(groups));
    timeline.setItems(new DataSet(items));
    setWindow(timeline, mode, goals);
  }, [groups, items, mode, goals]);

  return <div ref={elRef} className="vis-dark rounded-xl border border-white/10 bg-neutral-850 p-1" />;
}

function setWindow(timeline: any, mode: DomainMode, goals: Goal[]) {
  if (!timeline) return;
  if (mode === "this-year") {
    const y = new Date().getFullYear();
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59);
    timeline.setWindow(start, end, { animation: false });
  } else {
    if (goals.length === 0) {
      timeline.fit({ animation: false });
    } else {
      // Fit to content with a small padding
      timeline.fit({ animation: false });
      const range = timeline.getWindow();
      const pad = (range.end - range.start) * 0.05;
      timeline.setWindow(new Date(range.start - pad), new Date(range.end + pad), { animation: false });
    }
  }
}
