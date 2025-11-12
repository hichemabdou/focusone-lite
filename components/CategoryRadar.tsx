"use client";

import { useMemo } from "react";
import { Goal, useGoals } from "./GoalsContext";

const CATEGORY_ORDER = ["STRATEGY", "VISION", "TACTICAL", "PROJECT", "DAILY"] as const;
const RINGS = 5;

type Props = {
  variant?: "full" | "compact";
};

export default function CategoryRadar({ variant = "full" }: Props) {
  const { goals } = useGoals();
  const { values, max, total } = useMemo(() => aggregate(goals), [goals]);
  const size = variant === "compact" ? 220 : 320;
  const center = size / 2;
  const radius = size / 2 - (variant === "compact" ? 18 : 28);

  const polygon = values
    .map((value, index) => {
      const angle = ((Math.PI * 2) / CATEGORY_ORDER.length) * index - Math.PI / 2;
      const ratio = max ? value / max : 0;
      const x = center + Math.cos(angle) * radius * ratio;
      const y = center + Math.sin(angle) * radius * ratio;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={["radar", variant === "compact" ? "radar--compact" : ""].join(" ")}>
      <div className="radar__header">
        <div>
          <p className="workspace__eyebrow">Focus spread</p>
          <h3>{variant === "compact" ? "Your mix" : "Where your goals cluster"}</h3>
        </div>
        <div className="radar__meta">
          <span>{total} goals</span>
          <span>{max ? `Peak lane: ${max} goals` : "No data"}</span>
        </div>
      </div>
      <div className="radar__canvas">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {[...Array(RINGS)].map((_, ringIndex) => {
            const ratio = (ringIndex + 1) / RINGS;
            const points = CATEGORY_ORDER.map((_, index) => {
              const angle = ((Math.PI * 2) / CATEGORY_ORDER.length) * index - Math.PI / 2;
              const x = center + Math.cos(angle) * radius * ratio;
              const y = center + Math.sin(angle) * radius * ratio;
              return `${x},${y}`;
            }).join(" ");
            return <polygon key={ringIndex} points={points} className="radar__ring" />;
          })}

          {CATEGORY_ORDER.map((label, index) => {
            const angle = ((Math.PI * 2) / CATEGORY_ORDER.length) * index - Math.PI / 2;
            const x = center + Math.cos(angle) * (radius + 10);
            const y = center + Math.sin(angle) * (radius + 10);
            const textAnchor = x < center - 10 ? "end" : x > center + 10 ? "start" : "middle";
            const baseline =
              y > center + 10 ? "hanging" : y < center - 10 ? "baseline" : "middle";
            return (
              <text
                key={label}
                x={x}
                y={y}
                className="radar__label"
                textAnchor={textAnchor}
                dominantBaseline={baseline}
              >
                {label.charAt(0) + label.slice(1).toLowerCase()}
              </text>
            );
          })}

          <polygon points={polygon} className="radar__shape" />
        </svg>
      </div>
      <div className={["radar__legend", variant === "compact" ? "radar__legend--compact" : ""].join(" ")}>
        {CATEGORY_ORDER.map((category) => (
          <div key={category} className="radar__legend-item">
            <span className="radar__legend-dot" style={{ background: COLORS[category] }} />
            <span>{category.charAt(0) + category.slice(1).toLowerCase()}</span>
            <strong>{values[CATEGORY_ORDER.indexOf(category)]}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function aggregate(goals: Goal[]) {
  const counts = CATEGORY_ORDER.map(
    (category) => goals.filter((goal) => goal.category === category).length
  );
  const max = counts.reduce((acc, value) => Math.max(acc, value), 0);
  const total = goals.length;
  return { values: counts, max, total };
}

const COLORS: Record<(typeof CATEGORY_ORDER)[number], string> = {
  STRATEGY: "#38bdf8",
  VISION: "#a855f7",
  TACTICAL: "#14b8a6",
  PROJECT: "#f97316",
  DAILY: "#facc15",
};
