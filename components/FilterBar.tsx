"use client";

import { Category, Priority, Status } from "./GoalsContext";

const CAT: Category[] = ["STRATEGY", "VISION", "TACTICAL", "PROJECT", "DAILY"];
const PRI: Priority[] = ["low", "medium", "high", "critical"];
const STA: Status[] = ["open", "in-progress", "blocked", "done"];

export type DomainMode = "fit" | "this-year";

export default function FilterBar(props: {
  search: string; setSearch: (v: string) => void;
  categories: Category[]; setCategories: (v: Category[]) => void;
  priorities: Priority[]; setPriorities: (v: Priority[]) => void;
  statuses: Status[]; setStatuses: (v: Status[]) => void;
  mode: DomainMode; setMode: (m: DomainMode) => void;
}) {
  const { search, setSearch, categories, setCategories, priorities, setPriorities, statuses, setStatuses, mode, setMode } = props;

  const toggle = <T,>(arr: T[], v: T) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  const clear = () => {
    setSearch("");
    setCategories([...CAT]);
    setPriorities([...PRI]);
    setStatuses([...STA]);
  };

  return (
    <div className="mb-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          placeholder="Search title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px] rounded-md bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/25"
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setMode("fit")}
            className={`rounded-md px-3 py-1.5 text-sm ${mode === "fit" ? "bg-white text-neutral-900" : "bg-white/10 hover:bg-white/20"}`}
          >Fit</button>
          <button
            onClick={() => setMode("this-year")}
            className={`rounded-md px-3 py-1.5 text-sm ${mode === "this-year" ? "bg-white text-neutral-900" : "bg-white/10 hover:bg-white/20"}`}
          >This Year</button>
          <button onClick={clear} className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Clear</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs opacity-70">Category</span>
          {CAT.map((c) => (
            <button key={c}
              onClick={() => setCategories(toggle(categories, c))}
              className={`rounded-full px-2.5 py-1 text-[11px] ${categories.includes(c) ? "bg-white text-neutral-900" : "bg-white/10 hover:bg-white/20"}`}
            >{c}</button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs opacity-70">Priority</span>
          {PRI.map((p) => (
            <button key={p}
              onClick={() => setPriorities(toggle(priorities, p))}
              className={`rounded-full px-2.5 py-1 text-[11px] capitalize ${priorities.includes(p) ? "bg-white text-neutral-900" : "bg-white/10 hover:bg-white/20"}`}
            >{p}</button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs opacity-70">Status</span>
          {STA.map((s) => (
            <button key={s}
              onClick={() => setStatuses(toggle(statuses, s))}
              className={`rounded-full px-2.5 py-1 text-[11px] capitalize ${statuses.includes(s) ? "bg-white text-neutral-900" : "bg-white/10 hover:bg-white/20"}`}
            >{s.replace("-", " ")}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
