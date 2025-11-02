"use client";
import { useMemo, useState } from "react";
import { Goal, Priority, Status, useGoals } from "./GoalsContext";

function fmt(d: string) {
  try {
    const date = new Date(d + (d.length === 10 ? "T00:00:00" : ""));
    return date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  } catch {
    return d;
  }
}

const PRIORITY_BADGE: Record<Priority, string> = {
  low: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30",
  high: "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30",
  critical: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30",
};

export default function GoalsList() {
  const { goals, createGoal, updateGoal, deleteGoal } = useGoals();
  const [editing, setEditing] = useState<Goal | null>(null);

  const sorted = useMemo(() => {
    return [...goals].sort((a, b) => (a.due < b.due ? -1 : 1));
  }, [goals]);

  const onAdd = () => {
    const today = new Date();
    const in30 = new Date(today);
    in30.setDate(today.getDate() + 30);
    setEditing({
      id: "__new__",
      title: "",
      start: today.toISOString().slice(0, 10),
      due: in30.toISOString().slice(0, 10),
      priority: "medium",
      status: "open",
      category: "PROJECT",
    });
  };

  const onEdit = (g: Goal) => setEditing({ ...g });

  const onSave = () => {
    if (!editing) return;
    const { id, ...payload } = editing;

    // clamp dates
    if (payload.due < payload.start) payload.due = payload.start;

    if (id === "__new__") {
      createGoal(payload as Omit<Goal, "id">);
    } else {
      updateGoal(id, payload);
    }
    setEditing(null);
  };

  const onCancel = () => setEditing(null);

  return (
    <div className="text-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Goals</h2>
        <button
          onClick={onAdd}
          className="rounded-md bg-white/10 hover:bg-white/20 px-3 py-1 text-sm"
        >
          + Add
        </button>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <p className="text-sm text-neutral-400 italic">No goals yet. Click “Add”.</p>
      ) : (
        <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-neutral-300">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Title</th>
                <th className="text-left px-3 py-2 font-medium">Dates</th>
                <th className="text-left px-3 py-2 font-medium">Priority</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-right px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sorted.map((g) => (
                <tr key={g.id} className="odd:bg-white/0 even:bg-white/[0.03]">
                  <td className="px-3 py-2">
                    <div className="truncate">{g.title || <span className="opacity-50">Untitled</span>}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {fmt(g.start)} → {fmt(g.due)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${PRIORITY_BADGE[g.priority]}`}>
                      {g.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="capitalize opacity-90">{g.status.replace("-", " ")}</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => onEdit(g)}
                      className="text-xs text-neutral-300 hover:text-white mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-900 p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold">{editing.id === "__new__" ? "Add Goal" : "Edit Goal"}</h3>
              <button onClick={onCancel} className="text-sm text-neutral-400 hover:text-neutral-200">✕</button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="opacity-80">Title</span>
                <input
                  className="rounded-md bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/25"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Goal title"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="opacity-80">Start</span>
                  <input
                    type="date"
                    className="rounded-md bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/25"
                    value={editing.start}
                    onChange={(e) => setEditing({ ...editing, start: e.target.value })}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="opacity-80">Due</span>
                  <input
                    type="date"
                    className="rounded-md bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/25"
                    value={editing.due}
                    onChange={(e) => setEditing({ ...editing, due: e.target.value })}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="opacity-80">Priority</span>
                  <select
                    className="rounded-md bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/25"
                    value={editing.priority}
                    onChange={(e) => setEditing({ ...editing, priority: e.target.value as Priority })}
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="critical">critical</option>
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="opacity-80">Status</span>
                  <select
                    className="rounded-md bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/25"
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as Status })}
                  >
                    <option value="open">open</option>
                    <option value="in-progress">in-progress</option>
                    <option value="blocked">blocked</option>
                    <option value="done">done</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-1 text-sm">
                <span className="opacity-80">Category</span>
                <select
                  className="rounded-md bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/25"
                  value={editing.category ?? "PROJECT"}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      category: e.target.value as Goal["category"],
                    })
                  }
                >
                  <option value="STRATEGY">STRATEGY</option>
                  <option value="VISION">VISION</option>
                  <option value="TACTICAL">TACTICAL</option>
                  <option value="PROJECT">PROJECT</option>
                  <option value="DAILY">DAILY</option>
                </select>
              </label>

              <div className="mt-1 flex justify-end gap-2">
                <button onClick={onCancel} className="rounded-md bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
                  Cancel
                </button>
                <button onClick={onSave} className="rounded-md bg-white px-3 py-2 text-sm font-medium text-neutral-900">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
