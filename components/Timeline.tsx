"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { Goal, Priority, Status, CATEGORY_COLORS, useGoals } from "./GoalsContext";
import GoalEditor from "./GoalEditor";

/* -------- utilities -------- */
const clampNum = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
const fmtMonth = (d: Date) => d.toLocaleString(undefined, { month: "short", year: "numeric" });
function parseISO(input: string) {
  const [y, m, dd] = input.split("-").map(Number);
  return new Date(y, (m || 1) - 1, dd || 1);
}
const startOfQuarter = (d: Date) => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
const endOfQuarter = (d: Date) => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3 + 3, 0);
function categoryColor(category: Goal["category"]) {
  const key = category ?? "PROJECT";
  const token = CATEGORY_COLORS[key] ?? "bg-slate-500";
  const map: Record<string, string> = {
    "bg-cyan-500": "#22d3ee",
    "bg-amber-500": "#fbbf24",
    "bg-sky-500": "#0ea5e9",
    "bg-fuchsia-500": "#e879f9",
    "bg-emerald-500": "#34d399",
  };
  return map[token] ?? "#94a3b8";
}

function monthsBetween(range: Range) {
  const out: Date[] = [];
  let cursor = startOfMonth(range.start);
  const end = startOfMonth(range.end);
  while (cursor <= end) {
    out.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return out;
}

function quartersBetween(range: Range) {
  const quarters: { start: Date; end: Date; label: string }[] = [];
  let cursor = startOfQuarter(range.start);
  if (cursor < range.start) {
    cursor = startOfQuarter(range.start);
  }

  while (cursor <= range.end) {
    const quarterStart = cursor < range.start ? new Date(range.start) : new Date(cursor);
    const quarterEndRaw = endOfQuarter(cursor);
    const quarterEnd = quarterEndRaw > range.end ? new Date(range.end) : quarterEndRaw;
    const label = `Q${Math.floor(cursor.getMonth() / 3) + 1} ${cursor.getFullYear()}`;
    quarters.push({ start: quarterStart, end: quarterEnd, label });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 1);
  }

  return quarters;
}

/* -------- types -------- */
type Range = { start: Date; end: Date };
type TimelineStyle = CSSProperties & { "--row-h"?: string };
type HoverState = { id: string; title: string; status: string; dateRange: string; left: number; top: number };
type Density = "cozy" | "balanced" | "compact";
type SpanInfo = {
  g: Goal;
  title: string;
  start: Date;
  end: Date;
  leftPct: number;
  widthPct: number;
  pixelWidth: number;
  catClass: string;
  stClass: string;
  priClass: string;
  stKey: string;
  isCompact: boolean;
  showOutside: boolean;
  statusColor: string;
  priorityColor: string;
  priorityBg: string;
  priorityBgStrong: string;
};

type MilestonePoint = { id: string; label: string; leftPct: number; color: string };
type MilestoneWindowOverlay = { id: string; label: string; leftPct: number; widthPct: number; color: string };

const statusLabel: Record<string, string> = {
  open: "Open",
  inprog: "In progress",
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Done",
};

const STATUS_HEX: Record<Status | "inprog", string> = {
  open: "#38bdf8",
  "in-progress": "#fbbf24",
  inprog: "#fbbf24",
  blocked: "#f87171",
  done: "#22c55e",
};

const PRIORITY_HEX: Record<Priority, string> = {
  low: "#94a3b8",
  medium: "#60a5fa",
  high: "#facc15",
  critical: "#fb7185",
};
const PRIORITY_TINTS: Record<Priority, { base: number; strong: number }> = {
  low: { base: 0.18, strong: 0.35 },
  medium: { base: 0.25, strong: 0.45 },
  high: { base: 0.32, strong: 0.55 },
  critical: { base: 0.4, strong: 0.65 },
};

function hexToRgba(hex: string, alpha = 1) {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getFitAllRange(goals: Goal[]): Range {
  if (!goals.length) {
    const today = new Date();
    return { start: startOfMonth(today), end: endOfMonth(addMonths(today, 5)) };
  }
  const minStart = goals.reduce((acc, goal) => {
    const value = parseISO(goal.startDate);
    return value < acc ? value : acc;
  }, parseISO(goals[0].startDate));
  const maxEnd = goals.reduce((acc, goal) => {
    const value = parseISO(goal.endDate);
    return value > acc ? value : acc;
  }, parseISO(goals[0].endDate));
  return { start: startOfMonth(minStart), end: endOfMonth(maxEnd) };
}

export default function Timeline() {
  const { visibleGoals, goals, updateGoal } = useGoals();
  const items = useMemo(() => (visibleGoals ?? goals ?? []) as Goal[], [visibleGoals, goals]);

  type PresetKey = "fit" | "month" | "6m" | "ytd" | "next-ytd" | "5y";
  const [activePreset, setActivePreset] = useState<PresetKey>("fit");
  const [density, setDensity] = useState<Density>("balanced");
  const [focusMode, setFocusMode] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [showMonthGrid, setShowMonthGrid] = useState(false);
  const [showQuarterGrid, setShowQuarterGrid] = useState(false);
  const [gridMenuOpen, setGridMenuOpen] = useState(false);
  const gridToggleRef = useRef<HTMLDivElement>(null);

  const range = useMemo<Range>(() => {
    const now = new Date();
    switch (activePreset) {
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "6m":
        return { start: startOfMonth(now), end: endOfMonth(addMonths(now, 5)) };
      case "ytd":
        return { start: new Date(now.getFullYear(), 0, 1), end: now };
      case "next-ytd":
        return { start: now, end: new Date(now.getFullYear() + 1, 11, 31) };
      case "5y":
        return { start: startOfMonth(now), end: endOfMonth(addMonths(now, 59)) };
      case "fit":
      default:
        return getFitAllRange(items);
    }
  }, [activePreset, items]);

  const msStart = range.start.getTime();
  const msSpan = Math.max(1, range.end.getTime() - range.start.getTime());

  const months = monthsBetween(range);
  const monthGridLines = useMemo(() => {
    if (!showMonthGrid) return [];
    return months
      .map((month) => {
        const boundary = endOfMonth(month);
        return clampNum(((boundary.getTime() - msStart) / msSpan) * 100, 0, 100);
      })
      .filter((pct, index, arr) => arr.indexOf(pct) === index);
  }, [months, msStart, msSpan, showMonthGrid]);
  const { pixelBasis, contentWidth } = useMemo(() => {
    const monthsCount = Math.max(months.length, 1);
    const monthWidth = focusMode ? 170 : 140;
    const naturalWidth = Math.max(monthWidth, monthsCount * monthWidth);
    const maxWidth = focusMode ? 4200 : 2600;
    const clampedNatural = Math.min(naturalWidth, maxWidth);
    const measuredWidth = viewportWidth ?? 0;
    const fallbackWidth = focusMode ? 1400 : 1100;
    const baseWidth = measuredWidth > 0 ? measuredWidth : Math.min(clampedNatural, fallbackWidth);
    const needsScroll = measuredWidth > 0 && clampedNatural > measuredWidth + 40;
    const basis = needsScroll ? clampedNatural : baseWidth || fallbackWidth;
    return {
      pixelBasis: basis,
      contentWidth: needsScroll ? clampedNatural : undefined,
    };
  }, [months.length, viewportWidth, focusMode]);

  const quarters = useMemo(() => {
    return quartersBetween(range).map((seg) => {
      const startPct = clampNum(((seg.start.getTime() - msStart) / msSpan) * 100, 0, 100);
      const endPct = clampNum(((seg.end.getTime() - msStart) / msSpan) * 100, startPct, 100);
      const width = Math.max(6, endPct - startPct);
      return { ...seg, leftPct: startPct, widthPct: Math.max(0, Math.min(100 - startPct, width)) };
    });
  }, [range, msStart, msSpan]);

  const quarterGridLines = useMemo(() => {
    if (!showQuarterGrid) return [];
    return quarters.map((quarter) => quarter.leftPct);
  }, [quarters, showQuarterGrid]);

  const spans = useMemo<SpanInfo[]>(
    () =>
      items.map((goal) => {
        const start = parseISO(goal.startDate);
        const end = parseISO(goal.endDate);
        const title = (goal.title ?? "").trim().replace(/\s+/g, " ") || "Untitled goal";
        const leftPct = clampNum(((start.getTime() - msStart) / msSpan) * 100, -5, 105);
        const rightPct = clampNum(((end.getTime() - msStart) / msSpan) * 100, -5, 105);
        const widthPct = Math.max(0.8, rightPct - leftPct);
        const pixelWidth = Math.max(1, (widthPct / 100) * pixelBasis);
        const estimatedText = Math.min(260, Math.max(60, title.length * 7.2));

        const category = goal.category || "PROJECT";
        const catClass = `bar--cat-${category.toLowerCase()}`;
        const priClass = `bar--pri-${goal.priority}`;
        const stKey = (goal.status === "in-progress" ? "inprog" : goal.status) || "open";
        const stClass = `bar--st-${stKey}`;
        const showOutside = pixelWidth < estimatedText;
        const isCompact = pixelWidth < 220;
        const statusColor = STATUS_HEX[stKey as keyof typeof STATUS_HEX] ?? "#38bdf8";
        const priorityColor = PRIORITY_HEX[goal.priority];
        const tints = PRIORITY_TINTS[goal.priority];
        const priorityBg = hexToRgba(priorityColor, tints.base);
        const priorityBgStrong = hexToRgba(priorityColor, tints.strong);
        return {
          g: goal,
          start,
          end,
          title,
          leftPct,
          widthPct,
          pixelWidth,
          catClass,
          priClass,
          stClass,
          stKey,
          isCompact,
          showOutside,
          statusColor,
          priorityColor,
          priorityBg,
          priorityBgStrong,
        };
      }),
    [items, msStart, msSpan, pixelBasis]
  );

  const { milestonePoints, milestoneWindows } = useMemo(() => {
    const points: MilestonePoint[] = [];
    const windows: MilestoneWindowOverlay[] = [];
    items.forEach((goal) => {
      const ms = goal.milestone;
      if (!ms) return;
      const baseColor = ms.color ?? categoryColor(goal.category);
      if (ms.type === "point") {
        const leftPct = clampNum(((parseISO(ms.date).getTime() - msStart) / msSpan) * 100, -5, 105);
        points.push({
          id: ms.id ?? `${goal.id}-point`,
          label: ms.label ?? "Milestone",
          leftPct,
          color: baseColor,
        });
      } else {
        const startPct = clampNum(((parseISO(ms.windowStart).getTime() - msStart) / msSpan) * 100, -5, 105);
        const endPct = clampNum(((parseISO(ms.windowEnd).getTime() - msStart) / msSpan) * 100, -5, 105);
        windows.push({
          id: ms.id ?? `${goal.id}-window`,
          label: ms.label ?? "Focus window",
          leftPct: Math.min(startPct, endPct),
          widthPct: Math.max(2, Math.abs(endPct - startPct)),
          color: baseColor,
        });
      }
    });
    return { milestonePoints: points, milestoneWindows: windows };
  }, [items, msSpan, msStart]);

  const densityMap: Record<Density, number> = {
    cozy: 44,
    balanced: 32,
    compact: 22,
  };
  const rowCount = Math.max(spans.length, 1);
  const TARGET_VISUAL = focusMode ? 1100 : 520;
  const rawRow = Math.floor(TARGET_VISUAL / rowCount);
  const rowHeight = Math.max(18, Math.min(rawRow, densityMap[density]));
  const timelineStyle: TimelineStyle = { "--row-h": `${rowHeight}px` };

  const timelineRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }),
    []
  );
  const todayDetailFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { weekday: "short", month: "long", day: "numeric", year: "numeric" }),
    []
  );
  const [hovered, setHovered] = useState<HoverState | null>(null);
  const [showTodayDetail, setShowTodayDetail] = useState(false);

  const formatRange = (start: Date, end: Date) => `${dateFormatter.format(start)} → ${dateFormatter.format(end)}`;

  const handleBarHover = (payload: SpanInfo) => (event: MouseEvent<HTMLDivElement>) => {
    const gridEl = timelineRef.current;
    if (!gridEl) return;
    const gridRect = gridEl.getBoundingClientRect();
    const barRect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    const pointerX = event.clientX || barRect.left + barRect.width / 2;
    const leftPx = clampNum(pointerX - gridRect.left, 24, gridRect.width - 24);
    let topPx = barRect.top - gridRect.top - 48;
    if (topPx < 12) {
      topPx = barRect.bottom - gridRect.top + 12;
    }

    setHovered({
      id: payload.g.id,
      title: payload.g.title || "Untitled goal",
      status: statusLabel[payload.stKey] ?? "Open",
      dateRange: formatRange(payload.start, payload.end),
      left: leftPx,
      top: topPx,
    });
  };

  const clearHover = () => setHovered(null);

  const today = new Date();
  const todayPct = clampNum(((today.getTime() - msStart) / msSpan) * 100, -5, 105);
  const showToday = todayPct >= 0 && todayPct <= 100;
  const todayReadable = todayDetailFormatter.format(today);
  const todayLabel = `Today · ${todayReadable}`;
  const todayAlign: "left" | "center" | "right" = todayPct < 6 ? "left" : todayPct > 94 ? "right" : "center";

  const buttons: Array<{ key: PresetKey; label: string }> = [
    { key: "fit", label: "Fit all" },
    { key: "month", label: "This month" },
    { key: "6m", label: "6 months" },
    { key: "ytd", label: "Year to date" },
    { key: "next-ytd", label: "Next year to date" },
    { key: "5y", label: "Next 5 years" },
  ];

  useEffect(() => {
    if (!focusMode) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [focusMode]);
  useEffect(() => {
    if (!gridMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (gridToggleRef.current && !gridToggleRef.current.contains(target)) {
        setGridMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [gridMenuOpen]);

  useEffect(() => {
    const viewportEl = viewportRef.current;
    if (!viewportEl) return;
    const updateSize = () => setViewportWidth(viewportEl.clientWidth);
    updateSize();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateSize);
      observer.observe(viewportEl);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [focusMode]);

  return (
    <>
      {focusMode && <div className="timeline__focus-backdrop" onClick={() => setFocusMode(false)} />}
      <div className={["timeline", focusMode ? "timeline--focus" : ""].join(" ")} style={timelineStyle}>
        <div className="timeline__controls">
          {buttons.map((button) => (
            <button
              key={button.key}
              className={[
                "btn",
                activePreset === button.key ? "btn--active" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => setActivePreset(button.key)}
            >
              {button.label}
            </button>
          ))}
          <div className="timeline__density">
            {(["cozy", "balanced", "compact"] as Density[]).map((option) => (
              <button
                key={option}
                type="button"
                className={[
                  "chip",
                  "chip--interactive",
                  "chip--density",
                  density === option ? "chip--on" : "",
                ].join(" ")}
                onClick={() => setDensity(option)}
              >
                {option === "cozy" ? "Comfort" : option === "balanced" ? "Balanced" : "Compact"}
              </button>
            ))}
            <button
              type="button"
              className={[
                "chip",
                "chip--interactive",
                focusMode ? "chip--on" : "",
              ].join(" ")}
              onClick={() => setFocusMode((prev) => !prev)}
            >
              {focusMode ? "Exit focus" : "Focus view"}
            </button>
          </div>
          <div className="timeline__grid-toggle" ref={gridToggleRef}>
            <button
              type="button"
              className="timeline__grid-trigger"
              onClick={(event) => {
                event.stopPropagation();
                setGridMenuOpen((prev) => !prev);
              }}
              onMouseDown={(event) => event.stopPropagation()}
              aria-label="Grid settings"
            >
              <span />
            </button>
            {gridMenuOpen && (
              <div className="timeline__grid-menu">
                <label className="timeline__grid-option" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    onClick={(event) => event.stopPropagation()}
                    checked={showMonthGrid}
                    onChange={() => setShowMonthGrid((prev) => !prev)}
                  />
                  <span>Month grid</span>
                </label>
                <label className="timeline__grid-option" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    onClick={(event) => event.stopPropagation()}
                    checked={showQuarterGrid}
                    onChange={() => setShowQuarterGrid((prev) => !prev)}
                  />
                  <span>Quarter grid</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="timeline__grid" ref={timelineRef}>
          <div className="timeline__viewport" ref={viewportRef}>
            <div className="timeline__content" style={contentWidth ? { width: `${contentWidth}px` } : undefined}>
              <div className="timeline__header">
                {months.map((month) => (
                  <div key={month.toISOString()} className="timeline__month">
                    {fmtMonth(month)}
                  </div>
                ))}
              </div>

              <div className="timeline__quarters" aria-hidden>
                {quarters.map((quarter) => (
                  <span
                    key={`${quarter.label}-${quarter.start.toISOString()}`}
                    className="timeline__quarter"
                    style={{ left: `${quarter.leftPct}%`, width: `${quarter.widthPct}%` }}
                  >
                    {quarter.label}
                  </span>
                ))}
              </div>

              <div className="timeline__canvas">
                {(showMonthGrid || showQuarterGrid) && (
                  <div className="timeline__gridlines">
                    {showMonthGrid &&
                      monthGridLines.map((pct, index) => (
                        <span key={`month-${index}`} className="timeline__gridline timeline__gridline--month" style={{ left: `${pct}%` }} />
                      ))}
                    {showQuarterGrid &&
                      quarterGridLines.map((pct, index) => (
                        <span key={`quarter-${index}`} className="timeline__gridline timeline__gridline--quarter" style={{ left: `${pct}%` }} />
                      ))}
                  </div>
                )}
                {showToday && (
                  <div
                    className="timeline__today"
                    style={{ left: `${todayPct}%` }}
                    aria-label={todayLabel}
                    role="button"
                    tabIndex={0}
                    onMouseEnter={() => setShowTodayDetail(true)}
                    onFocus={() => setShowTodayDetail(true)}
                    onMouseLeave={() => setShowTodayDetail(false)}
                    onBlur={() => setShowTodayDetail(false)}
                  >
                    <span className="timeline__today-label" data-align={todayAlign}>
                      Today
                    </span>
                    <span
                      className={["timeline__today-detail", showTodayDetail ? "is-visible" : ""].join(" ")}
                      data-align={todayAlign}
                    >
                      {todayReadable}
                    </span>
                  </div>
                )}
                <div className="timeline__rows">
                  {spans.map((span) => {
                const statusText = statusLabel[span.stKey] ?? "Open";
                const rangeText = formatRange(span.start, span.end);
                const onHover = handleBarHover(span);
                const isHovering = hovered?.id === span.g.id;
                const title = span.title;

                return (
                  <div key={span.g.id} className="timeline__row">
                        <div
                          className={[
                            "timeline__bar",
                            span.catClass,
                            span.stClass,
                            span.priClass,
                            span.isCompact ? "timeline__bar--compact" : "",
                            span.showOutside ? "timeline__bar--outside" : "",
                            isHovering ? "timeline__bar--active" : "",
                          ].filter(Boolean).join(" ")}
                          style={{
                            left: `${span.leftPct}%`,
                            width: `${span.widthPct}%`,
                            ["--bar-color" as string]: span.priorityBg,
                            ["--bar-color-strong" as string]: span.priorityBgStrong,
                            ["--bar-border" as string]: hexToRgba(span.priorityColor, 0.75),
                            ["--bar-shadow" as string]: `inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.55), 0 12px 26px -18px ${hexToRgba(span.priorityColor, 0.4)}`,
                          }}
                      aria-label={`${title} • ${statusText} • ${rangeText}`}
                      onMouseEnter={onHover}
                      onMouseMove={onHover}
                          onMouseLeave={clearHover}
                          onBlur={clearHover}
                          onClick={() => setEditingGoal(span.g)}
                          tabIndex={0}
                    >
                      <span
                        className={[
                          "timeline__title",
                          span.isCompact && !span.showOutside ? "timeline__title--compact" : "",
                          span.showOutside ? "timeline__title--outside-right" : "",
                        ].filter(Boolean).join(" ")}
                      >
                        {span.title}
                      </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {milestoneWindows.map((window) => (
                  <div
                    key={window.id}
                    className="timeline__window-highlight"
                    style={{ left: `${window.leftPct}%`, width: `${window.widthPct}%`, background: window.color }}
                  >
                    <span>{window.label}</span>
                  </div>
                ))}

                {milestonePoints.map((point) => (
                  <div
                    key={point.id}
                    className="timeline__point-line"
                    style={{ left: `${point.leftPct}%` }}
                  >
                    <span className="timeline__point-dot" style={{ borderColor: point.color, background: point.color }} />
                    <span className="timeline__point-label">{point.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {hovered && (
            <div
              className="timeline__hover-card"
              style={{ left: `${hovered.left}px`, top: `${hovered.top}px` }}
            >
              <div className="timeline__hover-title">{hovered.title}</div>
              <div className="timeline__hover-meta">{hovered.status} • {hovered.dateRange}</div>
            </div>
          )}
        </div>
      </div>

      <GoalEditor
        open={Boolean(editingGoal)}
        mode="edit"
        goal={editingGoal ?? undefined}
        onCancel={() => setEditingGoal(null)}
        onSave={(updated) => {
          updateGoal(updated as Goal);
          setEditingGoal(null);
        }}
      />
    </>
  );
}
