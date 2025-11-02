'use client';

import React, { useEffect, useRef } from 'react';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import { DataSet } from 'vis-data/peer';
import { Timeline } from 'vis-timeline/standalone';

export type Level = 'strategy' | 'vision' | 'tactical' | 'project' | 'daily';
export type Priority = 'low' | 'med' | 'high';
export type Status = 'open' | 'at_risk' | 'overdue' | 'done';

export type TimelineItem = {
  id: string;
  title: string;
  start: string; // ISO date
  end?: string;  // ISO date (optional)
  level: Level;
  priority: Priority;
  status: Status;
};

type Props = {
  items: TimelineItem[];
  height?: number;   // px
  autoFit?: boolean; // fit on mount
};

const LEVELS: Level[] = ['strategy', 'vision', 'tactical', 'project', 'daily'];

export default function TimelineVis({ items, height = 420, autoFit = true }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const dataRef = useRef<DataSet<any> | null>(null); // keep our own DataSet reference

  // init once
  useEffect(() => {
    if (!containerRef.current) return;

    const groups = new DataSet(
      LEVELS.map((lvl, i) => ({ id: lvl, content: lvl.toUpperCase(), order: i }))
    );

    const ds = new DataSet(items.map(toVisItem));
    dataRef.current = ds;

    const tl = new Timeline(containerRef.current, ds, groups, {
      stack: true,
      horizontalScroll: true,
      zoomKey: 'ctrlKey',
      zoomMin: 24 * 60 * 60 * 1000,               // 1 day
      zoomMax: 5 * 365 * 24 * 60 * 60 * 1000,     // 5 years
      selectable: true,
      multiselect: false,
      orientation: 'top',
      showCurrentTime: true,
      minHeight: `${height}px`,
      maxHeight: `${height}px`,
      margin: { item: 10, axis: 18 },
      timeAxis: { scale: 'month', step: 1 },
      tooltip: { followMouse: true, overflowMethod: 'cap' },
    });

    if (autoFit) tl.fit({ animation: { duration: 300, easingFunction: 'easeInOutQuad' } });
    timelineRef.current = tl;

    return () => {
      tl?.destroy();
      timelineRef.current = null;
      dataRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update dataset when items change
  useEffect(() => {
    const ds = dataRef.current;
    if (!ds) return;

    const next = items.map(toVisItem);
    const nextIds = new Set(next.map((n) => String(n.id)));
    const existingIds = (ds.getIds() as string[]) || [];

    // remove items that no longer exist
    existingIds.forEach((id) => {
      if (!nextIds.has(String(id))) ds.remove(id);
    });

    // upsert items
    next.forEach((n) => {
      if (ds.get(n.id)) ds.update(n);
      else ds.add(n);
    });
  }, [items]);

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full rounded-xl border border-neutral-200 bg-white" />
      <style jsx global>{`
        .vis-timeline { border: none; }
        .vis-item .vis-item-content { padding: 4px 8px; font-size: 12px; border-radius: 8px; }
        .vis-group { color: #6b7280; font-weight: 600; }
        .tl-prio-low  .vis-item-content { background: #E5F4FF; }
        .tl-prio-med  .vis-item-content { background: #FFEFD5; }
        .tl-prio-high .vis-item-content { background: #FFE5E5; }
        .tl-done      .vis-item-content { opacity: .55; text-decoration: line-through; }
        .tl-risk      .vis-item-content { outline: 2px dashed #f59e0b; }
        .tl-overdue   .vis-item-content { outline: 2px solid #ef4444; }
      `}</style>
    </div>
  );
}

function toVisItem(g: TimelineItem) {
  return {
    id: g.id,
    group: g.level,
    start: g.start,
    end: g.end,
    content: `<div title="${escapeHtml(g.title)}">${escapeHtml(truncate(g.title, 28))}</div>`,
    className: classFor(g),
  };
}

function classFor(g: TimelineItem) {
  const pr =
    g.priority === 'high' ? 'tl-prio-high' :
    g.priority === 'med'  ? 'tl-prio-med'  : 'tl-prio-low';
  const st =
    g.status === 'done'     ? 'tl-done'   :
    g.status === 'at_risk'  ? 'tl-risk'   :
    g.status === 'overdue'  ? 'tl-overdue': '';
  return `${pr} ${st}`;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (m) => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m] as string
  ));
}
