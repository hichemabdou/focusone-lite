"use client";

import GoalsList from "@/components/GoalsList";
import GoalFilters from "@/components/GoalFilters";
import Summary from "@/components/Summary";
import Timeline from "@/components/Timeline";
import { useGoals } from "@/components/GoalsContext";

export default function ClassicClient() {
  const { goals, visibleGoals } = useGoals();
  const activeGoals = visibleGoals ?? goals ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-16 pt-12">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-10 shadow-[0_50px_120px_-60px_rgba(15,15,20,0.9)]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_55%)]" />
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
              Focus.One
            </span>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">
              Chart an elegant roadmap for the goals that matter most.
            </h1>
            <p className="text-sm text-white/70 md:text-base">
              Capture life-level intentions, pick a start and end in seconds, then scan the timeline to stay oriented. Every interaction is deliberately simple, giving you premium clarity without the clutter.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-black/40 p-6 text-right">
            <p className="text-sm text-white/50">Goals in focus</p>
            <p className="text-4xl font-semibold text-white">{activeGoals.length}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-10">
          <GoalFilters />

          <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_70px_-50px_rgba(15,15,25,0.85)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-white">Timeline overview</h2>
                <p className="text-sm text-white/60">
                  Scan how every intention lines up in time. Adjust the view to focus the horizon you care about most.
                </p>
              </div>
              <Summary goals={activeGoals} className="md:max-w-sm" />
            </div>

            <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-3">
              <Timeline />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_70px_-50px_rgba(15,15,25,0.85)]">
            <GoalsList />
          </section>
        </aside>
      </div>
    </div>
  );
}
