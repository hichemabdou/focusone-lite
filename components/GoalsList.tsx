"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent, FocusEvent } from "react";
import { Goal, Priority, Status, useGoals } from "./GoalsContext";
import GoalEditor from "./GoalEditor";
import MilestoneEditor from "./MilestoneEditor";

/* ---------- helpers ---------- */
function prettyRange(g: Goal) {
  const s = new Date(g.startDate);
  const e = new Date(g.endDate);
  const fmt = (d: Date) => d.toLocaleString(undefined, { month: "short", day: "2-digit" });
  return `${fmt(s)} — ${fmt(e)}`;
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

  const [groupMode, setGroupMode] = useState<GroupMode>("status");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [editorState, setEditorState] = useState<{ mode: "create" | "edit"; goal?: Goal | null } | null>(null);
  const [milestoneGoal, setMilestoneGoal] = useState<Goal | null>(null);

  useEffect(() => {
    const handler = () => setEditorState({ mode: "create" });
    window.addEventListener("open-goal-composer", handler);
    return () => window.removeEventListener("open-goal-composer", handler);
  }, []);

  const grouped = useMemo(() => {
    if (groupMode === "flow") {
      return [{ key: "all", label: "All goals", items }];
    }

    if (groupMode === "priority") {
      const order: Priority[] = ["critical", "high", "medium", "low"];
      return order
        .map((pri) => ({
          key: `priority-${pri}`,
          label: pri.charAt(0).toUpperCase() + pri.slice(1),
          items: items.filter((goal) => goal.priority === pri),
        }))
        .filter((section) => section.items.length > 0);
    }

    const order: Status[] = ["open", "in-progress", "blocked", "done"];
    return order
      .map((status) => ({
        key: `status-${status}`,
        label: STATUS_LABELS[status],
        items: items.filter((goal) => goal.status === status),
      }))
      .filter((section) => section.items.length > 0);
  }, [groupMode, items]);

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

  return (
    <div className="min-w-0">
      {/* Header & global actions */}
      <div className="goal-library__intro" />

      <div className="goal-library__view-toggle">
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
                      onEditMilestone={setMilestoneGoal}
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

      <MilestoneEditor
        open={Boolean(milestoneGoal)}
        goal={milestoneGoal}
        onClose={() => setMilestoneGoal(null)}
        onSave={(next) => {
          updateGoal(next);
          setMilestoneGoal(null);
        }}
      />
    </div>
  );
}

type GoalCardProps = {
  goal: Goal;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  onEdit(goal: Goal): void;
  onEditMilestone(goal: Goal): void;
};

function GoalCard({ goal, updateGoal, deleteGoal, onEdit, onEditMilestone }: GoalCardProps) {
  const statusKey = goal.status === "in-progress" ? "inprog" : goal.status;
  const statusLabel = STATUS_LABELS[goal.status];
  const categoryLabel = goal.category.charAt(0) + goal.category.slice(1).toLowerCase();
  const notesValue = goal.notes ?? "";

  const handleTitleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const next = event.target.value.trim();
    if (!next) {
      event.target.value = goal.title;
      return;
    }
    if (next !== goal.title) updateGoal({ ...goal, title: next });
  };

  const handleTitleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      (event.currentTarget as HTMLInputElement).blur();
    }
  };

  const handleNotesBlur = (event: FocusEvent<HTMLTextAreaElement>) => {
    const next = event.target.value.trim();
    if ((goal.notes ?? "") !== next) {
      updateGoal({ ...goal, notes: next });
    }
  };

  const handleNotesKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      (event.currentTarget as HTMLTextAreaElement).blur();
    }
  };

  return (
    <article className="goal-row">
      <div className="goal-row__main">
        <span className={["goal-row__status", `goal-row__status--${statusKey}`].join(" ")}>{statusLabel}</span>
        <input
          key={`${goal.id}-title-${goal.title}`}
          className="goal-row__title"
          defaultValue={goal.title}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKey}
          placeholder="Untitled goal"
        />
        <span className="goal-row__category">{categoryLabel}</span>
        <span className="goal-row__range">{prettyRange(goal)}</span>
      </div>

      <div className="goal-row__controls">
        <textarea
          key={`${goal.id}-notes-${notesValue}`}
          className="goal-row__notes"
          defaultValue={notesValue}
          placeholder="Add note"
          rows={notesValue ? 2 : 1}
          onBlur={handleNotesBlur}
          onKeyDown={handleNotesKey}
        />
        <div className="goal-row__selects">
          <select
            className="goal-row__select"
            value={goal.status}
            onChange={(e) => updateGoal({ ...goal, status: e.target.value as Status })}
          >
            <option value="open">Open</option>
            <option value="in-progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
          <select
            className="goal-row__select"
            value={goal.priority}
            onChange={(e) => updateGoal({ ...goal, priority: e.target.value as Priority })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            className="goal-row__select"
            value={goal.category}
            onChange={(e) => updateGoal({ ...goal, category: e.target.value as Goal["category"] })}
          >
            {["STRATEGY", "VISION", "TACTICAL", "PROJECT", "DAILY"].map((cat) => (
              <option key={cat} value={cat}>{cat.charAt(0) + cat.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div className="goal-row__actions">
          <button type="button" className="btn" onClick={() => onEdit(goal)}>Details</button>
          <button type="button" className="btn" onClick={() => onEditMilestone(goal)}>Milestone</button>
          <button type="button" className="btn btn--danger" onClick={() => deleteGoal(goal.id)}>Delete</button>
        </div>
      </div>
    </article>
  );
}
