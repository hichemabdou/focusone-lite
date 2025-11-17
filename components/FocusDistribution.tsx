"use client";

import { useMemo } from "react";
import { useGoals } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";

export default function FocusDistribution() {
  const { goals } = useGoals();
  const { categories } = useCustomization();

  const distribution = useMemo(() => {
    const total = goals.length;
    return categories.map(cat => {
      const count = goals.filter(g => g.category === cat.name).length;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      return {
        ...cat,
        count,
        percentage
      };
    }).filter(c => c.count > 0);
  }, [goals, categories]);

  const total = goals.length;

  return (
    <div className="focus-distribution">
      <div className="focus-distribution__header">
        <h3 className="focus-distribution__title">Focus Distribution</h3>
        <span className="badge">{total} goals</span>
      </div>

      <div className="focus-distribution__chart">
        <svg viewBox="0 0 200 200" className="focus-distribution__donut">
          {distribution.map((cat, index) => {
            const startAngle = distribution
              .slice(0, index)
              .reduce((sum, c) => sum + (c.percentage * 3.6), 0);
            const endAngle = startAngle + (cat.percentage * 3.6);
            
            const startRad = (startAngle - 90) * (Math.PI / 180);
            const endRad = (endAngle - 90) * (Math.PI / 180);
            
            const x1 = 100 + 70 * Math.cos(startRad);
            const y1 = 100 + 70 * Math.sin(startRad);
            const x2 = 100 + 70 * Math.cos(endRad);
            const y2 = 100 + 70 * Math.sin(endRad);
            
            const largeArc = cat.percentage > 50 ? 1 : 0;
            
            return (
              <path
                key={cat.id}
                d={`M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={cat.color}
                opacity="0.8"
                stroke="rgba(15,23,42,0.95)"
                strokeWidth="2"
              />
            );
          })}
          <circle cx="100" cy="100" r="45" fill="rgba(15,23,42,0.95)" />
        </svg>
      </div>

      <div className="focus-distribution__legend">
        {distribution.map(cat => (
          <div key={cat.id} className="focus-distribution__legend-item">
            <span
              className="focus-distribution__legend-dot"
              style={{ backgroundColor: cat.color }}
            />
            <span className="focus-distribution__legend-name">{cat.name}</span>
            <span className="focus-distribution__legend-value">
              {cat.count} ({Math.round(cat.percentage)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
