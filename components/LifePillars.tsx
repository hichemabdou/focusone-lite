"use client";

import { useGoals } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";

export default function LifePillars() {
    const { goals } = useGoals();
    const { categories, getCategoryColor } = useCustomization();

    const pillars = categories.map(cat => {
        const catGoals = goals.filter(g => g.category === cat.id);
        const total = catGoals.length;
        const completed = catGoals.filter(g => g.status === 'done').length;
        const active = total - completed;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Find next deadline
        const nextDeadline = catGoals
            .filter(g => g.status !== 'done')
            .map(g => new Date(g.endDate))
            .sort((a, b) => a.getTime() - b.getTime())[0];

        return {
            ...cat,
            total,
            active,
            progress,
            nextDeadline,
            color: getCategoryColor(cat.id)
        };
    });

    return (
        <div className="life-pillars">
            <div className="life-pillars__header">
                <h3>Life Pillars</h3>
                <p>Balance across key areas</p>
            </div>
            <div className="life-pillars__grid">
                {pillars.map(pillar => (
                    <div key={pillar.id} className="pillar-card" style={{ borderColor: `${pillar.color}30` }}>
                        <div className="pillar-card__header">
                            <div className="pillar-card__icon" style={{ backgroundColor: `${pillar.color}20`, color: pillar.color }}>
                                {/* Placeholder icon logic - ideally categories have icons */}
                                {pillar.name.charAt(0)}
                            </div>
                            <div className="pillar-card__title-group">
                                <h4 className="pillar-card__title">{pillar.name}</h4>
                                <span className="pillar-card__count">{pillar.active} active</span>
                            </div>
                        </div>

                        <div className="pillar-card__progress-wrapper">
                            <div className="pillar-card__progress-bg">
                                <div
                                    className="pillar-card__progress-fill"
                                    style={{ width: `${pillar.progress}%`, backgroundColor: pillar.color }}
                                />
                            </div>
                        </div>

                        <div className="pillar-card__footer">
                            {pillar.nextDeadline ? (
                                <span className="pillar-card__deadline">
                                    Next: {pillar.nextDeadline.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            ) : (
                                <span className="pillar-card__deadline text-muted">No active goals</span>
                            )}
                            <span className="pillar-card__percent">{pillar.progress}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
