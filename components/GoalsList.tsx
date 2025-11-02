"use client";

import { useMemo, useState } from "react";
import { Goal, Priority, Status, useGoals } from "./GoalsContext";
import Modal from "./Modal";

function prettyRange(g: Goal) {
  const s = new Date(g.startDate);
  const e = new Date(g.endDate);
  const fmt = (d: Date) => d.toLocaleString(undefined, { month: "short", day: "2-digit" });
  return `${fmt(s)} — ${fmt(e)}`;
}

const STATUS_BADGES: Record<Status, string> = {
  open: "bg-white/10 text-white",
  "in-progress": "bg-amber-400/20 text-amber-200",
  blocked: "bg-rose-500/15 text-rose-200",
  done: "bg-emerald-500/20 text-emerald-200",
};

const PRIORITY_BADGES: Record<Priority, string> = {
  low: "border-white/10",
  medium: "border-white/20",
  high: "border-amber-400/40",
  critical: "border-rose-500/40",
};

function toISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(base: Date, amount: number) {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

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

  const openModal = () => {
    setDraft(DEFAULT_GOAL());
    setError(null);
    setModalOpen(true);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError("Give the goal a name so it stands out on the timeline.");
      return;
    }
    if (draft.startDate > draft.endDate) {
      setError("The end date comes after the start. Flip them and try again.");
      return;
    }

    addGoal({ ...draft, notes: draft.notes?.trim() ? draft.notes.trim() : undefined });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Goal library</h2>
          <p className="text-sm text-white/60">
            Keep a premium, high-level list of what matters. Edit status inline, or add a fresh intention in seconds.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openModal}
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900 shadow"
          >
            + New goal
          </button>
          <label className="cursor-pointer rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/20">
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
            onClick={() => {
              const blob = new Blob([exportJson()], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = "goals.json";
              anchor.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/20"
          >
            Export
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 text-xs text-white/50">
        <span>Open {counts.open}</span>
        <span>In-progress {counts.inprog}</span>
        <span>Blocked {counts.blocked}</span>
        <span>Done {counts.done}</span>
      </div>

      <div className="space-y-3">
        {items.map((goal) => (
          <article
            key={goal.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_40px_-30px_rgba(15,15,20,0.9)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">{goal.category}</p>
                <h3 className="text-lg font-medium text-white">{goal.title}</h3>
                <p className="text-sm text-white/60">{prettyRange(goal)}</p>
                {goal.notes && <p className="text-sm text-white/70">{goal.notes}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`rounded-full px-3 py-1 ${STATUS_BADGES[goal.status]}`}>{goal.status}</span>
                  <span className={`rounded-full border px-3 py-1 text-white/70 ${PRIORITY_BADGES[goal.priority]}`}>
                    {goal.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <label className="flex items-center gap-1">
                    <span>Status</span>
                    <select
                      value={goal.status}
                      onChange={(event) => updateGoal({ ...goal, status: event.target.value as Status })}
                      className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/40"
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
                      onChange={(event) => updateGoal({ ...goal, priority: event.target.value as Priority })}
                      className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/40"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => deleteGoal(goal.id)}
                  disabled={busy}
                  className="text-xs font-medium text-rose-300 transition hover:text-rose-200 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}

        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
            No goals yet. Tap “New goal” to start your roadmap or import a JSON file.
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add a goal">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white/40">Title</span>
              <input
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Name the intention"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white/40">Category</span>
              <select
                value={draft.category}
                onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value as Goal["category"] }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="STRATEGY">Strategy</option>
                <option value="VISION">Vision</option>
                <option value="TACTICAL">Tactical</option>
                <option value="PROJECT">Project</option>
                <option value="DAILY">Daily</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white/40">Start</span>
              <input
                type="date"
                value={draft.startDate}
                onChange={(event) => setDraft((prev) => ({ ...prev, startDate: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white/40">End</span>
              <input
                type="date"
                value={draft.endDate}
                onChange={(event) => setDraft((prev) => ({ ...prev, endDate: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white/40">Priority</span>
              <select
                value={draft.priority}
                onChange={(event) => setDraft((prev) => ({ ...prev, priority: event.target.value as Priority }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white/40">Status</span>
              <select
                value={draft.status}
                onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value as Status }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="open">Open</option>
                <option value="in-progress">In-progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/40">Notes</span>
            <textarea
              value={draft.notes}
              onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Optional context or nudges"
              className="h-28 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </label>

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/15"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900">
              Save goal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
