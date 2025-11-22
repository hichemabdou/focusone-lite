"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, FocusEvent, MouseEvent as ReactMouseEvent } from "react";
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
  const {
    visibleGoals,
    goals,
    deleteGoal,
    addGoal,
    updateGoal,
    addComment,
    updateComment,
    deleteComment,
  } = useGoals();
  const items = useMemo(() => (visibleGoals ?? goals ?? []) as Goal[], [visibleGoals, goals]);
  const [groupMode, setGroupMode] = useState<GroupMode>("flow");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [editorState, setEditorState] = useState<{ mode: "create" | "edit"; goal?: Goal | null } | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [undoHistory, setUndoHistory] = useState<Goal[]>([]);
  const [redoHistory, setRedoHistory] = useState<Goal[]>([]);
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
    setRedoHistory([]);
    setUndoMessage(`Updated “${snapshot.title || "goal"}”`);
  };
  const undoLastChange = () => {
    setUndoHistory((prev) => {
      if (!prev.length) return prev;
      const [latest, ...rest] = prev;
      const current = goals.find((goal) => goal.id === latest.id);
      if (current) {
        setRedoHistory((redoPrev) => [cloneGoalForUndo(current), ...redoPrev].slice(0, 15));
      }
      updateGoal(latest);
      setUndoMessage(`Restored “${latest.title || "goal"}”`);
      return rest;
    });
  };
  const redoLastChange = () => {
    setRedoHistory((prev) => {
      if (!prev.length) return prev;
      const [latest, ...rest] = prev;
      const current = goals.find((goal) => goal.id === latest.id);
      if (current) {
        setUndoHistory((undoPrev) => [cloneGoalForUndo(current), ...undoPrev].slice(0, 15));
      }
      updateGoal(latest);
      setUndoMessage(`Reapplied “${latest.title || "goal"}”`);
      return rest;
    });
  };
  const canUndo = undoHistory.length > 0;
  const canRedo = redoHistory.length > 0;

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
          <div className="goal-list__undo-buttons">
            <button
              type="button"
              className="goal-list__undo-btn"
              onClick={undoLastChange}
              disabled={!canUndo}
              title="Undo last change"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6"/>
                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
              </svg>
            </button>
            <button
              type="button"
              className="goal-list__undo-btn"
              onClick={redoLastChange}
              disabled={!canRedo}
              title="Redo change"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 7v6h-6"/>
                <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/>
              </svg>
            </button>
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
                      addComment={addComment}
                      updateComment={updateComment}
                      deleteComment={deleteComment}
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

      {(canUndo || canRedo) && (
        <div className="undo-toast">
          <span>{undoMessage ?? "Change history ready"}</span>
          <div className="undo-toast__actions">
            <button type="button" onClick={undoLastChange} className="undo-toast__btn" disabled={!canUndo}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6"/>
                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
              </svg>
              Undo
            </button>
            <button type="button" onClick={redoLastChange} className="undo-toast__btn" disabled={!canRedo}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 7v6h-6"/>
                <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/>
            </svg>
              Redo
            </button>
          </div>
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
  const { categories, addCategory } = useCustomization();
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
      quickAddType="category"
      onQuickAdd={(name, color) => {
        addCategory(name, color);
        const categoryName = name.toUpperCase();
        onStageUndo(goal);
        updateGoal({ ...goal, category: categoryName as Goal["category"] });
      }}
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
  addComment(goalId: string, input: { body: string }): void;
  updateComment(goalId: string, commentId: string, body: string): void;
  deleteComment(goalId: string, commentId: string): void;
};

function GoalCard({
  goal,
  updateGoal,
  deleteGoal,
  onEdit,
  onStageUndo,
  addComment,
  updateComment,
  deleteComment,
}: GoalCardProps) {
  const commentCount = goal.comments?.length ?? 0;
  const latestComment = commentCount > 0 ? goal.comments[commentCount - 1] : null;
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

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

  const handleAddComment = () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    addComment(goal.id, { body: trimmed });
    setNewComment("");
  };

  return (
    <article className="goal-card">
      <div className="goal-card__layout">
        {/* Row 1: Title and Dates */}
        <div className="goal-card__top-row">
          {/* Title section */}
          <div className="goal-card__column goal-card__column--main">
            <div className="goal-card__header">
              <input
                type="text"
                key={`${goal.id}-title-${goal.title}`}
                className="goal-card__title-input"
                defaultValue={goal.title}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKey}
                placeholder="Untitled goal"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Dates - horizontal side by side on the right */}
          <div className="goal-card__date-row" onClick={(e) => e.stopPropagation()}>
            <div className="goal-card__date-field">
              <label className="goal-card__date-label">Start</label>
              <input
                type="date"
                value={goal.startDate}
                onChange={(e) => {
                  onStageUndo(goal);
                  updateGoal({ ...goal, startDate: e.target.value });
                  e.currentTarget.blur();
                }}
                className="goal-card__date-input"
              />
            </div>
            <div className="goal-card__date-field">
              <label className="goal-card__date-label">End</label>
              <input
                type="date"
                value={goal.endDate}
                onChange={(e) => {
                  onStageUndo(goal);
                  updateGoal({ ...goal, endDate: e.target.value });
                  e.currentTarget.blur();
                }}
                className="goal-card__date-input"
              />
            </div>

            {/* Action buttons inline with dates */}
            <div className="goal-card__actions">
              <button
                type="button"
                className="goal-card__edit"
                aria-label="Edit goal"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(goal);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                type="button"
                className="goal-card__delete"
                aria-label="Delete goal"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteGoal(goal.id);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Status, Priority, Category pills and Comments */}
        <div className="goal-card__bottom-row">
          {/* Status, Priority, Category pills */}
          <div className="goal-card__meta" onClick={(event) => event.stopPropagation()}>
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
          </div>

          {/* Comments - fills remaining space */}
          <div className="goal-card__comments" onClick={(e) => e.stopPropagation()}>
            <div className="goal-card__comment-input-wrapper">
              <input
                type="text"
                className="goal-card__comment-quick-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add comment..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newComment.trim()) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {commentCount > 0 && (
        <div className="goal-card__comments-expanded" onClick={(e) => e.stopPropagation()}>
          <div className="goal-card__comments-list">
            {[...goal.comments].reverse().map((comment) => {
              const commentDate = new Date(comment.createdAt);
              const now = new Date();
              const diffMs = now.getTime() - commentDate.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMs / 3600000);
              const diffDays = Math.floor(diffMs / 86400000);

              let dateLabel = "";
              if (diffMins < 1) dateLabel = "Just now";
              else if (diffMins < 60) dateLabel = `${diffMins}m ago`;
              else if (diffHours < 24) dateLabel = `${diffHours}h ago`;
              else if (diffDays < 7) dateLabel = `${diffDays}d ago`;
              else dateLabel = commentDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });

              return (
                <div key={comment.id} className="goal-card__comment-item">
                  <div className="goal-card__comment-header">
                    <span className="goal-card__comment-date" title={commentDate.toLocaleString()}>
                      {dateLabel}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteComment(goal.id, comment.id);
                      }}
                      className="goal-card__comment-delete"
                      aria-label="Delete comment"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="goal-card__comment-body">{comment.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Double-click anywhere else on card to open full editor */}
      <div className="goal-card__click-overlay" onDoubleClick={() => onEdit(goal)} />
    </article>
  );
}
