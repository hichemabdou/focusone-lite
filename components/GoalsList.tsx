"use client";

import { useMemo, useState } from "react";
import { Goal, useGoals } from "./GoalsContext";

function prettyRange(g: Goal) {
  const s = new Date(g.startDate);
  const e = new Date(g.endDate);
  const fmt = (d: Date) =>
    d.toLocaleString(undefined, { month: "short", day: "2-digit" });
  return `${fmt(s)} — ${fmt(e)}`;
}

export default function GoalsList() {
  const { visibleGoals, goals, exportJson, importJson, deleteGoal } = useGoals();
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-medium flex-1">Goals</h2>
        <button
          className="text-xs rounded-md border border-white/10 px-2 py-1 bg-white/5"
          onClick={() => {
            const blob = new Blob([exportJson()], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "goals.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export
        </button>
        <label className="text-xs rounded-md border border-white/10 px-2 py-1 bg-white/5 cursor-pointer">
          Import
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              const text = await file.text();
              try {
                const data = JSON.parse(text);
                if (Array.isArray(data)) importJson(data);
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
      </div>

      <div className="text-xs text-neutral-400">
        Open {counts.open} · In-progress {counts.inprog} · Blocked {counts.blocked} · Done{" "}
        {counts.done}
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-neutral-300">
            <tr>
              <th className="text-left px-3 py-2">Title</th>
              <th className="text-left px-3 py-2">Dates</th>
              <th className="text-left px-3 py-2">Priority</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Category</th>
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((g) => (
              <tr key={g.id} className="border-t border-white/10">
                <td className="px-3 py-2">{g.title}</td>
                <td className="px-3 py-2">{prettyRange(g)}</td>
                <td className="px-3 py-2">{g.priority}</td>
                <td className="px-3 py-2">{g.status}</td>
                <td className="px-3 py-2">{g.category}</td>
                <td className="px-3 py-2">
                  <button
                    className="text-red-400 hover:text-red-300"
                    onClick={() => deleteGoal(g.id)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-neutral-400" colSpan={6}>
                  No goals yet. Use Import to load sample data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
