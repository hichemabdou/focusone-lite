"use client";

import { useMemo } from "react";
import { Goal, useGoals } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";

const RINGS = 5;

type Props = {
  variant?: "full" | "compact";
};

export default function CategoryRadar({ variant = "full" }: Props) {
  const { goals } = useGoals();
  const { categories, getCategoryColor } = useCustomization();
  const categoryOrder = categories.map(c => c.name);
  const { values, max, total } = useMemo(() => aggregate(goals, categoryOrder), [goals, categoryOrder]);

  // Increased size for better readability
  const size = variant === "compact" ? 280 : 380;
  const center = size / 2;
  // Adjusted radius to give more room for labels
  const radius = size / 2 - (variant === "compact" ? 40 : 60);

  const polygon = values
    .map((value, index) => {
      const angle = ((Math.PI * 2) / categoryOrder.length) * index - Math.PI / 2;
      const ratio = max ? value / max : 0;
      const x = center + Math.cos(angle) * radius * ratio;
      const y = center + Math.sin(angle) * radius * ratio;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={["radar", variant === "compact" ? "radar--compact" : ""].join(" ")}>
      <div className="radar__header mb-4">
        <div>
          <p className="workspace__eyebrow">Focus spread</p>
          <h3 className="text-lg font-semibold text-slate-100">{variant === "compact" ? "Your mix" : "Where your goals cluster"}</h3>
        </div>
        <div className="radar__meta text-right">
          <span className="block text-2xl font-bold text-white">{total}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Active Goals</span>
        </div>
      </div>

      <div className="radar__canvas flex justify-center items-center py-2 relative">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />

        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative z-10">
          {/* Background Rings */}
          {[...Array(RINGS)].map((_, ringIndex) => {
            const ratio = (ringIndex + 1) / RINGS;
            const points = categoryOrder.map((_, index) => {
              const angle = ((Math.PI * 2) / categoryOrder.length) * index - Math.PI / 2;
              const x = center + Math.cos(angle) * radius * ratio;
              const y = center + Math.sin(angle) * radius * ratio;
              return `${x},${y}`;
            }).join(" ");
            return (
              <polygon
                key={ringIndex}
                points={points}
                className="fill-transparent stroke-slate-800/50"
                strokeWidth="1"
              />
            );
          })}

          {/* Axis Lines */}
          {categoryOrder.map((_, index) => {
            const angle = ((Math.PI * 2) / categoryOrder.length) * index - Math.PI / 2;
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;
            return (
              <line
                key={`axis-${index}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                className="stroke-slate-800/50"
                strokeWidth="1"
              />
            );
          })}

          {/* Labels */}
          {categoryOrder.map((label, index) => {
            const angle = ((Math.PI * 2) / categoryOrder.length) * index - Math.PI / 2;
            // Push labels further out
            const labelRadius = radius + 25;
            const x = center + Math.cos(angle) * labelRadius;
            const y = center + Math.sin(angle) * labelRadius;

            const textAnchor = Math.abs(x - center) < 5 ? "middle" : (x < center ? "end" : "start");
            const baseline = Math.abs(y - center) < 5 ? "middle" : (y < center ? "auto" : "hanging"); // 'auto' usually aligns to baseline, for top labels we might want 'alphabetic' or just rely on y adjustment

            // Fine-tune y position based on vertical alignment
            let dy = 0;
            if (y > center) dy = 8; // Push down bottom labels
            if (y < center) dy = -4; // Push up top labels

            return (
              <text
                key={label}
                x={x}
                y={y}
                dy={dy}
                className="fill-slate-400 text-[11px] font-medium tracking-wide uppercase"
                textAnchor={textAnchor}
                dominantBaseline={baseline === 'middle' ? 'middle' : 'auto'}
              >
                {label}
              </text>
            );
          })}

          {/* Data Shape */}
          <polygon
            points={polygon}
            className="fill-blue-500/20 stroke-blue-500"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {values.map((value, index) => {
            const angle = ((Math.PI * 2) / categoryOrder.length) * index - Math.PI / 2;
            const ratio = max ? value / max : 0;
            const x = center + Math.cos(angle) * radius * ratio;
            const y = center + Math.sin(angle) * radius * ratio;
            return (
              <circle
                key={`point-${index}`}
                cx={x}
                cy={y}
                r="3"
                className="fill-blue-400 stroke-slate-900"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
      </div>

      {/* Legend / Stats */}
      <div className={["radar__legend grid grid-cols-2 gap-2 mt-4", variant === "compact" ? "text-xs" : "text-sm"].join(" ")}>
        {categoryOrder.map((category, index) => (
          <div key={category} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: getCategoryColor(category), backgroundColor: getCategoryColor(category) }} />
              <span className="text-slate-300 font-medium">{category}</span>
            </div>
            <strong className="text-white font-semibold">{values[index]}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function aggregate(goals: Goal[], categoryOrder: string[]) {
  const counts = categoryOrder.map(
    (category) => goals.filter((goal) => goal.category === category).length
  );
  const max = counts.reduce((acc, value) => Math.max(acc, value), 0);
  const total = goals.length;
  return { values: counts, max, total };
}
