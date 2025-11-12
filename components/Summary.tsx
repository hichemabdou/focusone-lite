"use client";

import { Goal } from "./GoalsContext";

<<<<<<< ours
type Props = { goals: Goal[]; className?: string };

export default function Summary({ goals, className = "" }: Props) {
=======
export default function Summary({ goals, className = "" }: { goals: Goal[]; className?: string }) {
  const open = goals.filter((g) => g.status === "open").length;
  const inprog = goals.filter((g) => g.status === "in-progress").length;
>>>>>>> theirs
  const blocked = goals.filter((g) => g.status === "blocked").length;
  const done = goals.filter((g) => g.status === "done").length;

  const items = [
    { key: "total", label: "Total", value: goals.length, dot: "dot--total" },
    { key: "active", label: "Active", value: goals.length - done, dot: "dot--active" },
    { key: "blocked", label: "Blocked", value: blocked, dot: "dot--blocked" },
    { key: "done", label: "Done", value: done, dot: "dot--done" },
  ] as const;

  return (
<<<<<<< ours
    <div className={["stats-strip stats-strip--kpis", className].join(" ")}>
      {items.map((it) => (
        <div key={it.key} className={["stats-strip__item", `stats-strip__item--${it.key}`].join(" ")}>
          <span className={["dot", it.dot].join(" ")} />
          <span className="stats-strip__label">{it.label}</span>
          <span className="stats-strip__value">{it.value}</span>
        </div>
      ))}
=======
    <div className={["grid grid-cols-2 gap-3 md:grid-cols-4", className].filter(Boolean).join(" ")>
      <Cell label="Open" value={open} />
      <Cell label="In-progress" value={inprog} />
      <Cell label="Blocked" value={blocked} />
      <Cell label="Done" value={done} />
>>>>>>> theirs
    </div>
  );
}
