"use client";

import { useMemo, useRef, useState } from "react";
import { Goal, Priority, Status, Category, useGoals } from "./GoalsContext";

function fmtDate(iso: string) {
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

export default function GoalsList() {
  const { goals, createGoal, updateGoal, deleteGoal, replaceAll } = useGoals();
  const [editing, setEditing] = useState<Goal | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(() => [...goals].sort((a, b) => (a.due < b.due ? -1 : 1)), [goals]);

  // ===== Toolbar actions =====
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

  const onImportClick = () => fileRef.current?.click();

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const raw = JSON.parse(text);
      if (!Array.isArray(raw)) throw new Error("JSON must be an array of goals");
      const normalized: Goal[] = raw.map((g: any) => ({
        id: g.id ?? Math.random().toString(36).slice(2),
        title: String(g.title ?? "Untitled"),
        start: String(g.start ?? new Date().toISOString().slice(0,10)),
        due: String(g.due ?? new Date().toISOString().slice(0,10)),
        priority: (g.priority ?? "medium") as Priority,
        status: (g.status ?? "open") as Status,
        category: (g.category ?? "PROJECT") as Category,
      }));
      replaceAll(normalized);
      e.target.value = "";
    } catch (err) {
      alert("Import failed: " + (err as Error).message);
    }
  };

  const onExport = () => {
    const blob = new Blob([JSON.stringify(goals, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "focusone-goals.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const onSeed = () => {
    const today = new Date();
    const addDays = (n: number) => {
      const d = new Date(today); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10);
    };
    const demo: Goal[] = [
      { id: crypto.randomUUID(), title:"Define Life Vision", start:addDays(-60), due:addDays(-30), priority:"medium", status:"done", category:"STRATEGY" },
      { id: crypto.randomUUID(), title:"A2 German Course", start:addDays(-10), due:addDays(35), priority:"high", status:"in-progress", category:"TACTICAL" },
      { id: crypto.randomUUID(), title:"MVP Timeline v1", start:addDays(-5), due:addDays(20), priority:"critical", status:"in-progress", category:"PROJECT" },
      { id: crypto.randomUUID(), title:"Daily German 20m", start:addDays(-7), due:addDays(90), priority:"medium", status:"open", category:"DAILY" },
      { id: crypto.randomUUID(), title:"Quarterly Review Q4", start:addDays(40), due:addDays(50), priority:"low", status:"open", category:"VISION" },
      { id: crypto.randomUUID(), title:"Gym Routine", start:addDays(3), due:addDays(60), priority:"medium", status:"open", category:"DAILY" },
      { id: crypto.randomUUID(), title:"Content Plan", start:addDays(10), due:addDays(80), priority:"high", status:"open", category:"PROJECT" },
    ];
    replaceAll(demo);
  };

  // ===== Modal save/cancel =====
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
      {/* Header + toolbar */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Goals</h2>
        <div className="flex items-center gap-2">
          <button onClick={onSeed} className="rounded-md bg-white/5 hover:bg-white/10 px-2.5 py-1 text-xs">Seed demo</button>
          <button onClick={onExport} className="rounded-md bg-white/5 hover:bg-white/10 px-2.5 py-1 text-xs">Export JSON</button>
          <button onClick={onImportClick} className="rounded-md bg-white/5 hover:bg-white/10 px-2.5 py-1 text-xs">Import JSON</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile}/>
          <button onClick={onAdd} className="rounded-md bg-white/10 hover:bg-white/20 px-3 py-1 text-sm">+ Add</button>
        </div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <p className="text-sm text-neutral-400 italic">No goals yet. Use **Seed demo** or **Add**.</p>
      ) : (
        <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-neutral-300">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Title</th>
                <th className="text-left px-3 py-2 font-medium">Dates</th>
                <th className="text-left px-3 py-2 font-medium">Priority</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-left px-3 py-2 font-medium">Category</th>
                <th className="text-right px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sorted.map((g) => (
                <tr key={g.id} className="odd:bg-white/0 even:bg-white/[0.03]">
                  <td className="px-3 py-2 truncate">{g.title || <span className="opacity-50">Untitled</span>}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(g.start)} — {fmtDate(g.due)}</td>
                  <td className="px-3 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${PRI_BADGE[g.priority]}`}>{g.priority}</span></td>
                  <td className="px-3 py-2 capitalize">{g.status.replace("-", " ")}</td>
                  <td className="px-3 py-2">{g.category}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => setEditing({ ...g })} className="text-xs text-neutral-300 hover:text-white mr-3">Edit</button>
                    <button onClick={() => deleteGoal(g.id)} className="text-xs text-rose-400 hover:text-rose-300">Delete</button>
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
              <button onClick={() => setEditing(null)} className="text-sm text-neutral-400 hover:text-neutral-200">✕</button>
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
