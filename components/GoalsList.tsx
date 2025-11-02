"use client";

import { useMemo, useState } from "react";
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

const STATUS_BADGES: Record<Status, string> = {
  open: "",
  "in-progress": "bg-amber-400/20 text-amber-200",
  blocked: "bg-rose-400/20 text-rose-300",
  done: "bg-emerald-400/20 text-emerald-100",
};
const PRIORITY_BADGES: Record<Priority, string> = {
  low: "",
  medium: "",
  high: "",
  critical: "ring-2 ring-rose-400",
};

/* ---------- component ---------- */
export default function GoalsList() {
  const { visibleGoals, goals, exportJson, importJson, deleteGoal, addGoal, updateGoal } = useGoals();
  const items = (visibleGoals ?? goals ?? []) as Goal[];

  const counts = useMemo(() => {
    return {
      open: items.filter((g) => g.status === "open").length,
      inprog: items.filter((g) => g.status === "in-progress").length,
      blocked: items.filter((g) => g.status === "blocked").length,
      done: items.filter((g) => g.status === "done").length,
    };
  }, [items]);

  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<Goal, "id">>(DEFAULT_GOAL());
  const [error, setError] = useState<string | null>(null);
  const openModal = () => { setDraft(DEFAULT_GOAL()); setError(null); setModalOpen(true); };

  return (
    <div className="min-w-0">
      {/* Header (no duplicate title; panel title is enough) */}
      <header className="mb-3 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-white/60">
            Keep a premium, high-level list. Edit inline or add a new intention quickly.
          </p>
          <div className="text-xs text-white/50">
            Open {counts.open} • In-progress {counts.inprog} • Blocked {counts.blocked} • Done {counts.done}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={openModal} className="btn btn--primary">+ New goal</button>

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
      </header>

      {/* List */}
      <div className="space-y-3">
        {items.map((goal) => (
          <article key={goal.id} className="goal-card">
            <div className="min-w-0">
              <div className="goal-card__meta uppercase text-white/50 text-[11px] tracking-[0.2em]">
                {goal.category}
              </div>
              <h3 className="goal-card__title">{goal.title || <span className="text-white/50">Untitled</span>}</h3>
              <div className="goal-card__meta">{prettyRange(goal)}</div>
              {goal.notes && <div className="goal-card__meta">{goal.notes}</div>}
            </div>

            <div className="goal-card__right">
              {/* chips */}
              <div className="flex items-center gap-2">
                <span className={`chip ${STATUS_BADGES[goal.status]}`}>{goal.status}</span>
                <span className={`chip ${PRIORITY_BADGES[goal.priority]}`}>{goal.priority}</span>
              </div>

              {/* inline edit (clean selects) */}
              <div className="goal-card__actions">
                <label className="flex items-center gap-1">
                  <span>Status</span>
                  <select
                    value={goal.status}
                    onChange={(e) => updateGoal({ ...goal, status: e.target.value as Status })}
                    className="field select"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In-progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </label>

                <label className="flex items-center gap-1">
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
