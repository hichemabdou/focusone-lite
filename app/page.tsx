// /app/classic/page.tsx
import dynamic from "next/dynamic";

const Timeline = dynamic(() => import("@/components/Timeline"), { ssr: false });
// Reuse your existing GoalsList component (already in your repo)
const GoalsList = dynamic(() => import("@/components/GoalsList"), { ssr: false });

export default function ClassicPage() {
  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: timeline card */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <Timeline />
          </div>

          {/* Right: goals list card */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <GoalsList />
          </div>
        </div>
      </div>
    </main>
  );
}
