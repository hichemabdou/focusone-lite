"use client";

import GoalsList from "@/components/GoalsList";
import GoalFilters from "@/components/GoalFilters";
import Summary from "@/components/Summary";
import Timeline from "@/components/Timeline";
import { useGoals } from "@/components/GoalsContext";

export default function ClassicClient() {
  const { goals, visibleGoals } = useGoals();
  const activeGoals = visibleGoals ?? goals ?? [];

  const scrollToLibrary = () => {
    document.getElementById("goal-library")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="workspace">
      <section className="workspace__hero">
        <div className="workspace__hero-copy">
          <p className="workspace__eyebrow">Focus.One workspace</p>
          <h1>Manage every intention with calm clarity.</h1>
          <p>
            Filter horizons on the left, adjust the timeline density on the right, and capture milestones without
            breaking flow. It’s a premium control centre for modern goal management.
          </p>
        </div>
        <div className="workspace__hero-side">
          <Summary goals={activeGoals} />
          <div className="workspace__hero-actions">
            <button type="button" className="btn btn--primary" onClick={scrollToLibrary}>
              + Add a goal
            </button>
            <button type="button" className="btn" onClick={scrollToLibrary}>
              Jump to library
            </button>
          </div>
        </div>
      </section>

      <div className="workspace__layout">
        <aside className="workspace__sidebar">
          <GoalFilters />
        </aside>

        <div className="workspace__main">
          <section className="workspace__panel workspace__panel--timeline">
            <div className="workspace__panel-head">
              <div>
                <p className="workspace__eyebrow">Timeline</p>
                <h2>Multiple windows, one integrated view</h2>
                <p className="workspace__lead">
                  Toggle between this month, six months, year to date, or the next five years. Milestones are embedded
                  directly on each bar so you never lose sight of key checkpoints.
                </p>
              </div>
            </div>
            <Timeline />
          </section>

          <section id="goal-library" className="workspace__panel workspace__panel--library">
            <div className="workspace__panel-head">
              <p className="workspace__eyebrow">Goal library</p>
              <h2>Work the list</h2>
              <p className="workspace__lead">
                Add goals in seconds, regroup by status or priority, and edit context inline without modal hopping.
              </p>
            </div>
            <GoalsList />
          </section>
        </div>
      </div>
    </div>
  );
}
