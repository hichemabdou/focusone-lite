"use client";

import { Goal } from "./GoalsContext";

export default function Summary({ goals, className = "" }: { goals: Goal[]; className?: string }) {
  const open = goals.filter((g) => g.status === "open").length;
  const inprog = goals.filter((g) => g.status === "in-progress").length;
  const blocked = goals.filter((g) => g.status === "blocked").length;
  const done = goals.filter((g) => g.status === "done").length;

  const Cell = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );

  return (
    <div className={["grid grid-cols-2 gap-3 md:grid-cols-4", className].filter(Boolean).join(" ")>
      <Cell label="Open" value={open} />
      <Cell label="In-progress" value={inprog} />
      <Cell label="Blocked" value={blocked} />
      <Cell label="Done" value={done} />
    </div>
  );
}
