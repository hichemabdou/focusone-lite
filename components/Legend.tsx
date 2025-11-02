"use client";

export default function Legend() {
  const Dot = ({ className }: { className: string }) => (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${className}`} />
  );

  return (
    <div className="mb-2 flex flex-wrap items-center gap-4 text-xs opacity-80">
      <span className="flex items-center gap-1"><Dot className="bg-emerald-400" /> low</span>
      <span className="flex items-center gap-1"><Dot className="bg-amber-400" /> medium</span>
      <span className="flex items-center gap-1"><Dot className="bg-orange-400" /> high</span>
      <span className="flex items-center gap-1"><Dot className="bg-rose-500" /> critical</span>
      <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full ring-2 ring-rose-400" /> overdue</span>
      <span className="flex items-center gap-2"><span className="inline-block h-[10px] w-[10px] rounded-sm bg-white/80" /> today</span>
    </div>
  );
}
