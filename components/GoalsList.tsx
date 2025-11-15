"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent, FocusEvent } from "react";
import { Goal, Priority, Status, useGoals } from "./GoalsContext";
import GoalEditor from "./GoalEditor";
import MilestoneEditor from "./MilestoneEditor";
import InlineSelect from "./InlineSelect";

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
  const milestones = useMemo(() => items.filter((goal) => goal.milestone), [items]);

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
    <div className="goal-layout">
      <div className="goal-layout__main">
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
      </div>
      <aside className="goal-layout__milestones">
        <MilestonesShelf milestones={milestones} onEdit={setMilestoneGoal} />
      </aside>

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
};

function GoalCard({ goal, updateGoal, deleteGoal, onEdit }: GoalCardProps) {
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

  return (
    <article
      className="goal-row goal-row--lite"
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
        <span className="goal-row__range-chip">{prettyRange(goal)}</span>
      </div>

      <div className="goal-row__meta">
        <InlineSelect
          value={goal.status}
          onChange={(next) => updateGoal({ ...goal, status: next as Status })}
          options={[
            { value: "open", label: "Open", tone: "status-open" },
            { value: "in-progress", label: "In progress", tone: "status-inprog" },
            { value: "blocked", label: "Blocked", tone: "status-blocked" },
            { value: "done", label: "Done", tone: "status-done" },
          ]}
        />
        <InlineSelect
          value={goal.priority}
          onChange={(next) => updateGoal({ ...goal, priority: next as Priority })}
          options={[
            { value: "low", label: "Low", tone: "priority-low" },
            { value: "medium", label: "Medium", tone: "priority-medium" },
            { value: "high", label: "High", tone: "priority-high" },
            { value: "critical", label: "Critical", tone: "priority-critical" },
          ]}
        />
        <InlineSelect
          value={goal.category}
          onChange={(next) => updateGoal({ ...goal, category: next as Goal["category"] })}
          options={[
            { value: "STRATEGY", label: "Strategy", tone: "category-strategy" },
            { value: "VISION", label: "Vision", tone: "category-vision" },
            { value: "TACTICAL", label: "Tactical", tone: "category-tactical" },
            { value: "PROJECT", label: "Project", tone: "category-project" },
            { value: "DAILY", label: "Daily", tone: "category-daily" },
          ]}
        />
      </div>

      {notesValue && <p className="goal-row__note-text">{notesValue}</p>}
    </article>
  );
}

type MilestonesShelfProps = {
  milestones: Goal[];
  onEdit(goal: Goal): void;
};

function MilestonesShelf({ milestones, onEdit }: MilestonesShelfProps) {
  return (
    <div className="milestones-panel">
      <h3 className="milestones-panel__title">Milestones</h3>
      {milestones.length === 0 ? (
        <p className="milestones-panel__hint">Create a milestone from the goal editor to see it here.</p>
      ) : (
        <ul className="milestones-panel__list">
          {milestones.map((goal) => (
            <li key={goal.id}>
              <button type="button" className="milestones-panel__item" onClick={() => onEdit(goal)}>
                <span className="milestones-panel__label">{goal.milestone?.label ?? goal.title}</span>
                <span className="milestones-panel__date">
                  {goal.milestone?.date ?? goal.milestone?.windowEnd ?? goal.endDate}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
