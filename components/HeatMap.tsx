"use client";

import { useMemo } from "react";
import { useGoals } from "./GoalsContext";

export default function HeatMap() {
  const { goals } = useGoals();

  const heatData = useMemo(() => {
    const weeks = 52;
    const daysPerWeek = 7;
    const data = [];
    const now = new Date();

    for (let week = weeks - 1; week >= 0; week--) {
      const weekData = [];
      for (let day = 0; day < daysPerWeek; day++) {
        const date = new Date(now);
        date.setDate(now.getDate() - (week * 7 + day));
        
        const activeCount = goals.filter(goal => {
          const start = new Date(goal.startDate);
          const end = new Date(goal.endDate);
          return date >= start && date <= end && goal.status !== 'done';
        }).length;

        weekData.push({
          date: date.toISOString().split('T')[0],
          count: activeCount,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
      data.push(weekData);
    }

    return data;
  }, [goals]);

  const maxCount = Math.max(...heatData.flat().map(d => d.count), 1);

  const getIntensity = (count: number) => {
    if (count === 0) return 0;
    return Math.min((count / maxCount) * 0.8 + 0.2, 1);
  };

  return (
    <div className="heat-map">
      <div className="heat-map__header">
        <h3 className="heat-map__title">Activity Heat Map</h3>
        <p className="heat-map__subtitle">Last 52 weeks</p>
      </div>

      <div className="heat-map__grid">
        {heatData.map((week, weekIndex) => (
          <div key={weekIndex} className="heat-map__week">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="heat-map__day"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${getIntensity(day.count)})`
                }}
                title={`${day.label}: ${day.count} active goals`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="heat-map__legend">
        <span className="heat-map__legend-label">Less</span>
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, i) => (
          <div
            key={i}
            className="heat-map__legend-box"
            style={{ backgroundColor: `rgba(59, 130, 246, ${intensity})` }}
          />
        ))}
        <span className="heat-map__legend-label">More</span>
      </div>
    </div>
  );
}
