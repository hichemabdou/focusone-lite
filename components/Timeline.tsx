"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { Goal, Priority, Status, useGoals } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";
import GoalEditor from "./GoalEditor";
import MilestoneEditor from "./MilestoneEditor";
import MilestonesPanel from "./MilestonesPanel";
import MilestoneCreator from "./MilestoneCreator";
import TimelineContextMenu from "./TimelineContextMenu";
import GoalActionToolbar from "./GoalActionToolbar";
import TimelineBar from "./TimelineBar";
import CalendarView from "./CalendarView";
import { Calendar as CalendarIcon, LayoutList } from "lucide-react";

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
  rowIndex: number;
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
  { label: "Idea", value: "idea" },
  { label: "Planned", value: "planned" },
  { label: "Active", value: "active" },
  { label: "On Hold", value: "on-hold" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const PRIORITY_TINTS: Record<string, { base: number; strong: number }> = {
  p4: { base: 0.18, strong: 0.35 }, // Low
  p3: { base: 0.25, strong: 0.45 }, // Medium
  p2: { base: 0.32, strong: 0.55 }, // High
  p1: { base: 0.4, strong: 0.65 },  // Critical
};

const PRESETS: Record<string, string> = {
  fit: "Fit all",
  month: "This month",
  "6m": "6 months",
  ytd: "Year to date",
  "next-ytd": "Next year to date",
  "5y": "Next 5 years",
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
  const { visibleGoals, goals, updateGoal, addGoal, deleteGoal } = useGoals();
  const { getCategoryColor, getPriorityColor, getStatusColor, categories } = useCustomization();

  // Direct goal creation (smooth temporary goal - no notification spam)
  const [tempGoal, setTempGoal] = useState<Goal | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<{ x: number; y: number; pct: number; date: string; show: boolean }>({ x: 0, y: 0, pct: 0, date: '', show: false });
  const [cursorGuide, setCursorGuide] = useState<{ pct: number; show: boolean }>({ pct: 0, show: false });
  const [isHoveringEmpty, setIsHoveringEmpty] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tempGoalStartPct = useRef<number>(0);

  // Include temp goal in items if it exists (so it renders while dragging)
  const items = useMemo(() => {
    const baseItems = (visibleGoals ?? goals ?? []) as Goal[];
    return tempGoal ? [...baseItems, tempGoal] : baseItems;
  }, [visibleGoals, goals, tempGoal]);

  // Drag state
  const [dragging, setDragging] = useState<{ goalId: string; type: "move" | "resize-start" | "resize-end" } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; startDate: Date; endDate: Date } | null>(null);

  type PresetKey = "fit" | "month" | "6m" | "ytd" | "next-ytd" | "5y";
  const [activePreset, setActivePreset] = useState<PresetKey>("fit");
  const [density, setDensity] = useState<Density>("compact");
  const [focusMode, setFocusMode] = useState(false);
  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const [viewType, setViewType] = useState<"timeline" | "calendar">("timeline"); // New view state
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [showMonthGrid, setShowMonthGrid] = useState(true);
  const [showQuarterGrid, setShowQuarterGrid] = useState(true);
  const [gridMenuOpen, setGridMenuOpen] = useState(false);
  const gridToggleRef = useRef<HTMLDivElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track the bounding rect of the currently selected goal for the toolbar
  const [activeGoalRect, setActiveGoalRect] = useState<{ x: number; y: number; width: number } | null>(null);

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
    () => {
      // 1. Create basic span objects
      const rawSpans = items.map((goal) => {
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
          rowIndex: 0, // Placeholder
        };
      });

      // 2. Sort by start date for better packing
      rawSpans.sort((a, b) => a.start.getTime() - b.start.getTime());

      // 3. Pack rows (Greedy algorithm)
      const rows: number[] = []; // Stores the end time (pct) of the last item in each row

      return rawSpans.map(span => {
        let placed = false;
        let rowIndex = 0;

        // Try to fit in existing rows
        for (let i = 0; i < rows.length; i++) {
          // Add a small buffer (0.5%) to prevent visual touching
          if (rows[i] + 0.5 <= span.leftPct) {
            span.rowIndex = i;
            rows[i] = span.leftPct + span.widthPct;
            placed = true;
            rowIndex = i;
            break;
          }
        }

        // If didn't fit, start a new row
        if (!placed) {
          span.rowIndex = rows.length;
          rows.push(span.leftPct + span.widthPct);
          rowIndex = rows.length - 1;
        }

        return span;
      });
    },
    [items, msStart, msSpan, pixelBasis, getStatusColor, getPriorityColor]
  );

  const [hovered, setHovered] = useState<HoverState | null>(null);
  const [showTodayDetail, setShowTodayDetail] = useState(false);
  const [inlineEditor, setInlineEditor] = useState<{ goalId: string; left: number; top: number } | null>(null);
  const [undoStack, setUndoStack] = useState<Goal[]>([]);
  const [redoStack, setRedoStack] = useState<Goal[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; goalId: string } | null>(null);
  const [selectedGoalIds, setSelectedGoalIds] = useState<Set<string>>(new Set());
  const [marqueeBox, setMarqueeBox] = useState<{ x: number; y: number; width: number; height: number; startX: number; startY: number } | null>(null);
  const [milestoneGoal, setMilestoneGoal] = useState<Goal | null>(null);

  // Milestone structure supporting both points and windows
  type Milestone = {
    id: string;
    type: "point" | "window";
    label: string;
    date?: string; // for point type
    startDate?: string; // for window type
    endDate?: string; // for window type
    color: string;
    icon?: string; // only for point type
  };

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showMilestoneCreator, setShowMilestoneCreator] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [showMilestonesList, setShowMilestonesList] = useState(false);

  const formatRange = (start: Date, end: Date) => {
    const startText = start.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const endText = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return `${startText} → ${endText}`;
  };
  const closeInlineEditor = useCallback(() => setInlineEditor(null), []);

  const stageUndo = useCallback((snapshot: Goal) => {
    setUndoStack((prev) => [snapshot, ...prev].slice(0, 25));
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (!prev.length) return prev;
      const [latest, ...rest] = prev;
      const current = goals.find((goal) => goal.id === latest.id);
      if (current) {
        setRedoStack((redoPrev) => [cloneGoal(current), ...redoPrev].slice(0, 25));
      }
      updateGoal(latest);
      return rest;
    });
  }, [goals, updateGoal]);

  const handleRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (!prev.length) return prev;
      const [latest, ...rest] = prev;
      const current = goals.find((goal) => goal.id === latest.id);
      if (current) {
        setUndoStack((undoPrev) => [cloneGoal(current), ...undoPrev].slice(0, 25));
      }
      updateGoal(latest);
      return rest;
    });
  }, [goals, updateGoal]);

  const activeInlineSpan = useMemo(() => {
    if (!inlineEditor) return null;
    return spans.find((span) => span.g.id === inlineEditor.goalId) ?? null;
  }, [inlineEditor, spans]);
  const inlineRangeSummary = activeInlineSpan ? formatRange(activeInlineSpan.start, activeInlineSpan.end) : "";
  const inlineGoal = activeInlineSpan?.g;
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

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

  const handleOpenGoal = (goal: Goal) => {
    setEditingGoal(goal);
  };

  const handleCloseGoal = () => {
    setEditingGoal(null);
  };

  const handleBarClick = useCallback((span: SpanInfo, event: ReactMouseEvent<HTMLDivElement>) => {
    if (dragging) return;

    // Multi-selection logic (Cmd/Ctrl + Click)
    if (event.metaKey || event.ctrlKey) {
      event.stopPropagation();
      setSelectedGoalIds(prev => {
        const next = new Set(prev);
        if (next.has(span.g.id)) {
          next.delete(span.g.id);
        } else {
          next.add(span.g.id);
        }
        return next;
      });
      return; // Don't proceed to editor logic
    }

    // If clicking a goal that's part of a multi-selection, don't open editor
    if (selectedGoalIds.size > 1 && selectedGoalIds.has(span.g.id)) {
      // Just clicked within the selection, do nothing (maybe user wants to drag soon, or right-click)
      return;
    }

    // Clear other selections and select this one
    setSelectedGoalIds(new Set([span.g.id]));

    // Capture the bounding rect immediately (before event is pooled)
    const barRect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    const gridEl = timelineRef.current;

    if (gridEl) {
      const gridRect = gridEl.getBoundingClientRect();
      // Calculate position relative to the grid container
      // This ensures it moves with the scroll if the toolbar is absolute inside the grid
      setActiveGoalRect({
        x: barRect.left - gridRect.left + gridEl.scrollLeft, // Add scrollLeft if needed, but grid usually scrolls via viewport
        y: barRect.top - gridRect.top,
        width: barRect.width
      });
    }

    // Clear any existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
  }, [dragging, selectedGoalIds]);

  const handleBarDoubleClick = useCallback((span: SpanInfo) => {
    if (dragging) return;

    // Clear the single click timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    // Close inline editor if open
    closeInlineEditor();

    // Open full editor
    handleOpenGoal(span.g);
  }, [dragging, handleOpenGoal, closeInlineEditor]);

  const handleContextMenu = useCallback((span: SpanInfo, event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      goalId: span.g.id,
    });
    closeInlineEditor();
  }, [closeInlineEditor]);

  // Direct drawing: Convert percentage to date
  const percentageToDate = useCallback((pct: number): string => {
    const clampedPct = Math.max(0, Math.min(100, pct));
    const timestamp = msStart + ((clampedPct / 100) * msSpan);
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, [msStart, msSpan]);

  const handleCanvasHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Don't show tooltip if creating goal or dragging
    if (tempGoal || dragging) {
      setHoverTooltip({ x: 0, y: 0, pct: 0, date: '', show: false });
      setCursorGuide({ pct: 0, show: false });
      setIsHoveringEmpty(false);
      return;
    }

    // Check if hovering over empty space (not on bars, milestones, etc.)
    const target = e.target as HTMLElement;
    const isOverElement = target.closest('.timeline__bar') ||
      target.closest('.timeline__milestone-marker') ||
      target.closest('.timeline__today') ||
      target.closest('button') ||
      target.closest('.timeline__header') ||
      target.closest('.timeline__quarters');

    if (isOverElement) {
      setHoverTooltip({ x: 0, y: 0, pct: 0, date: '', show: false });
      setCursorGuide({ pct: 0, show: false });
      setIsHoveringEmpty(false);
      return;
    }

    // Calculate cursor position
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const relativeX = e.clientX - rect.left + viewport.scrollLeft;
    const pct = (relativeX / rect.width) * 100;
    const cursorDate = percentageToDate(pct);

    // Format date for display
    const dateObj = new Date(cursorDate);
    const formattedDate = dateObj.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Show cursor guide and hover state immediately
    setCursorGuide({ pct, show: true });
    setIsHoveringEmpty(true);

    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Show tooltip instantly for better discoverability
    setHoverTooltip({
      x: e.clientX,
      y: e.clientY,
      pct,
      date: formattedDate,
      show: true
    });
  }, [tempGoal, dragging, percentageToDate]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Hide tooltip and cursor guide when clicking
    setHoverTooltip({ x: 0, y: 0, pct: 0, date: '', show: false });
    setCursorGuide({ pct: 0, show: false });
    setIsHoveringEmpty(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Don't start creating if already creating or dragging
    if (dragging || tempGoal) return;

    // Don't interact if clicking on a goal bar, milestone, or interactive element
    const target = e.target as HTMLElement;
    if (target.closest('.timeline__bar') ||
      target.closest('.timeline__milestone-marker') ||
      target.closest('.timeline__today') ||
      target.closest('button')) {
      return;
    }

    // Clear selection if clicking empty space (unless Shift/Cmd held)
    // But if we are starting a marquee, we might want to keep selection if Shift is held.
    // Standard behavior: Click on empty space clears selection. Drag starts marquee.
    if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
      setSelectedGoalIds(new Set());
      setActiveGoalRect(null);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // CHECK FOR CREATION (Cmd/Ctrl + Drag)
    if (e.metaKey || e.ctrlKey) {
      const viewport = viewportRef.current;
      if (!viewport) return;

      // Calculate position accounting for scroll
      const relativeX = e.clientX - rect.left + viewport.scrollLeft;
      const pct = (relativeX / rect.width) * 100;
      const startDate = percentageToDate(pct);

      // Create temporary goal
      const newTempGoal: Goal = {
        id: `temp-${Date.now()}`,
        title: "✨ New Goal",
        startDate,
        endDate: startDate,
        category: categories[0]?.name || "FINANCE",
        priority: "p3",
        status: "idea",
        notes: "",
        milestone: null,
        comments: []
      };

      setTempGoal(newTempGoal);
      tempGoalStartPct.current = pct;
      return;
    }

    // DEFAULT: MARQUEE SELECTION (No modifier or Shift)
    setMarqueeBox({
      x, y, width: 0, height: 0, startX: x, startY: y
    });
  }, [dragging, tempGoal, percentageToDate, categories]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Handle Marquee Update
    if (marqueeBox) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMarqueeBox(prev => {
        if (!prev) return null;
        const width = Math.abs(x - prev.startX);
        const height = Math.abs(y - prev.startY);
        const newX = Math.min(x, prev.startX);
        const newY = Math.min(y, prev.startY);

        // Live Selection Update
        const selectionRect = {
          left: newX,
          top: newY,
          right: newX + width,
          bottom: newY + height
        };

        const newSelection = new Set<string>(e.shiftKey ? selectedGoalIds : new Set()); // Shift adds to selection

        const bars = canvas.querySelectorAll('.timeline__bar');
        bars.forEach((bar, index) => {
          if (index < spans.length) {
            const span = spans[index];
            const barRect = bar.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();

            const barRelative = {
              left: barRect.left - canvasRect.left,
              top: barRect.top - canvasRect.top,
              right: barRect.right - canvasRect.left,
              bottom: barRect.bottom - canvasRect.top
            };

            const intersects = !(
              barRelative.left > selectionRect.right ||
              barRelative.right < selectionRect.left ||
              barRelative.top > selectionRect.bottom ||
              barRelative.bottom < selectionRect.top
            );

            if (intersects) {
              newSelection.add(span.g.id);
            }
          }
        });

        setSelectedGoalIds(newSelection);

        return { ...prev, x: newX, y: newY, width, height };
      });
      return;
    }

    // If we're creating a goal, resize it as we drag (smooth local update!)
    if (tempGoal) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const viewport = viewportRef.current;
      if (!viewport) return;

      const relativeX = e.clientX - rect.left + viewport.scrollLeft;
      const pct = (relativeX / rect.width) * 100;
      const currentDate = percentageToDate(pct);

      // Always extend from the start point where you clicked
      // The bar grows in the direction you're dragging
      const startDate = percentageToDate(tempGoalStartPct.current);
      const isDraggingRight = pct >= tempGoalStartPct.current;

      // Update temp goal to extend from click point to cursor
      setTempGoal(prev => {
        if (!prev) return null;
        return {
          ...prev,
          startDate: isDraggingRight ? startDate : currentDate,
          endDate: isDraggingRight ? currentDate : startDate
        };
      });
    } else {
      // Otherwise, handle hover tooltip
      handleCanvasHover(e);
    }
  }, [tempGoal, percentageToDate, handleCanvasHover]);

  const handleCanvasMouseLeave = useCallback(() => {
    setHoverTooltip({ x: 0, y: 0, pct: 0, date: '', show: false });
    setCursorGuide({ pct: 0, show: false });
    setIsHoveringEmpty(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  }, []);

  const handleCanvasDoubleClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Calculate position accounting for scroll
    const relativeX = e.clientX - rect.left + viewport.scrollLeft;
    const pct = (relativeX / rect.width) * 100;
    const startDate = percentageToDate(pct);

    // Create a default 1-week goal
    const startObj = new Date(startDate);
    const endObj = new Date(startObj);
    endObj.setDate(endObj.getDate() + 7);
    const endDate = `${endObj.getFullYear()}-${String(endObj.getMonth() + 1).padStart(2, '0')}-${String(endObj.getDate()).padStart(2, '0')}`;

    const newGoal: Omit<Goal, "id"> = {
      title: "✨ New Goal",
      startDate,
      endDate,
      category: categories[0]?.name || "FINANCE",
      priority: "p3",
      status: "idea",
      notes: "",
      milestone: null,
      comments: []
    };

    const created = await addGoal(newGoal);
    if (created) {
      setSelectedGoalIds(new Set([created.id]));
      // Calculate position for toolbar
      const gridEl = timelineRef.current;
      if (gridEl) {
        const gridRect = gridEl.getBoundingClientRect();
        const startPct = pct;
        const endPct = ((endObj.getTime() - msStart) / msSpan) * 100;
        const left = (Math.min(startPct, endPct) / 100) * gridRect.width;
        const width = (Math.abs(endPct - startPct) / 100) * gridRect.width;

        // We need to find the row index for the new goal. 
        // Since we just added it, it will be packed in the next render.
        // For now, we can just center the toolbar or put it at a default top.
        // Ideally, we wait for layout effect, but this is a good approximation.
        const top = 60;

        setActiveGoalRect({ x: left, y: top, width });
      }
      handleOpenGoal(created);
    }
  }, [addGoal, categories, percentageToDate, msStart, msSpan]);

  const handleCanvasMouseUp = useCallback(async () => {
    // Handle Marquee Finalization
    if (marqueeBox) {
      setMarqueeBox(null);
      return;
    }

    if (!tempGoal) return;

    // Ensure dates are in correct order
    const start = new Date(tempGoal.startDate);
    const end = new Date(tempGoal.endDate);

    // If the bar is too small (less than 1 day), make it at least 7 days
    const daysDiff = Math.abs((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    let finalStartDate = tempGoal.startDate;
    let finalEndDate = tempGoal.endDate;

    if (daysDiff < 1) {
      // Make it a reasonable default size (7 days)
      const baseDate = new Date(start < end ? tempGoal.startDate : tempGoal.endDate);
      const extendedDate = new Date(baseDate);
      extendedDate.setDate(extendedDate.getDate() + 7);
      finalStartDate = start < end ? tempGoal.startDate : `${extendedDate.getFullYear()}-${String(extendedDate.getMonth() + 1).padStart(2, '0')}-${String(extendedDate.getDate()).padStart(2, '0')}`;
      finalEndDate = start < end ? `${extendedDate.getFullYear()}-${String(extendedDate.getMonth() + 1).padStart(2, '0')}-${String(extendedDate.getDate()).padStart(2, '0')}` : tempGoal.endDate;
    }

    const finalGoal: Goal = start > end ? {
      ...tempGoal,
      id: crypto.randomUUID(), // Generate proper ID
      startDate: finalEndDate,
      endDate: finalStartDate
    } : {
      ...tempGoal,
      id: crypto.randomUUID(), // Generate proper ID
      startDate: finalStartDate,
      endDate: finalEndDate
    };

    // Clear temp goal immediately for smooth UI
    setTempGoal(null);

    // Create the real goal in the system (single API call + single notification)
    const { id, ...goalData } = finalGoal; // Remove ID for addGoal
    const createdGoal = await addGoal(goalData);

    // Select the new goal immediately so the toolbar appears
    if (createdGoal) {
      setSelectedGoalIds(new Set([createdGoal.id]));

      // We need to calculate where the bar will be
      const gridEl = timelineRef.current;
      if (gridEl) {
        const gridRect = gridEl.getBoundingClientRect();
        // Approximate position based on drag
        const startPct = tempGoalStartPct.current;
        const endDateObj = new Date(finalGoal.endDate);
        const endPct = ((endDateObj.getTime() - msStart) / msSpan) * 100;

        // Calculate pixel positions relative to the grid width
        const left = (Math.min(startPct, endPct) / 100) * gridRect.width;
        const width = (Math.abs(endPct - startPct) / 100) * gridRect.width;

        // For top, we need to find the row. Since we don't have row logic here easily,
        // we'll default to a safe position or try to find the element after render.
        // A better approach is to let the toolbar find the element by ID, but for now:
        const top = 60; // Approximate top for the first row or just a safe default

        setActiveGoalRect({ x: left, y: top, width });
      }
      handleOpenGoal(createdGoal);
    }
  }, [tempGoal, addGoal, handleOpenGoal, tempGoalStartPct, msStart, msSpan, percentageToDate, setSelectedGoalIds, setActiveGoalRect]);

  const { milestonePoints, milestoneWindows } = useMemo(() => {
    const points: MilestonePoint[] = [];
    const windows: MilestoneWindowOverlay[] = [];

    // Add goal milestones
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

    // Add custom milestones
    milestones.forEach((milestone) => {
      if (milestone.type === "point" && milestone.date) {
        const leftPct = clampNum(((parseISO(milestone.date).getTime() - msStart) / msSpan) * 100, -5, 105);
        points.push({
          id: milestone.id,
          label: milestone.label,
          leftPct,
          color: milestone.color,
          icon: milestone.icon || "📍",
        });
      } else if (milestone.type === "window" && milestone.startDate && milestone.endDate) {
        const startPct = clampNum(((parseISO(milestone.startDate).getTime() - msStart) / msSpan) * 100, -5, 105);
        const endPct = clampNum(((parseISO(milestone.endDate).getTime() - msStart) / msSpan) * 100, -5, 105);
        const windowFill = hexToRgba(milestone.color, 0.12);
        const windowBorder = hexToRgba(milestone.color, 0.35);
        windows.push({
          id: milestone.id,
          label: milestone.label,
          leftPct: Math.min(startPct, endPct),
          widthPct: Math.max(2, Math.abs(endPct - startPct)),
          color: milestone.color,
          fill: windowFill,
          border: windowBorder,
          shadow: hexToRgba(milestone.color, 0.25),
        });
      }
    });

    return { milestonePoints: points, milestoneWindows: windows };
  }, [items, milestones, msSpan, msStart, getCategoryColor]);

  const densityMap: Record<Density, number> = {
    cozy: 44,
    balanced: 32,
    compact: 22,
  };
  const rowCount = spans.reduce((max, span) => Math.max(max, span.rowIndex + 1), 1);
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

  const today = new Date();
  const todayPct = clampNum(((today.getTime() - msStart) / msSpan) * 100, -5, 105);
  const showToday = todayPct >= 0 && todayPct <= 100;
  const todayReadable = `Today ${today.getDate()} ${today.toLocaleDateString(undefined, { month: "short" })} ${today.getFullYear()}`;
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        // Don't delete if editing text or input
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA" ||
          (document.activeElement as HTMLElement)?.isContentEditable
        ) {
          return;
        }

        if (selectedGoalIds.size > 0) {
          e.preventDefault();
          const count = selectedGoalIds.size;
          if (confirm(`Are you sure you want to delete ${count} goal${count > 1 ? "s" : ""}?`)) {
            selectedGoalIds.forEach((id) => deleteGoal(id));
            setSelectedGoalIds(new Set());
            setActiveGoalRect(null);
          }
        }
      }

      // Escape to clear selection
      if (e.key === "Escape") {
        setSelectedGoalIds(new Set());
        setActiveGoalRect(null);
        closeInlineEditor();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedGoalIds, deleteGoal, closeInlineEditor]);

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

  // Cleanup click timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);
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

  // ESC key to cancel goal creation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (tempGoal) {
          setTempGoal(null);
        }
        if (selectedGoalIds.size > 0) {
          setSelectedGoalIds(new Set());
          setActiveGoalRect(null);
        }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedGoalIds.size > 0) {
        // Don't delete if editing text (check active element)
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;

        if (window.confirm(`Are you sure you want to delete ${selectedGoalIds.size} goals?`)) {
          selectedGoalIds.forEach(id => deleteGoal(id, true)); // Silent mode
          setSelectedGoalIds(new Set());
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [tempGoal, selectedGoalIds, deleteGoal]);

  // Drag handlers
  const handleBarMouseDown = (span: SpanInfo) => (e: ReactMouseEvent, type: "move" | "resize-start" | "resize-end") => {
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
        {items.length === 0 ? (
          <div className="timeline__empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="timeline__empty-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <h3 className="timeline__empty-title">No goals yet</h3>
            <p className="timeline__empty-message">
              Click the <strong>+ Add goal</strong> button above to create your first goal and see it visualized on the timeline.
            </p>
          </div>
        ) : (
          <>
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
                <button
                  type="button"
                  className="chip chip--interactive timeline__action-chip"
                  onClick={() => setShowMilestoneCreator(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add milestone
                </button>
                {milestones.length > 0 && (
                  <button
                    type="button"
                    className={`chip chip--interactive timeline__action-chip ${showMilestonesList ? 'chip--on' : ''}`}
                    onClick={() => setShowMilestonesList(!showMilestonesList)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12h18M3 6h18M3 18h18" />
                    </svg>
                    View milestones ({milestones.length})
                  </button>
                )}
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
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
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
                    "timeline__action-chip--focus",
                    focusMode ? "chip--on" : "",
                  ].join(" ")}
                  onClick={() => setFocusMode((prev) => !prev)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {focusMode ? "Exit focus" : "Focus view"}
                </button>
                <div className="timeline__history-buttons">
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
                      <path d="M3 7v6h6" />
                      <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={[
                      "chip",
                      "chip--interactive",
                      "timeline__action-chip",
                      "timeline__undo-btn",
                      canRedo ? "" : "timeline__action-chip--disabled",
                    ].filter(Boolean).join(" ")}
                    disabled={!canRedo}
                    onClick={handleRedo}
                    title="Redo change"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 7v6h-6" />
                      <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="timeline__grid" ref={timelineRef}>
              <div className="timeline__shell">
                <div className="timeline__viewport" ref={viewportRef}>
                  <div className="timeline__content" style={contentWidth ? { width: `${contentWidth}px` } : undefined}>
                    <div
                      ref={canvasRef}
                      className={`timeline__canvas ${isHoveringEmpty ? 'timeline__canvas--hovering' : ''}`}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onDoubleClick={handleCanvasDoubleClick}
                      onMouseLeave={() => {
                        handleCanvasMouseUp();
                        handleCanvasMouseLeave();
                      }}
                      style={{
                        cursor: isHoveringEmpty ? 'crosshair' : 'default'
                      }}
                    >
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
                            TODAY
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
                      {cursorGuide.show && !tempGoal && (
                        <div
                          className="timeline__cursor-guide"
                          style={{ left: `${cursorGuide.pct}%` }}
                        />
                      )}
                      {marqueeBox && (
                        <div
                          className="timeline__marquee"
                          style={{
                            left: marqueeBox.x,
                            top: marqueeBox.y,
                            width: marqueeBox.width,
                            height: marqueeBox.height,
                          }}
                        />
                      )}
                      {selectedGoalIds.size > 0 && (
                        <div className="timeline__selection-badge">
                          {selectedGoalIds.size} {selectedGoalIds.size === 1 ? 'item' : 'items'} selected
                        </div>
                      )}
                      {hoverTooltip.show && !tempGoal && (
                        <div
                          className="timeline__create-tooltip"
                          style={{
                            left: `${hoverTooltip.x}px`,
                            top: `${hoverTooltip.y}px`,
                          }}
                        >
                          <div className="timeline__create-tooltip-content">
                            <div className="timeline__create-tooltip-icon">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                            </div>
                            <div className="timeline__create-tooltip-text">
                              <span className="timeline__create-tooltip-action">Click & drag to create</span>
                              <span className="timeline__create-tooltip-date">{hoverTooltip.date}</span>
                            </div>
                          </div>
                        </div>
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

                        <div className="timeline__rows" style={{ height: `${rowCount * (rowHeight + 14)}px` }}>
                          {spans.map((span) => (
                            <TimelineBar
                              key={span.g.id}
                              span={span}
                              isSelected={selectedGoalIds.has(span.g.id)}
                              isDragging={dragging?.goalId === span.g.id}
                              onMouseDown={handleBarMouseDown(span)}
                              onClick={(e) => handleBarClick(span, e as React.MouseEvent<HTMLDivElement>)}
                              onDoubleClick={(e) => handleOpenGoal(span.g)}
                              onContextMenu={(e) => handleContextMenu(span, e as React.MouseEvent<HTMLDivElement>)}
                              rowHeight={rowHeight}
                              gap={14}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {milestoneWindows.map((window) => {
                      const isCustom = milestones.some((m) => m.id === window.id);
                      return (
                        <div
                          key={window.id}
                          className={`timeline__window-highlight ${isCustom ? 'timeline__window-highlight--custom' : ''}`}
                          style={{
                            left: `${window.leftPct}%`,
                            width: `${window.widthPct}%`,
                            background: `linear-gradient(120deg, ${window.fill}, ${hexToRgba(window.color, 0.05)})`,
                            borderLeft: `2px solid ${window.border}`,
                            borderRight: `2px solid ${window.border}`,
                            boxShadow: `inset 0 0 40px -10px ${window.shadow}`,
                            cursor: isCustom ? 'pointer' : 'default',
                          }}
                          onClick={() => {
                            if (isCustom) {
                              setEditingMilestoneId(window.id);
                            }
                          }}
                          title={isCustom ? `${window.label} - Click to edit` : window.label}
                        >
                          <span className="timeline__window-label">{window.label}</span>
                        </div>
                      );
                    })}

                    {milestonePoints.map((point) => {
                      const isCustom = milestones.some((m) => m.id === point.id);
                      return (
                        <div
                          key={point.id}
                          className={`timeline__milestone ${isCustom ? 'timeline__milestone--editable' : ''}`}
                          style={{ left: `${point.leftPct}%` }}
                          onClick={() => {
                            if (isCustom) {
                              setEditingMilestoneId(point.id);
                            }
                          }}
                        >
                          <div
                            className="timeline__milestone-marker"
                            style={{
                              backgroundColor: point.color,
                              borderColor: point.color,
                            }}
                          >
                            <span className="timeline__milestone-icon">{point.icon}</span>
                          </div>
                          <span className="timeline__milestone-label">{point.label}</span>
                        </div>
                      );
                    })}
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
              {selectedGoalIds.size > 0 && activeGoalRect && (() => {
                // If multiple selected, show bulk actions
                if (selectedGoalIds.size > 1) {
                  return (
                    <GoalActionToolbar
                      selectedCount={selectedGoalIds.size}
                      position={activeGoalRect}
                      onUpdate={() => { }} // Not implemented for bulk yet
                      onDelete={() => {
                        if (window.confirm(`Are you sure you want to delete ${selectedGoalIds.size} goals?`)) {
                          selectedGoalIds.forEach(id => deleteGoal(id, true));
                          setSelectedGoalIds(new Set());
                          setActiveGoalRect(null);
                        }
                      }}
                      onOpenFull={() => { }}
                    />
                  );
                }

                // Single selection
                const goalId = Array.from(selectedGoalIds)[0];
                const goal = items.find(g => g.id === goalId);
                if (!goal) return null;

                return (
                  <GoalActionToolbar
                    goal={goal}
                    position={activeGoalRect}
                    onUpdate={(updates) => {
                      stageUndo(cloneGoal(goal));
                      updateGoal({ ...goal, ...updates });
                    }}
                    onDelete={() => {
                      if (window.confirm("Are you sure you want to delete this goal?")) {
                        deleteGoal(goal.id);
                        setSelectedGoalIds(new Set());
                        setActiveGoalRect(null);
                      }
                    }}
                    onOpenFull={() => handleOpenGoal(goal)}
                  />
                );
              })()}
              {contextMenu && (
                (() => {
                  const goal = items.find(g => g.id === contextMenu.goalId);
                  if (!goal) return null;
                  return (
                    <TimelineContextMenu
                      x={contextMenu.x}
                      y={contextMenu.y}
                      goal={goal}
                      onClose={() => setContextMenu(null)}
                      onDelete={() => {
                        if (window.confirm("Are you sure you want to delete this goal?")) {
                          deleteGoal(goal.id);
                          setContextMenu(null);
                        }
                      }}
                      onEdit={() => {
                        handleOpenGoal(goal);
                        setContextMenu(null);
                      }}
                      onStatusChange={(status) => {
                        quickUpdateStatus(goal, status);
                        setContextMenu(null);
                      }}
                      onPriorityChange={(priority) => {
                        stageUndo(cloneGoal(goal));
                        updateGoal({ ...goal, priority });
                        setContextMenu(null);
                      }}
                      selectedCount={selectedGoalIds.size}
                      onDeleteMultiple={() => {
                        if (window.confirm(`Are you sure you want to delete ${selectedGoalIds.size} goals?`)) {
                          selectedGoalIds.forEach(id => deleteGoal(id, true)); // Silent mode
                          setSelectedGoalIds(new Set());
                          setContextMenu(null);
                        }
                      }}
                    />
                  );
                })()
              )}
            </div>
          </>
        )
        }
      </div >

      {/* Milestone Creator/Editor */}
      {
        (showMilestoneCreator || editingMilestoneId) && (
          <MilestoneCreator
            milestone={editingMilestoneId ? milestones.find((m) => m.id === editingMilestoneId) : undefined}
            onSave={(milestone) => {
              if (editingMilestoneId) {
                setMilestones((prev) => prev.map((m) => (m.id === editingMilestoneId ? { ...milestone, id: editingMilestoneId } : m)));
                setEditingMilestoneId(null);
              } else {
                setMilestones((prev) => [...prev, { ...milestone, id: crypto.randomUUID() }]);
                setShowMilestoneCreator(false);
              }
            }}
            onCancel={() => {
              setShowMilestoneCreator(false);
              setEditingMilestoneId(null);
            }}
            onDelete={editingMilestoneId ? () => {
              setMilestones((prev) => prev.filter((m) => m.id !== editingMilestoneId));
              setEditingMilestoneId(null);
            } : undefined}
          />
        )
      }

      {
        showMilestonesList && milestones.length > 0 && (
          <div className="timeline-milestones-panel">
            <div className="timeline-milestones-panel__backdrop" onClick={() => setShowMilestonesList(false)} />
            <div className="timeline-milestones-panel__content">
              <header className="timeline-milestones-panel__header">
                <h3>Milestones ({milestones.length})</h3>
                <button
                  type="button"
                  className="timeline-milestones-panel__close"
                  onClick={() => setShowMilestonesList(false)}
                  aria-label="Close"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </header>
              <div className="timeline-milestones-panel__list">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="timeline-milestone-card"
                    onClick={() => {
                      setEditingMilestoneId(milestone.id);
                      setShowMilestonesList(false);
                    }}
                  >
                    <div className="timeline-milestone-card__icon" style={{ backgroundColor: milestone.color }}>
                      {milestone.type === 'point' && milestone.icon && (
                        <span>{milestone.icon}</span>
                      )}
                      {milestone.type === 'window' && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                        </svg>
                      )}
                    </div>
                    <div className="timeline-milestone-card__content">
                      <h4 className="timeline-milestone-card__title">{milestone.label}</h4>
                      <p className="timeline-milestone-card__meta">
                        {milestone.type === 'point' && milestone.date && (
                          <span>{new Date(milestone.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        )}
                        {milestone.type === 'window' && milestone.startDate && milestone.endDate && (
                          <span>
                            {new Date(milestone.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} → {new Date(milestone.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="timeline-milestone-card__type">
                      {milestone.type === 'point' ? 'Point' : 'Window'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }


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
      <style jsx>{`
        .timeline__marquee {
          position: absolute;
          background: rgba(59, 130, 246, 0.15);
          .timeline__bar--temp {
          background: rgba(59, 130, 246, 0.1) !important;
          border: 2px dashed rgba(59, 130, 246, 0.5) !important;
          box-shadow: none !important;
          backdrop-filter: blur(2px);
        }  z-index: 100;
          border-radius: 4px;
        }
        .timeline__selection-badge {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          color: #fff;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          animation: badge-in 0.2s ease-out;
        }
        @keyframes badge-in {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .timeline__bar--selected {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), 0 0 0 2px #fff !important;
          z-index: 10;
          filter: brightness(1.15);
        }
      `}</style>
    </>
  );
}
