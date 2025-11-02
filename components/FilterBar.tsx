"use client";

import { Category, Priority, Status } from "./GoalsContext";
export type DomainMode = "fit" | "this-year";

const CATS: Category[] = ["STRATEGY","VISION","TACTICAL","PROJECT","DAILY"];
const PRIOS: Priority[] = ["low","medium","high","critical"];
const STATES: Status[] = ["open","in-progress","blocked","done"];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${active ? "bg-white text-neutral-900 ring-white" : "bg-white/5 text-white ring-white/10 hover:bg-white/10"}`}
    >
      {children}
    </button>
  );
}

export default function FilterBar(props: {
  search: string; setSearch: (v: string) => void;
  categories: Category[]; setCategories: (v: Category[]) => void;
  priorities: Priority[]; setPriorities: (v: Priority[]) => void;
  statuses: Status[]; setStatuses: (v: Status[]) => void;
  mode: DomainMode; setMode: (v: DomainMode) => void;
  onAdd: () => void;
  onImport: (raw: string) => void;
  onExport: () => void;
}) {
  const { search, setSearch, categories, setCategories, priorities, setPriorities, statuses, setStatuses, mode, setMode, onAdd, onImport, onExport } = props;

  const toggle = <T extends string>(v: T, list: T[], set: (x: T[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const reset = () => {
    setCategories([...CATS]);
    setPriorities([...PRIOS]);
    setStatuses([...STATES]);
    setSearch("");
  };

  return (
    <div className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_auto]">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title…"
          className="min-w-[240px] flex-1 rounded-md bg-white/10 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
        />
        <div className="hidden h-6 w-px bg-white/10 md:block" />
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={mode === "fit"} onClick={() => setMode("fit")}>Fit</Chip>
          <Chip active={mode === "this-year"} onClick={() => setMode("this-year")}>This Year</Chip>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {CATS.map((c) => (
            <Chip key={c} active={categories.includes(c)} onClick={() => toggle(c, categories, setCategories)}>{c}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRIOS.map((p) => (
            <Chip key={p} active={priorities.includes(p)} onClick={() => toggle(p, priorities, setPriorities)}>{p}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {STATES.map((s) => (
            <Chip key={s} active={statuses.includes(s)} onClick={() => toggle(s, statuses, setStatuses)}>{s}</Chip>
          ))}
        </div>

        <div className="hidden h-6 w-px bg-white/10 md:block" />

        <button onClick={onAdd} className="rounded-md bg-white px-3 py-2 text-sm font-medium text-neutral-900">+ Add</button>
        <button onClick={() => {
          const raw = prompt("Paste JSON to import");
          if (raw) onImport(raw);
        }} className="rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/20">Import</button>
        <button onClick={onExport} className="rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/20">Export</button>
        <button onClick={reset} className="rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/20">Clear</button>
      </div>
    </div>
  );
}
