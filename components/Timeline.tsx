"use client";

import { useMemo } from "react";

interface Goal {
  id: string;
  title: string;
  start: string;
  due: string;
  priority?: string;
}

const monthKeyFromDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export default function Timeline({ goals = [] }: { goals?: Goal[] }) {
  // ✅ Determine full range (safe if goals is undefined or empty)
  const domain = useMemo(() => {
    if (!goals || goals.length === 0) {
      const now = new Date();
      const from = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const to = new Date(now.getFullYear(), 11, 1).toISOString().slice(0, 10);
      return {
        from,
        to,
        months: [],
      };
    }

    const starts = goals.map((g) => new Date(g.start));
    const ends = goals.map((g) => new Date(g.due));
    const minDate = new Date(Math.min(...starts.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...ends.map((d) => d.getTime())));

    const months: { key: string; label: string }[] = [];
    const iter = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (iter <= maxDate) {
      months.push({
        key: monthKeyFromDate(iter),
        label: iter.toLocaleString("default", { month: "short" }),
      });
      iter.setMonth(iter.getMonth() + 1);
    }

    return {
      from: minDate.toISOString().slice(0, 10),
      to: maxDate.toISOString().slice(0, 10),
      months,
    };
  }, [goals]);

  const monthWidth = 120;

  // ✅ Today marker
  const todayIndex = useMemo(() => {
    const k = monthKeyFromDate(new Date());
    return domain.months.findIndex((m) => m.key === k);
  }, [domain.months]);

  return (
    <div className="relative overflow-x-auto rounded-lg bg-neutral-800 p-2 text-neutral-200">
      {/* Header months */}
      <div
        className="grid border-b border-neutral-700"
        style={{
          gridTemplateColumns: `repeat(${domain.months.length}, ${monthWidth}px)`,
        }}
      >
        {domain.months.map((m) => (
          <div key={m.key} className="text-center py-1 text-sm font-medium">
            {m.label}
          </div>
        ))}
      </div>

      {/* TODAY marker */}
      {todayIndex >= 0 && (
        <div
          className="pointer-events-none absolute inset-y-0 z-20"
          style={{ left: todayIndex * monthWidth + monthWidth / 2 }}
        >
          <div className="absolute top-1 -translate-x-1/2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-neutral-900 shadow">
            Today
          </div>
          <div className="absolute top-6 bottom-2 -translate-x-1/2 w-px bg-white/60" />
        </div>
      )}

      {/* Goals */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${domain.months.length}, ${monthWidth}px)`,
        }}
      >
        {goals &&
          goals.map((goal) => (
            <div key={goal.id} className="relative flex items-center">
              <div className="m-1 w-full rounded-md bg-blue-500/40 p-1 text-xs text-center">
                {goal.title}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
