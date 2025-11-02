// app/classic/page.tsx (Server Component)
import Timeline from "@/components/Timeline";
import GoalsList from "@/components/GoalsList";

export default function ClassicPage() {
  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <Timeline />
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <GoalsList />
          </div>
        </div>
      </div>
    </main>
  );
}
