"use client";

import { useMemo, useState } from "react";
import type { FormEvent, KeyboardEvent, FocusEvent } from "react";
import { Goal, Priority, Status, useGoals } from "./GoalsContext";
import Modal from "./Modal";

/* ---------- helpers ---------- */
function prettyRange(g: Goal) {
  const s = new Date(g.startDate);
  const e = new Date(g.endDate);
  const fmt = (d: Date) => d.toLocaleString(undefined, { month: "short", day: "2-digit" });
  return `${fmt(s)} — ${fmt(e)}`;
}
const toISO = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, days: number) => { const x = new Date(d); x.setDate(x.getDate() + days); return x; };

const DEFAULT_GOAL = (): Omit<Goal, "id"> => {
  const today = new Date();
  return {
    title: "",
    startDate: toISO(today),
    endDate: toISO(addDays(today, 30)),
    category: "STRATEGY",
    priority: "medium",
    status: "open",
    notes: "",
  };
};

const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Done",
};

/* ---------- component ---------- */
export default function GoalsList() {
  const { visibleGoals, goals, exportJson, importJson, deleteGoal, addGoal, updateGoal } = useGoals();
  const items = useMemo(() => (visibleGoals ?? goals ?? []) as Goal[], [visibleGoals, goals]);

  const counts = useMemo(() => {
    return {
      open: items.filter((g) => g.status === "open").length,
      inprog: items.filter((g) => g.status === "in-progress").length,
      blocked: items.filter((g) => g.status === "blocked").length,
      done: items.filter((g) => g.status === "done").length,
    };
  }, [items]);

  const [quickDraft, setQuickDraft] = useState<Omit<Goal, "id">>(DEFAULT_GOAL());
  const [quickError, setQuickError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<Goal, "id">>(DEFAULT_GOAL());
  const [error, setError] = useState<string | null>(null);
  const openModal = () => { setDraft(DEFAULT_GOAL()); setError(null); setModalOpen(true); };

  const handleQuickSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quickDraft.title.trim()) { setQuickError("Give the goal a name."); return; }
    if (quickDraft.startDate > quickDraft.endDate) { setQuickError("End date must be after start date."); return; }
    addGoal(quickDraft);
    setQuickDraft(DEFAULT_GOAL());
    setQuickError(null);
  };

  return (
    <div className="min-w-0">
      {/* Header & global actions */}
      <div className="goal-library__intro">
        <div className="goal-library__copy">
          <p className="goal-library__lead">
            Keep a premium, high-level list. Tweak inline or capture a new intention in seconds.
          </p>
          <div className="goal-library__counts">
            Open {counts.open} • In progress {counts.inprog} • Blocked {counts.blocked} • Done {counts.done}
          </div>
        </div>
        <div className="goal-library__actions">
          <button type="button" onClick={openModal} className="btn btn--primary">+ Detailed entry</button>
          <label className="btn cursor-pointer">
            Import
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setBusy(true);
                const text = await file.text();
                try {
                  const data = JSON.parse(text);
                  if (Array.isArray(data)) importJson(data as Goal[]);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => {
              const blob = new Blob([exportJson()], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "goals.json";
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Export
          </button>
        </div>
      </div>

      {/* Quick add composer */}
      <form className="goal-composer" onSubmit={handleQuickSubmit}>
        <div className="goal-composer__grid">
          <label className="goal-composer__field goal-composer__field--wide">
            <span>Title</span>
            <input
              className="field"
              type="text"
              value={quickDraft.title}
              placeholder="Name the intention"
              onChange={(e) => {
                setQuickError(null);
                setQuickDraft((prev) => ({ ...prev, title: e.target.value }));
              }}
            />
          </label>

          <label className="goal-composer__field goal-composer__field--wide">
            <span>Notes</span>
            <input
              className="field"
              type="text"
              value={quickDraft.notes ?? ""}
              placeholder="Optional context"
              onChange={(e) => {
                setQuickError(null);
                setQuickDraft((prev) => ({ ...prev, notes: e.target.value }));
              }}
            />
          </label>

          <label className="goal-composer__field">
            <span>Start</span>
            <input
              type="date"
              className="field"
              value={quickDraft.startDate}
              onChange={(e) => {
                setQuickError(null);
                setQuickDraft((prev) => ({ ...prev, startDate: e.target.value }));
              }}
            />
          </label>

          <label className="goal-composer__field">
            <span>End</span>
            <input
              type="date"
              className="field"
              value={quickDraft.endDate}
              onChange={(e) => {
                setQuickError(null);
                setQuickDraft((prev) => ({ ...prev, endDate: e.target.value }));
              }}
            />
          </label>

          <label className="goal-composer__field">
            <span>Status</span>
            <select
              className="field select"
              value={quickDraft.status}
              onChange={(e) => {
                setQuickError(null);
                setQuickDraft((prev) => ({ ...prev, status: e.target.value as Status }));
              }}
            >
              <option value="open">Open</option>
              <option value="in-progress">In progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </label>

          <label className="goal-composer__field">
            <span>Priority</span>
            <select
              className="field select"
              value={quickDraft.priority}
              onChange={(e) => {
                setQuickError(null);
                setQuickDraft((prev) => ({ ...prev, priority: e.target.value as Priority }));
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <label className="goal-composer__field">
            <span>Category</span>
            <select
              className="field select"
              value={quickDraft.category}
              onChange={(e) => {
                setQuickError(null);
                setQuickDraft((prev) => ({ ...prev, category: e.target.value as Goal["category"] }));
              }}
            >
              <option value="STRATEGY">Strategy</option>
              <option value="VISION">Vision</option>
              <option value="TACTICAL">Tactical</option>
              <option value="PROJECT">Project</option>
              <option value="DAILY">Daily</option>
            </select>
          </label>
        </div>
        <div className="goal-composer__footer">
          {quickError && <span className="goal-composer__error">{quickError}</span>}
          <button type="submit" className="btn btn--primary">Add goal</button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-3">
        {items.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            updateGoal={updateGoal}
            deleteGoal={deleteGoal}
          />
        ))}

        {items.length === 0 && (
          <div className="text-sm text-white/60">No goals yet. Click <span className="chip">+ New goal</span> to add one.</div>
        )}
      </div>

      {/* Add modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add a goal">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.title.trim()) { setError("Give the goal a name."); return; }
            if (draft.startDate > draft.endDate) { setError("End date must be after start date."); return; }
            addGoal(draft); setModalOpen(false);
          }}
        >
          {error && <div className="rounded-md border border-white/10 bg-white/10 p-3 text-sm text-white/80">{error}</div>}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-white/50">Title</span>
              <input
                className="field w-full"
                type="text"
                value={draft.title}
                placeholder="Name the intention"
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-white/50">Category</span>
              <select
                className="field select w-full"
                value={draft.category}
                onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value as Goal["category"] }))}
              >
                <option value="STRATEGY">Strategy</option>
                <option value="VISION">Vision</option>
                <option value="TACTICAL">Tactical</option>
                <option value="PROJECT">Project</option>
                <option value="DAILY">Daily</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-white/50">Start</span>
              <input
                type="date"
                className="field w-full"
                value={draft.startDate}
                onChange={(e) => setDraft((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em] text-white/50">End</span>
              <input
                type="date"
                className="field w-full"
                value={draft.endDate}
                onChange={(e) => setDraft((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">Notes</span>
            <input
              className="field w-full"
              type="text"
              placeholder="Optional notes"
              value={draft.notes}
              onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </label>

          <div className="flex items-center justify-end gap-2">
            <button type="button" className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary">Save goal</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

type GoalCardProps = {
  goal: Goal;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
};

function GoalCard({ goal, updateGoal, deleteGoal }: GoalCardProps) {
  const statusKey = goal.status === "in-progress" ? "inprog" : goal.status;
  const statusLabel = STATUS_LABELS[goal.status];
  const priorityLabel = goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1);
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
    <article className={["goal-card", `goal-card--${statusKey}`].join(" ")}>
      <div className="goal-card__content">
        <div className="goal-card__tags">
          <span className={`chip chip--micro chip--cat-${goal.category.toLowerCase()}`}>{categoryLabel}</span>
          <span className="goal-card__dates">{prettyRange(goal)}</span>
        </div>
        <input
          key={`${goal.id}-title-${goal.title}`}
          className="goal-card__title-input"
          defaultValue={goal.title}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKey}
          placeholder="Untitled goal"
        />
        <textarea
          key={`${goal.id}-notes-${notesValue}`}
          className="goal-card__notes-input"
          defaultValue={notesValue}
          onBlur={handleNotesBlur}
          onKeyDown={handleNotesKey}
          placeholder="Add a short note"
          rows={notesValue ? 2 : 1}
        />
      </div>

      <div className="goal-card__aside">
        <div className="goal-card__chips">
          <span className={["chip", "goal-chip", `goal-chip--${statusKey}`].join(" ")}>{statusLabel}</span>
          <span className={["chip", "goal-chip", `goal-chip--pri-${goal.priority}`].join(" ")}>{priorityLabel}</span>
        </div>

        <div className="goal-card__actions">
          <label className="goal-card__field">
            <span>Status</span>
            <select
              value={goal.status}
              onChange={(e) => updateGoal({ ...goal, status: e.target.value as Status })}
              className="field select"
            >
              <option value="open">Open</option>
              <option value="in-progress">In progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </label>

          <label className="goal-card__field">
            <span>Priority</span>
            <select
              value={goal.priority}
              onChange={(e) => updateGoal({ ...goal, priority: e.target.value as Priority })}
              className="field select"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <button type="button" className="btn btn--danger" onClick={() => deleteGoal(goal.id)}>Delete</button>
        </div>
      </div>
    </article>
  );
}
