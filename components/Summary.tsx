"use client";

import { Goal } from "./GoalsContext";

export default function Summary({ goals }: { goals: Goal[] }) {
  const now = new Date();
  const counts = {
    open: goals.filter(g => g.status === "open").length,
    inprogress: goals.filter(g => g.status === "in-progress").length,
    blocked: goals.filter(g => g.status === "blocked").length,
    done: goals.filter(g => g.status === "done").length,
    overdue: goals.filter(g => g.status !== "done" && new Date(g.due) < now).length,
  };

  const Item = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
      <div className="text-[11px] opacity-70">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-5 gap-2 mb-3">
      <Item label="Open" value={counts.open} />
      <Item label="In-progress" value={counts.inprogress} />
      <Item label="Blocked" value={counts.blocked} />
      <Item label="Done" value={counts.done} />
      <Item label="Overdue" value={counts.overdue} />
    </div>
  );
}
