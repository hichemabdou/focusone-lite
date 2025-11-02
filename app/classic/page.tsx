import Timeline from "@/components/Timeline";
import GoalsList from "@/components/GoalsList";

export default function ClassicPage() {
  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <Timeline />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <GoalsList />
          </div>
        </div>
      </div>
    </main>
  );
}
