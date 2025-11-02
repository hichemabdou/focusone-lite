"use client";

import { useMemo, useRef, useState } from "react";
import { Goal, Priority, Status, Category, useGoals } from "./GoalsContext";

function fmt(iso: string) {
  try {
    const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  } catch { return iso; }
}

const PRI_BADGE: Record<Priority, string> = {
  low: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30",
  high: "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30",
  critical: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30",
};

export default function GoalsList({ visibleGoals }: { visibleGoals: Goal[] }) {
  const { goals, createGoal, updateGoal, deleteGoal, replaceAll } = useGoals();
  const [editing, setEditing] = useState<Goal | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(() => [...visibleGoals].sort((a,b) => (a.due < b.due ? -1 : 1)), [visibleGoals]);

  const onAdd = () => {
    const t = new Date();
    const d = new Date(t); d.setDate(d.getDate() + 30);
    setEditing({
      id: "__new__",
      title: "",
      start: t.toISOString().slice(0,10),
      due: d.toISOString().slice(0,10),
      priority: "medium",
      status: "open",
      category: "PROJECT",
    });
  };

  const onExport = () => {
    const blob = new Blob([JSON.stringify(goals, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "focusone-goals.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const onImportClick = () => fileRef.current?.click();
  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const raw = JSON.parse(text);
      if (!Array.isArray(raw)) throw new Error("JSON must be an array");
      const normalized: Goal[] = raw.map((g: any) => ({
        id: g.id ?? Math.random().toString(36).slice(2),
        title: String(g.title ?? "Untitled"),
        start: String(g.start ?? new Date().toISOString().slice(0,10)),
        due: String(g.due ?? new Date().toISOString().slice(0,10)),
        priority: (g.priority ?? "medium") as Priority,
        status: (g.status ?? "open") as Status,
        category: (g.category ?? "PROJECT") as Category,
      }));
      replaceAll(normalized); e.target.value = "";
    } catch (err) {
      alert("Import failed: " + (err as Error).message);
    }
  };

  const onSave = () => {
    if (!editing) return;
    const { id, ...payload } = editing;
    if (payload.due < payload.start) payload.due = payload.start;
    if (id === "__new__") createGoal(payload as Omit<Goal,"id">);
    else updateGoal(id, payload);
    setEditing(null);
  };

  return (
    <div className="text-neutral-200">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Goals</h2>
        <div className="flex items-center gap-2">
          <button onClick={onExport} className="rounded-md bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10">Export</button>
          <button onClick={onImportClick} className="rounded-md bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10">Import</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile}/>
          <button onClick={onAdd} className="rounded-md bg-white/10 px-3 py-1 text-sm hover:bg-white/20">+ Add</button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-neutral-400 italic">No goals for current filters.</p>
      ) : (
        <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-neutral-300">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Dates</th>
                <th className="px-3 py-2 text-left font-medium">Priority</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Category</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sorted.map((g) => (
                <tr key={g.id} className="odd:bg-white/0 even:bg-white/[0.03]">
                  <td className="px-3 py-2 truncate">{g.title}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmt(g.start)} — {fmt(g.due)}</td>
                  <td className="px-3 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${PRI_BADGE[g.priority]}`}>{g.priority}</span></td>
                  <td className="px-3 py-2 capitalize">{g.status.replace("-", " ")}</td>
                  <td className="px-3 py-2">{g.category}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => setEditing({ ...g })} className="mr-3 text-xs text-neutral-300 hover:text-white">Edit</button>
                    <button onClick={() => deleteGoal(g.id)} className="text-xs text-rose-400 hover:text-rose-300">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-900 p-4 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold">{editing.id === "__new__" ? "Add Goal" : "Edit Goal"}</h3>
              <button onClick={() => setEditing(null)} className="text-sm text-neutral-400 hover:text-neutral-200">✕</button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="opacity-80">Title</span>
                <input className="rounded-md bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/25"
                  value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}/>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="opacity-80">Start</span>
                  <input type="date" className="rounded-md bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/25"
                    value={editing.start} onChange={(e) => setEditing({ ...editing, start: e.target.value })}/>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="opacity-80">Due</span>
                  <input type="date" className="rounded-md bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/25"
                    value={editing.due} onChange={(e) => setEditing({ ...editing, due: e.target.value })}/>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  <span className="opacity-80">Priority</span>
                  <select className="rounded-md bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/25"
                    value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: e.target.value as Priority })}>
                    <option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="critical">critical</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="opacity-80">Status</span>
                  <select className="rounded-md bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/25"
                    value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as Status })}>
                    <option value="open">open</option><option value="in-progress">in-progress</option><option value="blocked">blocked</option><option value="done">done</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-1 text-sm">
                <span className="opacity-80">Category</span>
                <select className="rounded-md bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/25"
                  value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as Category })}>
                  <option value="STRATEGY">STRATEGY</option>
                  <option value="VISION">VISION</option>
                  <option value="TACTICAL">TACTICAL</option>
                  <option value="PROJECT">PROJECT</option>
                  <option value="DAILY">DAILY</option>
                </select>
              </label>

              <div className="mt-1 flex justify-end gap-2">
                <button onClick={() => setEditing(null)} className="rounded-md bg-white/5 px-3 py-2 text-sm hover:bg-white/10">Cancel</button>
                <button onClick={onSave} className="rounded-md bg-white px-3 py-2 text-sm font-medium text-neutral-900">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
