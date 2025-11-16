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
  const size = variant === "compact" ? 220 : 320;
  const center = size / 2;
  const radius = size / 2 - (variant === "compact" ? 18 : 28);

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
            const points = categoryOrder.map((_, index) => {
              const angle = ((Math.PI * 2) / categoryOrder.length) * index - Math.PI / 2;
              const x = center + Math.cos(angle) * radius * ratio;
              const y = center + Math.sin(angle) * radius * ratio;
              return `${x},${y}`;
            }).join(" ");
            return <polygon key={ringIndex} points={points} className="radar__ring" />;
          })}

          {categoryOrder.map((label, index) => {
            const angle = ((Math.PI * 2) / categoryOrder.length) * index - Math.PI / 2;
            const x = center + Math.cos(angle) * (radius + 10);
            const y = center + Math.sin(angle) * (radius + 10);
            const textAnchor = x < center - 10 ? "end" : x > center + 10 ? "start" : "middle";
            const baseline: "hanging" | "middle" | "alphabetic" =
              y > center + 10 ? "hanging" : y < center - 10 ? "alphabetic" : "middle";
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
        {categoryOrder.map((category, index) => (
          <div key={category} className="radar__legend-item">
            <span className="radar__legend-dot" style={{ background: getCategoryColor(category) }} />
            <span>{category.charAt(0) + category.slice(1).toLowerCase()}</span>
            <strong>{values[index]}</strong>
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
