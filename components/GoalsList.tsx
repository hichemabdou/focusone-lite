"use client";

import { useMemo, useState } from "react";
import { Goal, useGoals, Category, Priority, Status } from "./GoalsContext";
import Modal from "./Modal";

function Badge({ children, tone }: { children: React.ReactNode; tone: "low"|"medium"|"high"|"critical"|"muted" }) {
  const map = {
    low: "bg-emerald-500",
    medium: "bg-amber-300 text-neutral-900",
    high: "bg-orange-400",
    critical: "bg-rose-500",
    muted: "bg-white/10 text-white/80",
  } as const;
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[tone]}`}>{children}</span>;
}

const cats: Category[] = ["STRATEGY","VISION","TACTICAL","PROJECT","DAILY"];
const prios: Priority[] = ["low","medium","high","critical"];
const stats: Status[] = ["open","in-progress","blocked","done"];

export default function GoalsList({ visibleGoals }: { visibleGoals: Goal[] }) {
  const { remove, add, update, exportJson, importMany } = useGoals();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const [form, setForm] = useState<Omit<Goal,"id">>({
    title: "",
    start: new Date().toISOString().slice(0,10),
    due:   new Date().toISOString().slice(0,10),
    category: "TACTICAL",
    priority: "medium",
    status: "open",
    notes: "",
  });

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editing) {
      update(editing.id, form);
    } else {
      add(form);
    }
    setOpen(false);
    setEditing(null);
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      title: "",
      start: new Date().toISOString().slice(0,10),
      due:   new Date().toISOString().slice(0,10),
      category: "TACTICAL",
      priority: "medium",
      status: "open",
      notes: "",
    });
    setOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditing(g);
    const { id, ...rest } = g;
    setForm(rest);
    setOpen(true);
  };

  const counts = useMemo(() => ({
    open: visibleGoals.filter(g => g.status === "open").length,
    inprog: visibleGoals.filter(g => g.status === "in-progress").length,
    blocked: visibleGoals.filter(g => g.status === "blocked").length,
    done: visibleGoals.filter(g => g.status === "done").length,
  }), [visibleGoals]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm text-white/70">
          <Badge tone="muted">Open {counts.open}</Badge>{" "}
          <Badge tone="muted">In-progress {counts.inprog}</Badge>{" "}
          <Badge tone="muted">Blocked {counts.blocked}</Badge>{" "}
          <Badge tone="muted">Done {counts.done}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openNew} className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-900">+ Add</button>
          <button
            onClick={() => {
              const raw = prompt("Paste JSON to import");
              if (!raw) return;
              try {
                const arr = JSON.parse(raw) as Goal[];
                if (Array.isArray(arr)) importMany(arr);
              } catch { alert("Invalid JSON"); }
            }}
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          >
            Import
          </button>
          <button
            onClick={() => {
              const data = exportJson();
              navigator.clipboard.writeText(data);
              alert("Export copied to clipboard");
            }}
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          >
            Export
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Dates</th>
              <th className="px-3 py-2 text-left">Priority</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleGoals.map((g) => (
              <tr key={g.id} className="border-t border-white/5">
                <td className="px-3 py-2">{g.title}</td>
                <td className="px-3 py-2">{new Date(g.start).toLocaleDateString()} — {new Date(g.due).toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  <Badge tone={g.priority as any}>{g.priority}</Badge>
                </td>
                <td className="px-3 py-2">{g.status}</td>
                <td className="px-3 py-2">{g.category}</td>
                <td className="px-3 py-2">
                  <button onClick={() => openEdit(g)} className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/20">Edit</button>
                  <button onClick={() => remove(g.id)} className="ml-2 rounded-md bg-rose-600/90 px-2 py-1 text-xs hover:bg-rose-600">Delete</button>
                </td>
              </tr>
            ))}
            {!visibleGoals.length && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-white/50">No goals match the filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Goal" : "Add Goal"}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/60">Title</span>
            <input
              autoFocus
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded-md bg-white/10 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/60">Category</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
              className="rounded-md bg-white/10 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
            >
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/60">Start</span>
            <input
              type="date"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
              className="rounded-md bg-white/10 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/60">Due</span>
            <input
              type="date"
              value={form.due}
              onChange={(e) => setForm({ ...form, due: e.target.value })}
              className="rounded-md bg-white/10 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/60">Priority</span>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              className="rounded-md bg-white/10 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
            >
              {prios.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/60">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
              className="rounded-md bg-white/10 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
            >
              {stats.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <label className="md:col-span-2 flex flex-col gap-1">
            <span className="text-xs text-white/60">Notes (optional)</span>
            <textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="rounded-md bg-white/10 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
            />
          </label>

          <div className="md:col-span-2 mt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/20">Cancel</button>
            <button type="submit" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-900">
              {editing ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
