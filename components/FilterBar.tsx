"use client";

import { Category, Priority, Status } from "./GoalsContext";

export type DomainMode = "fit" | "this-year";

const ALL_CAT: Category[] = ["STRATEGY", "VISION", "TACTICAL", "PROJECT", "DAILY"];
const ALL_PRI: Priority[] = ["low", "medium", "high", "critical"];
const ALL_STA: Status[] = ["open", "in-progress", "blocked", "done"];

function ToggleGroup<T extends string>({
  label, values, all, setValues,
}: { label: string; values: T[]; all: readonly T[]; setValues: (v: T[]) => void }) {
  const onToggle = (v: T) =>
    setValues(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  const onReset = () => setValues([...all]);

  return (
    <details className="relative">
      <summary className="cursor-pointer select-none rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
        {label} ({values.length})
      </summary>
      <div className="absolute z-20 mt-1 w-52 rounded-md border border-white/10 bg-neutral-900 p-2 shadow-xl">
        <div className="mb-2 flex justify-between text-xs opacity-70">
          <span>{label}</span>
          <button className="underline" onClick={onReset} type="button">All</button>
        </div>
        <div className="max-h-56 space-y-1 overflow-auto pr-1">
          {all.map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.includes(v)}
                onChange={() => onToggle(v)}
                className="accent-white"
              />
              <span className="capitalize">{String(v).replace("-", " ")}</span>
            </label>
          ))}
        </div>
      </div>
    </details>
  );
}

export default function FilterBar(props: {
  search: string; setSearch: (v: string) => void;
  categories: Category[]; setCategories: (v: Category[]) => void;
  priorities: Priority[]; setPriorities: (v: Priority[]) => void;
  statuses: Status[]; setStatuses: (v: Status[]) => void;
  mode: DomainMode; setMode: (m: DomainMode) => void;
}) {
  const { search, setSearch, categories, setCategories, priorities, setPriorities, statuses, setStatuses, mode, setMode } = props;

  const clear = () => {
    setSearch("");
    setCategories([...ALL_CAT]);
    setPriorities([...ALL_PRI]);
    setStatuses([...ALL_STA]);
  };

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
      <input
        placeholder="Search title…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="min-w-[260px] flex-1 rounded-md bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/25"
      />

      <div className="ml-auto flex items-center gap-2">
        <ToggleGroup label="Category" values={categories} all={ALL_CAT} setValues={setCategories} />
        <ToggleGroup label="Priority" values={priorities} all={ALL_PRI} setValues={setPriorities} />
        <ToggleGroup label="Status" values={statuses} all={ALL_STA} setValues={setStatuses} />

        <div className="ml-1 inline-flex overflow-hidden rounded-md ring-1 ring-white/10">
          <button
            onClick={() => setMode("fit")}
            className={`px-3 py-1.5 text-sm ${mode === "fit" ? "bg-white text-neutral-900" : "bg-white/10 hover:bg-white/20"}`}
          >
            Fit
          </button>
          <button
            onClick={() => setMode("this-year")}
            className={`px-3 py-1.5 text-sm ${mode === "this-year" ? "bg-white text-neutral-900" : "bg-white/10 hover:bg-white/20"}`}
          >
            This Year
          </button>
        </div>

        <button onClick={clear} className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
          Clear
        </button>
      </div>
    </div>
  );
}
