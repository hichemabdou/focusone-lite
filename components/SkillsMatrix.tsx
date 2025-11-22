"use client";

import { useState } from "react";

type Skill = {
    id: string;
    name: string;
    category: string;
    level: number; // 1-5
    experience: string;
    lastUsed: string;
};

export default function SkillsMatrix() {
    const [skills] = useState<Skill[]>([
        { id: "1", name: "React", category: "Frontend", level: 5, experience: "4 years", lastUsed: "2024-11-22" },
        { id: "2", name: "TypeScript", category: "Languages", level: 5, experience: "3 years", lastUsed: "2024-11-22" },
        { id: "3", name: "Node.js", category: "Backend", level: 4, experience: "3 years", lastUsed: "2024-11-20" },
        { id: "4", name: "Python", category: "Languages", level: 4, experience: "5 years", lastUsed: "2024-11-18" },
        { id: "5", name: "AWS", category: "Cloud", level: 3, experience: "2 years", lastUsed: "2024-11-15" },
        { id: "6", name: "Docker", category: "DevOps", level: 4, experience: "2 years", lastUsed: "2024-11-22" },
        { id: "7", name: "PostgreSQL", category: "Database", level: 4, experience: "4 years", lastUsed: "2024-11-20" },
        { id: "8", name: "GraphQL", category: "Backend", level: 3, experience: "1 year", lastUsed: "2024-11-10" },
    ]);

    const categories = Array.from(new Set(skills.map((s) => s.category)));

    const getLevelLabel = (level: number) => {
        const labels = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert"];
        return labels[level - 1] || "Unknown";
    };

    const getLevelColor = (level: number) => {
        if (level >= 5) return "#10b981";
        if (level >= 4) return "#3b82f6";
        if (level >= 3) return "#f59e0b";
        return "#64748b";
    };

    const skillsByCategory = categories.map((category) => ({
        category,
        skills: skills.filter((s) => s.category === category),
        avgLevel: skills.filter((s) => s.category === category).reduce((sum, s) => sum + s.level, 0) / skills.filter((s) => s.category === category).length,
    }));

    return (
        <div className="skills-matrix">
            {/* Skills Overview */}
            <div className="skills-overview">
                <div className="skills-stat-card">
                    <div className="skills-stat-value">{skills.length}</div>
                    <div className="skills-stat-label">Total Skills</div>
                </div>
                <div className="skills-stat-card">
                    <div className="skills-stat-value">{skills.filter((s) => s.level >= 4).length}</div>
                    <div className="skills-stat-label">Advanced+</div>
                </div>
                <div className="skills-stat-card">
                    <div className="skills-stat-value">{categories.length}</div>
                    <div className="skills-stat-label">Categories</div>
                </div>
            </div>

            {/* Skills by Category */}
            <div className="skills-categories">
                {skillsByCategory.map(({ category, skills: categorySkills, avgLevel }) => (
                    <div key={category} className="skill-category-section">
                        <div className="skill-category-header">
                            <h3>{category}</h3>
                            <div className="skill-category-meta">
                                <span className="skill-count">{categorySkills.length} skills</span>
                                <span className="skill-avg-level">Avg: {avgLevel.toFixed(1)}/5</span>
                            </div>
                        </div>
                        <div className="skill-cards-grid">
                            {categorySkills.map((skill) => (
                                <div key={skill.id} className="skill-card">
                                    <div className="skill-card__header">
                                        <span className="skill-card__name">{skill.name}</span>
                                        <span
                                            className="skill-card__level"
                                            style={{ color: getLevelColor(skill.level) }}
                                        >
                                            {getLevelLabel(skill.level)}
                                        </span>
                                    </div>
                                    <div className="skill-card__progress">
                                        <div className="skill-card__progress-bar">
                                            <div
                                                className="skill-card__progress-fill"
                                                style={{
                                                    width: `${(skill.level / 5) * 100}%`,
                                                    backgroundColor: getLevelColor(skill.level),
                                                }}
                                            ></div>
                                        </div>
                                        <span className="skill-card__level-num">{skill.level}/5</span>
                                    </div>
                                    <div className="skill-card__meta">
                                        <span className="skill-card__experience">{skill.experience} experience</span>
                                        <span className="skill-card__last-used">
                                            Last used:{" "}
                                            {new Date(skill.lastUsed).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Skill Development Plan */}
            <div className="skill-development-plan">
                <div className="skill-development-header">
                    <h3>Skill Development Plan</h3>
                    <button className="btn btn--sm btn--ghost">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Learning Goal
                    </button>
                </div>
                <div className="development-items">
                    <div className="development-item">
                        <div className="development-icon">📚</div>
                        <div className="development-content">
                            <div className="development-title">Master Kubernetes</div>
                            <div className="development-target">Target: Advanced (L4) by Q1 2025</div>
                            <div className="development-progress">
                                <div className="development-progress-bar">
                                    <div className="development-progress-fill" style={{ width: "35%" }}></div>
                                </div>
                                <span>35% complete</span>
                            </div>
                        </div>
                    </div>
                    <div className="development-item">
                        <div className="development-icon">🎯</div>
                        <div className="development-content">
                            <div className="development-title">Learn Machine Learning</div>
                            <div className="development-target">Target: Intermediate (L3) by Q2 2025</div>
                            <div className="development-progress">
                                <div className="development-progress-bar">
                                    <div className="development-progress-fill" style={{ width: "20%" }}></div>
                                </div>
                                <span>20% complete</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
