"use client";

import { useMemo, useState } from "react";
import { GoalsProvider, useGoals, Category, Priority, Status } from "@/components/GoalsContext";
import FilterBar, { DomainMode } from "@/components/FilterBar";
import Summary from "@/components/Summary";
import Timeline from "@/components/Timeline";
import GoalsList from "@/components/GoalsList";

function ClassicInner() {
  const { goals, importMany, exportJson } = useGoals();

  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>(["STRATEGY","VISION","TACTICAL","PROJECT","DAILY"]);
  const [priorities, setPriorities] = useState<Priority[]>(["low","medium","high","critical"]);
  const [statuses, setStatuses] = useState<Status[]>(["open","in-progress","blocked","done"]);
  const [mode, setMode] = useState<DomainMode>("fit");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return goals.filter((g) =>
      categories.includes(g.category) &&
      priorities.includes(g.priority) &&
      statuses.includes(g.status) &&
      (q ? g.title.toLowerCase().includes(q) : true)
    );
  }, [goals, search, categories, priorities, statuses]);

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>

        <FilterBar
          search={search} setSearch={setSearch}
          categories={categories} setCategories={setCategories}
          priorities={priorities} setPriorities={setPriorities}
          statuses={statuses} setStatuses={setStatuses}
          mode={mode} setMode={setMode}
          onAdd={() => document.querySelector<HTMLButtonElement>("#goals-list-add")?.click()}
          onImport={(raw) => {
            try {
              const arr = JSON.parse(raw);
              if (Array.isArray(arr)) importMany(arr);
            } catch { alert("Invalid JSON"); }
          }}
          onExport={() => {
            const data = exportJson();
            navigator.clipboard.writeText(data);
            alert("Export copied to clipboard");
          }}
        />

        <Summary goals={filtered} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <Timeline goals={filtered} mode={mode} />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            {/* GoalsList has its own Add button, expose hidden trigger for FilterBar */}
            <button id="goals-list-add" className="hidden" />
            <GoalsList visibleGoals={filtered} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ClassicPage() {
  return (
    <GoalsProvider>
      <ClassicInner />
    </GoalsProvider>
  );
}
