"use client";

import GoalsList from "@/components/GoalsList";
import GoalFilters from "@/components/GoalFilters";
import Summary from "@/components/Summary";
import Timeline from "@/components/Timeline";
import { useGoals } from "@/components/GoalsContext";

/**
 * Layout:
 * ┌────────── sticky left ┬──────────────────────────────────────────────┐
 * │  Filters (frameless)  │ Timeline (hero)                              │
 * │                       │ Summary (compact)                            │
 * │                       │ Goal library                                 │
 * └───────────────────────┴──────────────────────────────────────────────┘
 */
export default function ClassicClient() {
  const { goals, visibleGoals } = useGoals();
  const activeGoals = visibleGoals ?? goals ?? [];

  return (
    <div className="app">
      <div className="app__inner mx-auto max-w-7xl">
        <div className="app__grid">
          {/* LEFT: sticky filters (no outer panel, avoids double frame) */}
          <aside className="sidebar">
            <div className="sidebar__inner">
              <GoalFilters />
            </div>
          </aside>

          {/* RIGHT: Main column */}
          <main className="main">
            {/* Timeline (hero) */}
            <section className="panel" style={{ minHeight: "clamp(440px, 52vh, 640px)" }}>
              <div className="panel__head">
                <h2 className="panel__title">Timeline overview</h2>
              </div>
              <div className="panel__body min-w-0">
                <Timeline />
              </div>
            </section>

            {/* Compact summary */}
            <section className="panel panel--compact">
              <div className="panel__head">
                <h2 className="panel__title">Overview</h2>
              </div>
              <div className="panel__body">
                <Summary goals={activeGoals} className="grid grid-cols-2 gap-3 md:grid-cols-4" />
              </div>
            </section>

            {/* Goal library */}
            <section className="panel flex-1 min-w-0">
              <div className="panel__head">
                <h2 className="panel__title">Goal library</h2>
              </div>
              <div className="panel__body h-full">
                <GoalsList />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
