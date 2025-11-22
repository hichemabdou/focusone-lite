"use client";

import { useState } from "react";

type Language = {
    id: string;
    name: string;
    level: string; // CEFR: A1, A2, B1, B2, C1, C2
    proficiency: number; // 0-100
    hoursStudied: number;
    lastPracticed: string;
};

export default function LanguageProgress() {
    const [languages] = useState<Language[]>([
        { id: "1", name: "Spanish", level: "B2", proficiency: 75, hoursStudied: 450, lastPracticed: "2024-11-22" },
        { id: "2", name: "French", level: "B1", proficiency: 60, hoursStudied: 280, lastPracticed: "2024-11-20" },
        { id: "3", name: "Japanese", level: "A2", proficiency: 35, hoursStudied: 120, lastPracticed: "2024-11-18" },
    ]);

    const cefrLevels = {
        A1: { name: "Beginner", color: "#64748b" },
        A2: { name: "Elementary", color: "#f59e0b" },
        B1: { name: "Intermediate", color: "#3b82f6" },
        B2: { name: "Upper Intermediate", color: "#8b5cf6" },
        C1: { name: "Advanced", color: "#10b981" },
        C2: { name: "Mastery", color: "#059669" },
    };

    const totalHours = languages.reduce((sum, lang) => sum + lang.hoursStudied, 0);

    return (
        <div className="language-progress">
            {/* Language Stats */}
            <div className="language-stats">
                <div className="language-stat-card language-stat-card--primary">
                    <div className="language-stat-icon">🌍</div>
                    <div className="language-stat-content">
                        <div className="language-stat-label">Languages Learning</div>
                        <div className="language-stat-value">{languages.length}</div>
                    </div>
                </div>
                <div className="language-stat-card">
                    <div className="language-stat-icon">⏱️</div>
                    <div className="language-stat-content">
                        <div className="language-stat-label">Total Study Hours</div>
                        <div className="language-stat-value">{totalHours}h</div>
                    </div>
                </div>
                <div className="language-stat-card">
                    <div className="language-stat-icon">📊</div>
                    <div className="language-stat-content">
                        <div className="language-stat-label">Average Progress</div>
                        <div className="language-stat-value">
                            {Math.round(languages.reduce((sum, l) => sum + l.proficiency, 0) / languages.length)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Language Cards */}
            <div className="language-cards">
                {languages.map((language) => (
                    <div key={language.id} className="language-card">
                        <div className="language-card__header">
                            <div className="language-card__title">
                                <h3>{language.name}</h3>
                                <span
                                    className="language-card__level"
                                    style={{ backgroundColor: cefrLevels[language.level as keyof typeof cefrLevels].color }}
                                >
                                    {language.level} - {cefrLevels[language.level as keyof typeof cefrLevels].name}
                                </span>
                            </div>
                            <button className="language-card__action">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                Practice
                            </button>
                        </div>

                        <div className="language-card__proficiency">
                            <div className="language-card__proficiency-header">
                                <span>Overall Proficiency</span>
                                <span className="language-card__proficiency-value">{language.proficiency}%</span>
                            </div>
                            <div className="language-card__proficiency-bar">
                                <div
                                    className="language-card__proficiency-fill"
                                    style={{
                                        width: `${language.proficiency}%`,
                                        backgroundColor: cefrLevels[language.level as keyof typeof cefrLevels].color,
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="language-card__skills">
                            <div className="language-skill">
                                <span className="language-skill__name">Speaking</span>
                                <div className="language-skill__bar">
                                    <div className="language-skill__fill" style={{ width: "70%" }}></div>
                                </div>
                            </div>
                            <div className="language-skill">
                                <span className="language-skill__name">Listening</span>
                                <div className="language-skill__bar">
                                    <div className="language-skill__fill" style={{ width: "80%" }}></div>
                                </div>
                            </div>
                            <div className="language-skill">
                                <span className="language-skill__name">Reading</span>
                                <div className="language-skill__bar">
                                    <div className="language-skill__fill" style={{ width: "75%" }}></div>
                                </div>
                            </div>
                            <div className="language-skill">
                                <span className="language-skill__name">Writing</span>
                                <div className="language-skill__bar">
                                    <div className="language-skill__fill" style={{ width: "65%" }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="language-card__footer">
                            <span className="language-card__hours">📚 {language.hoursStudied} hours studied</span>
                            <span className="language-card__last-practiced">
                                Last practiced:{" "}
                                {new Date(language.lastPracticed).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Learning Resources */}
            <div className="learning-resources">
                <h3>Recommended Resources</h3>
                <div className="resource-list">
                    <div className="resource-item">
                        <div className="resource-icon">📱</div>
                        <div className="resource-content">
                            <div className="resource-title">Duolingo - Daily Practice</div>
                            <div className="resource-description">15 min/day recommended for Spanish</div>
                        </div>
                        <button className="btn btn--sm btn--ghost">Open</button>
                    </div>
                    <div className="resource-item">
                        <div className="resource-icon">🎧</div>
                        <div className="resource-content">
                            <div className="resource-title">Podcast - Coffee Break French</div>
                            <div className="resource-description">Improve listening comprehension</div>
                        </div>
                        <button className="btn btn--sm btn--ghost">Open</button>
                    </div>
                    <div className="resource-item">
                        <div className="resource-icon">💬</div>
                        <div className="resource-content">
                            <div className="resource-title">iTalki - Conversation Practice</div>
                            <div className="resource-description">Book a session with native speakers</div>
                        </div>
                        <button className="btn btn--sm btn--ghost">Open</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
