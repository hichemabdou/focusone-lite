"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { Goal, Priority, Status, useGoals } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";
import GoalEditor from "./GoalEditor";
import MilestoneEditor from "./MilestoneEditor";
import MilestonesPanel from "./MilestonesPanel";
import MilestonesList, { StandaloneMilestone } from "./MilestonesList";

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
// categoryColor will be replaced with useCustomization hook

function cloneGoal(goal: Goal): Goal {
  return {
    ...goal,
    comments: goal.comments.map((comment) => ({ ...comment })),
    milestone: goal.milestone
      ? goal.milestone.type === "point"
        ? { ...goal.milestone }
        : { ...goal.milestone }
      : null,
  };
}

function pickMilestoneIcon(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("age") || normalized.includes("birthday") || normalized.includes("anniversary")) return "🎂";
  if (normalized.includes("net worth") || normalized.includes("wealth") || normalized.includes("finance")) return "💰";
  if (normalized.includes("health") || normalized.includes("fitness") || normalized.includes("marathon")) return "💪";
  if (normalized.includes("career") || normalized.includes("promotion") || normalized.includes("launch")) return "🚀";
  if (normalized.includes("travel") || normalized.includes("trip") || normalized.includes("adventure")) return "✈️";
  return "◆";
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
  priorityBg: string;
  priorityBgStrong: string;
};

type MilestonePoint = { id: string; label: string; leftPct: number; color: string; icon: string };
type MilestoneWindowOverlay = {
  id: string;
  label: string;
  leftPct: number;
  widthPct: number;
  color: string;
  fill: string;
  border: string;
  shadow: string;
};

const statusLabel: Record<string, string> = {
  open: "Open",
  inprog: "In progress",
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Done",
};

const INLINE_STATUS_ACTIONS: Array<{ label: string; value: Status }> = [
  { label: "Open", value: "open" },
  { label: "In progress", value: "in-progress" },
  { label: "Blocked", value: "blocked" },
  { label: "Done", value: "done" },
];

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
  const { getCategoryColor, getPriorityColor, getStatusColor } = useCustomization();
  const items = useMemo(() => (visibleGoals ?? goals ?? []) as Goal[], [visibleGoals, goals]);
  
  // Drag state
  const [dragging, setDragging] = useState<{ goalId: string; type: "move" | "resize-start" | "resize-end" } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; startDate: Date; endDate: Date } | null>(null);

  type PresetKey = "fit" | "month" | "6m" | "ytd" | "next-ytd" | "5y";
  const [activePreset, setActivePreset] = useState<PresetKey>("fit");
  const [density, setDensity] = useState<Density>("compact");
  const [focusMode, setFocusMode] = useState(false);
  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [showMonthGrid, setShowMonthGrid] = useState(true);
  const [showQuarterGrid, setShowQuarterGrid] = useState(true);
  const [gridMenuOpen, setGridMenuOpen] = useState(false);
  const gridToggleRef = useRef<HTMLDivElement>(null);

  const targetRange = useMemo<Range>(() => {
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

  const range = useMemo<Range>(() => {
    const padMonths = activePreset === "month" ? 2 : activePreset === "5y" ? 0 : 1;
    const paddedStart = addMonths(new Date(targetRange.start), -padMonths);
    const paddedEnd = addMonths(new Date(targetRange.end), padMonths);
    return {
      start: startOfMonth(paddedStart),
      end: endOfMonth(paddedEnd),
    };
  }, [targetRange, activePreset]);

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
  const contentPixelWidth = contentWidth ?? pixelBasis;

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
        const showOutside = pixelWidth < Math.min(estimatedText, 200);
        const isCompact = pixelWidth < 200;
        const statusColor = getStatusColor(stKey);
        const priorityColor = getPriorityColor(goal.priority);
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
          priorityBg,
          priorityBgStrong,
        };
      }),
    [items, msStart, msSpan, pixelBasis, getStatusColor, getPriorityColor]
  );

  const [hovered, setHovered] = useState<HoverState | null>(null);
  const [showTodayDetail, setShowTodayDetail] = useState(false);
  const [inlineEditor, setInlineEditor] = useState<{ goalId: string; left: number; top: number } | null>(null);
  const [undoStack, setUndoStack] = useState<Goal[]>([]);
  const [milestoneGoal, setMilestoneGoal] = useState<Goal | null>(null);
  const [standaloneMilestones, setStandaloneMilestones] = useState<StandaloneMilestone[]>([]);

  const formatRange = (start: Date, end: Date) => {
    const startText = start.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const endText = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return `${startText} → ${endText}`;
  };
  const closeInlineEditor = useCallback(() => setInlineEditor(null), []);

  const stageUndo = useCallback((snapshot: Goal) => {
    setUndoStack((prev) => [snapshot, ...prev].slice(0, 25));
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (!prev.length) return prev;
      const [latest, ...rest] = prev;
      updateGoal(latest);
      return rest;
    });
  }, [updateGoal]);

  const activeInlineSpan = useMemo(() => {
    if (!inlineEditor) return null;
    return spans.find((span) => span.g.id === inlineEditor.goalId) ?? null;
  }, [inlineEditor, spans]);
  const inlineRangeSummary = activeInlineSpan ? formatRange(activeInlineSpan.start, activeInlineSpan.end) : "";
  const inlineGoal = activeInlineSpan?.g;
  const canUndo = undoStack.length > 0;

  const quickUpdateStatus = useCallback(
    (goal: Goal, nextStatus: Status) => {
      if (goal.status === nextStatus) return;
      stageUndo(cloneGoal(goal));
      updateGoal({ ...goal, status: nextStatus });
    },
    [stageUndo, updateGoal]
  );

  const handleClearMilestone = useCallback(
    (goal: Goal) => {
      if (!goal.milestone) return;
      stageUndo(goal);
      updateGoal({ ...goal, milestone: null });
    },
    [stageUndo, updateGoal]
  );

  const handleOpenGoal = useCallback(
    (goal: Goal) => {
      setEditingGoal(goal);
      closeInlineEditor();
    },
    [closeInlineEditor]
  );

  const { milestonePoints, milestoneWindows } = useMemo(() => {
    const points: MilestonePoint[] = [];
    const windows: MilestoneWindowOverlay[] = [];
    items.forEach((goal) => {
      const ms = goal.milestone;
      if (!ms) return;
      const baseColor = ms.color ?? getCategoryColor(goal.category);
      if (ms.type === "point") {
        const leftPct = clampNum(((parseISO(ms.date).getTime() - msStart) / msSpan) * 100, -5, 105);
        points.push({
          id: ms.id ?? `${goal.id}-point`,
          label: ms.label ?? "Milestone",
          leftPct,
          color: baseColor,
          icon: pickMilestoneIcon(ms.label ?? goal.title ?? "Milestone"),
        });
      } else {
        const startPct = clampNum(((parseISO(ms.windowStart).getTime() - msStart) / msSpan) * 100, -5, 105);
        const endPct = clampNum(((parseISO(ms.windowEnd).getTime() - msStart) / msSpan) * 100, -5, 105);
        const windowFill = hexToRgba(baseColor, 0.18);
        const windowBorder = hexToRgba(baseColor, 0.45);
        windows.push({
          id: ms.id ?? `${goal.id}-window`,
          label: ms.label ?? "Focus window",
          leftPct: Math.min(startPct, endPct),
          widthPct: Math.max(2, Math.abs(endPct - startPct)),
          color: baseColor,
          fill: windowFill,
          border: windowBorder,
          shadow: hexToRgba(baseColor, 0.32),
        });
      }
    });
    return { milestonePoints: points, milestoneWindows: windows };
  }, [items, msSpan, msStart, getCategoryColor]);

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
  const rowsScrollRef = useRef<HTMLDivElement>(null);
  const dragOriginalRef = useRef<Goal | null>(null);
  const dragMutatedRef = useRef(false);
  const handleBarHover = (payload: SpanInfo) => (event: ReactMouseEvent<HTMLDivElement>) => {
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

  const openInlineEditor = (span: SpanInfo, event: ReactMouseEvent<HTMLDivElement>) => {
    const gridEl = timelineRef.current;
    if (!gridEl) return;
    const gridRect = gridEl.getBoundingClientRect();
    const barRect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    const centerX = barRect.left - gridRect.left + barRect.width / 2;
    const top = Math.max(12, barRect.top - gridRect.top - 20);
    const left = clampNum(centerX, 140, gridRect.width - 140);
    setInlineEditor({ goalId: span.g.id, left, top });
  };

  const today = new Date();
  const todayPct = clampNum(((today.getTime() - msStart) / msSpan) * 100, -5, 105);
  const showToday = todayPct >= 0 && todayPct <= 100;
  const todayReadable = today.toLocaleString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const todayLabel = `Today · ${todayReadable}`;
  const todayAlign: "left" | "center" | "right" = todayPct < 6 ? "left" : todayPct > 94 ? "right" : "center";

  const centerOnToday = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      if (!showToday) return;
      const viewportEl = viewportRef.current;
      if (!viewportEl) return;
      const maxScroll = Math.max(0, contentPixelWidth - viewportEl.clientWidth);
      const target = clampNum(((todayPct / 100) * contentPixelWidth) - viewportEl.clientWidth / 2, 0, maxScroll);
      viewportEl.scrollTo({ left: target, behavior });
    },
    [showToday, todayPct, contentPixelWidth]
  );


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
    const handleClick = (event: globalThis.MouseEvent) => {
      const target = event.target as Node;
      if (gridToggleRef.current && !gridToggleRef.current.contains(target)) {
        setGridMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [gridMenuOpen]);

  useEffect(() => {
    if (!inlineEditor) return;
    const handleClickAway = (event: globalThis.MouseEvent) => {
      if (!timelineRef.current) return;
      if (!timelineRef.current.contains(event.target as Node)) {
        closeInlineEditor();
      }
    };
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeInlineEditor();
    };
    const viewportEl = viewportRef.current;
    const rowsEl = rowsScrollRef.current;
    document.addEventListener("mousedown", handleClickAway);
    document.addEventListener("keydown", handleKey);
    viewportEl?.addEventListener("scroll", closeInlineEditor);
    rowsEl?.addEventListener("scroll", closeInlineEditor);
    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      document.removeEventListener("keydown", handleKey);
      viewportEl?.removeEventListener("scroll", closeInlineEditor);
      rowsEl?.removeEventListener("scroll", closeInlineEditor);
    };
  }, [inlineEditor, closeInlineEditor]);

  useEffect(() => {
    const viewportEl = viewportRef.current;
    const rowsEl = rowsScrollRef.current;
    if (!viewportEl || !rowsEl) return;

    const syncRowsScroll = () => {
      rowsEl.scrollLeft = viewportEl.scrollLeft;
    };

    const lockRowsHorizontal = () => {
      if (rowsEl.scrollLeft !== 0) {
        rowsEl.scrollLeft = 0;
      }
    };

    const forwardWheel = (event: globalThis.WheelEvent) => {
      if (!viewportEl) return;
      if (event.ctrlKey) return;
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      viewportEl.scrollLeft += event.deltaX;
    };

    viewportEl.addEventListener("scroll", syncRowsScroll, { passive: true });
    rowsEl.addEventListener("wheel", forwardWheel, { passive: false });
    rowsEl.addEventListener("scroll", lockRowsHorizontal, { passive: true });
    syncRowsScroll();

    return () => {
      viewportEl.removeEventListener("scroll", syncRowsScroll);
      rowsEl.removeEventListener("wheel", forwardWheel);
      rowsEl.removeEventListener("scroll", lockRowsHorizontal);
    };
  }, []);

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
  useEffect(() => {
    if (focusMode) {
      centerOnToday("smooth");
    }
  }, [focusMode, centerOnToday]);
  useEffect(() => {
    centerOnToday("auto");
  }, [contentPixelWidth, centerOnToday]);

  useEffect(() => {
    const viewportEl = viewportRef.current;
    if (!viewportEl) return;

    const handleWheel = (event: globalThis.WheelEvent) => {
      if (event.ctrlKey) return;
      const canScroll = viewportEl.scrollWidth > viewportEl.clientWidth;
      if (!canScroll) return;
      const mostlyHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const horizontalDelta = mostlyHorizontal ? event.deltaX : event.shiftKey ? event.deltaY : 0;
      if (!horizontalDelta) return;
      event.preventDefault();
      viewportEl.scrollLeft += horizontalDelta;
    };

    viewportEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewportEl.removeEventListener("wheel", handleWheel);
  }, []);

  // Drag handlers
  const handleBarMouseDown = (span: SpanInfo, type: "move" | "resize-start" | "resize-end") => (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    closeInlineEditor();
    dragOriginalRef.current = cloneGoal(span.g);
    dragMutatedRef.current = false;
    setDragging({ goalId: span.g.id, type });
    setDragStart({
      x: e.clientX,
      startDate: span.start,
      endDate: span.end,
    });
  };

  useEffect(() => {
    if (!dragging || !dragStart) return;

    let lastUpdate = 0;
    const throttleMs = 16; // ~60fps

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdate < throttleMs) return;
      lastUpdate = now;

      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStart.x;
      const deltaPct = (deltaX / rect.width) * 100;
      const deltaMs = (deltaPct / 100) * msSpan;

      const goal = items.find((g) => g.id === dragging.goalId);
      if (!goal) return;

      let newStart = new Date(dragStart.startDate);
      let newEnd = new Date(dragStart.endDate);

      if (dragging.type === "move") {
        newStart = new Date(dragStart.startDate.getTime() + deltaMs);
        newEnd = new Date(dragStart.endDate.getTime() + deltaMs);
      } else if (dragging.type === "resize-start") {
        newStart = new Date(dragStart.startDate.getTime() + deltaMs);
        if (newStart >= newEnd) newStart = new Date(newEnd.getTime() - 86400000); // Min 1 day
      } else if (dragging.type === "resize-end") {
        newEnd = new Date(dragStart.endDate.getTime() + deltaMs);
        if (newEnd <= newStart) newEnd = new Date(newStart.getTime() + 86400000); // Min 1 day
      }

      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      updateGoal({
        ...goal,
        startDate: formatDate(newStart),
        endDate: formatDate(newEnd),
      });
      dragMutatedRef.current = true;
    };

    const handleMouseUp = () => {
      setDragging(null);
      setDragStart(null);
      if (dragMutatedRef.current && dragOriginalRef.current) {
        stageUndo(dragOriginalRef.current);
      }
      dragOriginalRef.current = null;
      dragMutatedRef.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove as (event: globalThis.MouseEvent) => void, { passive: true });
    document.addEventListener("mouseup", handleMouseUp as (event: globalThis.MouseEvent) => void);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove as (event: globalThis.MouseEvent) => void);
      document.removeEventListener("mouseup", handleMouseUp as (event: globalThis.MouseEvent) => void);
    };
  }, [dragging, dragStart, msSpan, items, updateGoal, stageUndo]);

  return (
    <>
      {focusMode && <div className="timeline__focus-backdrop" onClick={() => setFocusMode(false)} />}
      <div className={["timeline", focusMode ? "timeline--focus" : "", milestonesOpen ? "timeline--milestones" : ""].filter(Boolean).join(" ")} style={timelineStyle}>
        <div className="timeline__toolbar">
          <div className="timeline__preset-group">
            {buttons.map((button) => (
              <button
                key={button.key}
                className={["btn", activePreset === button.key ? "btn--active" : ""].filter(Boolean).join(" ")}
                onClick={() => {
                  setActivePreset(button.key);
                  centerOnToday("auto");
                }}
              >
                {button.label}
              </button>
            ))}
          </div>
          <div className="timeline__toolbar-actions">
            <button type="button" className="chip chip--interactive timeline__action-chip" onClick={() => centerOnToday("smooth")}>
              Jump to today
            </button>
            <div className="timeline__grid-toggle" ref={gridToggleRef}>
              <button
                type="button"
                className={`timeline__grid-trigger ${gridMenuOpen ? 'is-active' : ''}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setGridMenuOpen((prev) => !prev);
                }}
                onMouseDown={(event) => event.stopPropagation()}
                aria-label="Grid settings"
                title="Toggle grid visibility"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
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
        </div>

        <div className="timeline__secondary">
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
          </div>
          <div className="timeline__secondary-actions">
            <button
              type="button"
              className={[
                "chip",
                "chip--interactive",
                "timeline__action-chip",
                focusMode ? "chip--on" : "",
              ].join(" ")}
              onClick={() => setFocusMode((prev) => !prev)}
            >
              {focusMode ? "Exit focus" : "Focus view"}
            </button>
            <button
              type="button"
              className={[
                "chip",
                "chip--interactive",
                "timeline__action-chip",
                "timeline__undo-btn",
                canUndo ? "" : "timeline__action-chip--disabled",
              ].filter(Boolean).join(" ")}
              disabled={!canUndo}
              onClick={handleUndo}
              title="Undo last change"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6"/>
                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
              </svg>
              Undo
            </button>
          </div>
        </div>

        <div className="timeline__grid" ref={timelineRef}>
          <div className="timeline__shell">
            <div className="timeline__viewport" ref={viewportRef}>
              <div className="timeline__content" style={contentWidth ? { width: `${contentWidth}px` } : undefined}>
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
                    <button
                      type="button"
                      className="timeline__today"
                      style={{ left: `${todayPct}%` }}
                      aria-label={todayLabel}
                      onMouseEnter={() => setShowTodayDetail(true)}
                      onFocus={() => setShowTodayDetail(true)}
                      onMouseLeave={() => setShowTodayDetail(false)}
                      onBlur={() => setShowTodayDetail(false)}
                      onClick={() => centerOnToday("smooth")}
                    >
                      <span className="timeline__today-beam" aria-hidden />
                      <span className="timeline__today-dot" aria-hidden />
                      <span className="timeline__today-pill" data-align={todayAlign}>
                        Today
                      </span>
                      <span
                        className={["timeline__today-detail", showTodayDetail ? "is-visible" : ""].join(" ")}
                        data-align={todayAlign}
                        aria-hidden={!showTodayDetail}
                      >
                        {todayReadable}
                      </span>
                    </button>
                  )}
                <div className="timeline__rows-viewport" ref={rowsScrollRef}>
                  <div className="timeline__head">
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
                  </div>

                  <div className="timeline__rows">
                    {spans.map((span) => {
                      const statusText = statusLabel[span.stKey] ?? "Open";
                      const rangeText = formatRange(span.start, span.end);
                      const onHover = handleBarHover(span);
                      const isHovering = hovered?.id === span.g.id;
                      const title = span.title;
                      const isDragging = dragging?.goalId === span.g.id;
                      const statusBorder = hexToRgba(span.statusColor, 0.85);
                      const statusGlow = hexToRgba(span.statusColor, 0.35);

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
                              isDragging ? "timeline__bar--dragging" : "",
                            ].filter(Boolean).join(" ")}
                            style={{
                              left: `${span.leftPct}%`,
                              width: `${span.widthPct}%`,
                              ["--bar-color" as string]: span.priorityBg,
                              ["--bar-color-strong" as string]: span.priorityBgStrong,
                              ["--bar-border" as string]: statusBorder,
                              ["--bar-shadow" as string]: `0 0 0 1px ${statusBorder}, 0 14px 32px -20px ${statusGlow}, inset 0 1px 0 rgba(255,255,255,.08)`,
                            }}
                            aria-label={`${title} • ${statusText} • ${rangeText}`}
                            onMouseEnter={onHover}
                            onMouseMove={onHover}
                            onMouseLeave={clearHover}
                            onBlur={clearHover}
                            onClick={(e) => {
                              if (!isDragging) openInlineEditor(span, e);
                            }}
                            onMouseDown={handleBarMouseDown(span, "move")}
                            tabIndex={0}
                          >
                            {!span.isCompact && (
                              <>
                                <div
                                  className="timeline__bar-resize timeline__bar-resize--start"
                                  onMouseDown={handleBarMouseDown(span, "resize-start")}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div
                                  className="timeline__bar-resize timeline__bar-resize--end"
                                  onMouseDown={handleBarMouseDown(span, "resize-end")}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </>
                            )}
                            <div className="timeline__bar-body">
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
                        </div>
                      );
                    })}
                  </div>
                </div>

                {milestoneWindows.map((window) => (
                  <div
                    key={window.id}
                    className="timeline__window-highlight"
                    style={{
                      left: `${window.leftPct}%`,
                      width: `${window.widthPct}%`,
                      background: `linear-gradient(120deg, ${window.fill}, rgba(15,17,23,.92))`,
                      borderColor: window.border,
                      boxShadow: `0 20px 50px -30px ${window.shadow}`,
                    }}
                  >
                    <span className="timeline__window-label">{window.label}</span>
                  </div>
                ))}

                {milestonePoints.map((point) => (
                  <div
                    key={point.id}
                    className="timeline__point-line"
                    style={{ left: `${point.leftPct}%` }}
                  >
                    <span className="timeline__point-dot" style={{ borderColor: point.color, background: point.color }}>
                      <span>{point.icon}</span>
                    </span>
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
          {inlineEditor && inlineGoal && (
            <div
              className="timeline__inline-editor"
              style={{ left: `${inlineEditor.left}px`, top: `${inlineEditor.top}px` }}
            >
              <div className="timeline__inline-head">
                <div>
                  <p className="timeline__inline-eyebrow">Quick edit</p>
                  <h4 className="timeline__inline-title">{inlineGoal.title || "Untitled goal"}</h4>
                  <span className="timeline__inline-meta">{inlineRangeSummary}</span>
                </div>
                <button type="button" className="timeline__inline-close" onClick={closeInlineEditor} aria-label="Close quick editor">
                  ×
                </button>
              </div>
              <div className="timeline__inline-group">
                {INLINE_STATUS_ACTIONS.map((action) => (
                  <button
                    key={action.value}
                    type="button"
                    className={[
                      "timeline__inline-button",
                      inlineGoal.status === action.value ? "is-active" : "",
                    ].join(" ")}
                    onClick={() => quickUpdateStatus(inlineGoal, action.value)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <div className="timeline__inline-group timeline__inline-group--secondary">
                <button type="button" className="timeline__inline-button" onClick={() => handleOpenGoal(inlineGoal)}>
                  Edit goal
                </button>
                <button type="button" className="timeline__inline-button" onClick={handleUndo} disabled={!canUndo}>
                  Undo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <MilestonesList
        milestones={standaloneMilestones}
        onAdd={(milestone) => {
          setStandaloneMilestones((prev) => [...prev, { ...milestone, id: crypto.randomUUID() }]);
        }}
        onEdit={(milestone) => {
          setStandaloneMilestones((prev) => prev.map((m) => (m.id === milestone.id ? milestone : m)));
        }}
        onDelete={(id) => {
          setStandaloneMilestones((prev) => prev.filter((m) => m.id !== id));
        }}
      />
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
      <MilestoneEditor
        open={Boolean(milestoneGoal)}
        goal={milestoneGoal}
        onClose={() => setMilestoneGoal(null)}
        onSave={(next) => {
          updateGoal(next);
          setMilestoneGoal(null);
        }}
      />
      <MilestonesPanel
        open={milestonesOpen}
        goals={items}
        onClose={() => setMilestonesOpen(false)}
        onEdit={(goal) => {
          setMilestoneGoal(goal);
          setMilestonesOpen(false);
        }}
        onClear={handleClearMilestone}
      />
    </>
  );
}
