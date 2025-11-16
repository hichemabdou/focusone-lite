"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, FocusEvent } from "react";
import { Goal, Priority, Status, useGoals } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";
import GoalEditor from "./GoalEditor";
import InlineSelect from "./InlineSelect";
import { openCustomizationPanel } from "./customizationEvents";

/* ---------- helpers ---------- */
function prettyRange(g: Goal) {
  const s = new Date(g.startDate);
  const e = new Date(g.endDate);
  const fmt = (d: Date) => d.toLocaleString(undefined, { month: "short", day: "2-digit" });
  return `${fmt(s)} — ${fmt(e)}`;
}

function cloneGoalForUndo(goal: Goal): Goal {
  return {
    ...goal,
    comments: goal.comments.map((comment) => ({ ...comment })),
    milestone: goal.milestone ? { ...goal.milestone } : null,
  };
}

const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Done",
};
type GroupMode = "status" | "priority" | "flow";

/* ---------- component ---------- */
export default function GoalsList() {
  const { visibleGoals, goals, deleteGoal, addGoal, updateGoal } = useGoals();
  const items = useMemo(() => (visibleGoals ?? goals ?? []) as Goal[], [visibleGoals, goals]);
  const [groupMode, setGroupMode] = useState<GroupMode>("flow");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [editorState, setEditorState] = useState<{ mode: "create" | "edit"; goal?: Goal | null } | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [undoHistory, setUndoHistory] = useState<Goal[]>([]);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  const chronologicalItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [items]);
  const sortedItems = useMemo(() => {
    if (sortDirection === "asc") return chronologicalItems;
    return [...chronologicalItems].reverse();
  }, [chronologicalItems, sortDirection]);

  useEffect(() => {
    const handler = () => setEditorState({ mode: "create" });
    window.addEventListener("open-goal-composer", handler);
    return () => window.removeEventListener("open-goal-composer", handler);
  }, []);

  const grouped = useMemo(() => {
    if (groupMode === "flow") {
      return [{ key: "all", label: "All goals", items: sortedItems }];
    }

    if (groupMode === "priority") {
      const order: Priority[] = ["critical", "high", "medium", "low"];
      return order
        .map((pri) => ({
          key: `priority-${pri}`,
          label: pri.charAt(0).toUpperCase() + pri.slice(1),
          items: sortedItems.filter((goal) => goal.priority === pri),
        }))
        .filter((section) => section.items.length > 0);
    }

    const order: Status[] = ["open", "in-progress", "blocked", "done"];
    return order
      .map((status) => ({
        key: `status-${status}`,
        label: STATUS_LABELS[status],
        items: sortedItems.filter((goal) => goal.status === status),
      }))
      .filter((section) => section.items.length > 0);
  }, [groupMode, sortedItems]);

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openEdit = (goal: Goal) => setEditorState({ mode: "edit", goal });
  const closeEditor = () => setEditorState(null);

  const handleSave = (input: Goal | Omit<Goal, "id">) => {
    if (editorState?.mode === "edit" && "id" in input) {
      updateGoal(input as Goal);
    } else {
      addGoal(input as Omit<Goal, "id">);
    }
    closeEditor();
  };

  const collapseAll = (shouldCollapse: boolean) => {
    const next: Record<string, boolean> = {};
    grouped.forEach((section) => {
      next[section.key] = shouldCollapse;
    });
    setCollapsedSections(next);
  };

  const totalGoals = goals.length;
  const filteredCount = items.length;
  const filtersActive = filteredCount !== totalGoals;
  const stageUndo = (snapshot: Goal) => {
    setUndoHistory((prev) => [cloneGoalForUndo(snapshot), ...prev].slice(0, 15));
    setUndoMessage(`Updated “${snapshot.title || "goal"}”`);
  };
  const undoLastChange = () => {
    setUndoHistory((prev) => {
      if (!prev.length) return prev;
      const [latest, ...rest] = prev;
      updateGoal(latest);
      setUndoMessage(`Restored “${latest.title || "goal"}”`);
      return rest;
    });
  };
  const canUndo = undoHistory.length > 0;

  useEffect(() => {
    if (!undoMessage) return;
    const timer = window.setTimeout(() => setUndoMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [undoMessage]);

  return (
    <div className="goal-layout">
      {/* Header & global actions */}
      <div className="goal-library__intro" />

      <div className="goal-list__toolbar">
        <div className="goal-list__toolbar-left">
          {([
            { key: "status", label: "Status lanes" },
            { key: "priority", label: "Priority lanes" },
            { key: "flow", label: "Chronological" },
          ] as { key: GroupMode; label: string }[]).map((option) => (
            <button
              key={option.key}
              type="button"
              className={[
                "chip",
                "chip--interactive",
                groupMode === option.key ? "chip--on" : "",
              ].join(" ")}
              onClick={() => setGroupMode(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="goal-list__toolbar-right">
          <div className="goal-list__summary">
            <span>{filteredCount} / {totalGoals} goals</span>
            {filtersActive && <span className="goal-list__summary-pill">Filters active</span>}
          </div>
          <div className="goal-list__toolbar-chips">
            <button
              type="button"
              className={["chip", "chip--interactive", sortDirection === "asc" ? "chip--on" : ""].join(" ")}
              onClick={() => setSortDirection("asc")}
            >
              Earliest first
            </button>
            <button
              type="button"
              className={["chip", "chip--interactive", sortDirection === "desc" ? "chip--on" : ""].join(" ")}
              onClick={() => setSortDirection("desc")}
            >
              Latest first
            </button>
            <button type="button" className="chip chip--interactive" onClick={() => collapseAll(true)}>
              Collapse all
            </button>
            <button type="button" className="chip chip--interactive" onClick={() => collapseAll(false)}>
              Expand all
            </button>
          </div>
        </div>
      </div>

      <div className="goal-section-list">
        {grouped.map((section) => {
          const collapsed = collapsedSections[section.key];
          return (
            <section key={section.key} className="goal-section">
              <header className="goal-section__header">
                <button
                  type="button"
                  className="goal-section__title"
                  aria-expanded={!collapsed}
                  onClick={() => toggleSection(section.key)}
                >
                  <span className={["goal-section__chevron", collapsed ? "" : "is-open"].join(" ")} aria-hidden />
                  <span>{section.label}</span>
                  <span className="goal-section__count">{section.items.length}</span>
                </button>
                <button
                  type="button"
                  className="btn goal-section__collapse"
                  onClick={() => toggleSection(section.key)}
                >
                  {collapsed ? "Expand" : "Collapse"}
                </button>
              </header>
              {!collapsed && (
                <div className="goal-section__body">
                  {section.items.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      updateGoal={updateGoal}
                      deleteGoal={deleteGoal}
                      onEdit={openEdit}
                    onStageUndo={stageUndo}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {grouped.length === 0 && (
          <div className="text-sm text-white/60">
            No goals yet. Use the <span className="chip">+ Add goal</span> button in the header to capture one.
          </div>
        )}
      </div>
      <GoalEditor
        open={Boolean(editorState)}
        mode={editorState?.mode ?? "create"}
        goal={editorState?.goal ?? undefined}
        onCancel={closeEditor}
        onSave={handleSave}
      />

      {canUndo && (
        <div className="undo-toast">
          <span>{undoMessage ?? "Change saved"}</span>
          <button type="button" onClick={undoLastChange}>
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

type CategorySelectProps = {
  goal: Goal;
  updateGoal: (goal: Goal) => void;
  onStageUndo(goal: Goal): void;
};

function CategorySelect({ goal, updateGoal, onStageUndo }: CategorySelectProps) {
  const { categories } = useCustomization();
  return (
    <InlineSelect
      value={goal.category}
      onChange={(next) => {
        if (goal.category === next) return;
        onStageUndo(goal);
        updateGoal({ ...goal, category: next as Goal["category"] });
      }}
      options={categories.map((cat) => ({
        value: cat.name,
        label: cat.name.charAt(0) + cat.name.slice(1).toLowerCase(),
        tone: `category-${cat.name.toLowerCase()}`,
      }))}
      addLabel="Add category"
      onAdd={() => openCustomizationPanel("categories")}
    />
  );
}

type GoalCardProps = {
  goal: Goal;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  onEdit(goal: Goal): void;
  onStageUndo(goal: Goal): void;
};

function GoalCard({ goal, updateGoal, deleteGoal, onEdit, onStageUndo }: GoalCardProps) {
  const notesValue = goal.notes ?? "";

  const handleTitleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const next = event.target.value.trim();
    if (!next) {
      event.target.value = goal.title;
      return;
    }
    if (next !== goal.title) {
      onStageUndo(goal);
      updateGoal({ ...goal, title: next });
    }
  };

  const handleTitleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      (event.currentTarget as HTMLInputElement).blur();
    }
  };

  return (
    <article
      className="goal-row goal-row--lite goal-row--compact"
      onClick={() => onEdit(goal)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") onEdit(goal);
      }}
    >
      <button
        type="button"
        className="goal-row__delete"
        aria-label="Delete goal"
        onClick={(event) => {
          event.stopPropagation();
          deleteGoal(goal.id);
        }}
      >
        ×
        <span className="goal-row__delete-tip">Delete goal</span>
      </button>
      <div className="goal-row__heading" onClick={(event) => event.stopPropagation()}>
        <input
          key={`${goal.id}-title-${goal.title}`}
          className="goal-row__title-input"
          defaultValue={goal.title}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKey}
          placeholder="Untitled goal"
        />
        <GoalDateEditor goal={goal} updateGoal={updateGoal} onStageUndo={onStageUndo} />
      </div>

      <div className="goal-row__meta">
        <InlineSelect
          value={goal.status}
          onChange={(next) => {
            if (goal.status === next) return;
            onStageUndo(goal);
            updateGoal({ ...goal, status: next as Status });
          }}
          options={[
            { value: "open", label: "Open", tone: "status-open" },
            { value: "in-progress", label: "In progress", tone: "status-inprog" },
            { value: "blocked", label: "Blocked", tone: "status-blocked" },
            { value: "done", label: "Done", tone: "status-done" },
          ]}
          addLabel="Add status"
          onAdd={() => openCustomizationPanel("statuses")}
        />
        <InlineSelect
          value={goal.priority}
          onChange={(next) => {
            if (goal.priority === next) return;
            onStageUndo(goal);
            updateGoal({ ...goal, priority: next as Priority });
          }}
          options={[
            { value: "low", label: "Low", tone: "priority-low" },
            { value: "medium", label: "Medium", tone: "priority-medium" },
            { value: "high", label: "High", tone: "priority-high" },
            { value: "critical", label: "Critical", tone: "priority-critical" },
          ]}
          addLabel="Add priority"
          onAdd={() => openCustomizationPanel("priorities")}
        />
        <CategorySelect goal={goal} updateGoal={updateGoal} onStageUndo={onStageUndo} />
        <span className="goal-row__comments" aria-label={`${goal.comments?.length ?? 0} comments`}>
          💬 {goal.comments?.length ?? 0}
        </span>
      </div>

      {notesValue && <p className="goal-row__note-text">{notesValue}</p>}
    </article>
  );
}

type GoalDateEditorProps = {
  goal: Goal;
  updateGoal: (goal: Goal) => void;
  onStageUndo(goal: Goal): void;
};

function GoalDateEditor({ goal, updateGoal, onStageUndo }: GoalDateEditorProps) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(goal.startDate);
  const [draftEnd, setDraftEnd] = useState(goal.endDate);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: globalThis.MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        setError(null);
      }
    };
    const handleEsc = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setError(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const handleSave = () => {
    if (draftStart > draftEnd) {
      setError("End date must be after start date.");
      return;
    }
    if (draftStart === goal.startDate && draftEnd === goal.endDate) {
      setOpen(false);
      return;
    }
    onStageUndo(goal);
    updateGoal({ ...goal, startDate: draftStart, endDate: draftEnd });
    setOpen(false);
    setError(null);
  };

  return (
    <div className={["goal-date", open ? "is-open" : ""].join(" ")} ref={wrapperRef}>
      <button
        type="button"
        className="goal-date__chip"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              setDraftStart(goal.startDate);
              setDraftEnd(goal.endDate);
              setError(null);
            }
            return next;
          });
        }}
      >
        {prettyRange(goal)}
      </button>
      {open && (
        <div
          className="goal-date__popover"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="goal-date__fields">
            <label>
              <span>Start</span>
              <input type="date" value={draftStart} onChange={(e) => setDraftStart(e.target.value)} />
            </label>
            <label>
              <span>End</span>
              <input type="date" value={draftEnd} onChange={(e) => setDraftEnd(e.target.value)} />
            </label>
          </div>
          {error && <p className="goal-date__error">{error}</p>}
          <div className="goal-date__actions">
            <button
              type="button"
              className="btn"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
            >
              Cancel
            </button>
            <button type="button" className="btn btn--primary" onClick={handleSave}>
              Save dates
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

