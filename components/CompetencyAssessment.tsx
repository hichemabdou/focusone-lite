"use client";

import { useState } from "react";

type Competency = {
    id: string;
    name: string;
    category: string;
    level: number; // 1-10
    importance: "high" | "medium" | "low";
};

export default function CompetencyAssessment() {
    const [competencies] = useState<Competency[]>([
        { id: "1", name: "Leadership", category: "Management", level: 7, importance: "high" },
        { id: "2", name: "Communication", category: "Soft Skills", level: 8, importance: "high" },
        { id: "3", name: "Problem Solving", category: "Cognitive", level: 9, importance: "high" },
        { id: "4", name: "Time Management", category: "Productivity", level: 7, importance: "high" },
        { id: "5", name: "Strategic Thinking", category: "Management", level: 6, importance: "high" },
        { id: "6", name: "Teamwork", category: "Soft Skills", level: 8, importance: "medium" },
        { id: "7", name: "Adaptability", category: "Soft Skills", level: 9, importance: "high" },
        { id: "8", name: "Technical Expertise", category: "Technical", level: 8, importance: "high" },
    ]);

    const categories = Array.from(new Set(competencies.map((c) => c.category)));

    const overallScore = Math.round(
        competencies.reduce((sum, c) => sum + c.level, 0) / competencies.length
    );

    const employabilityScore = Math.round(
        (competencies.filter((c) => c.importance === "high").reduce((sum, c) => sum + c.level, 0) /
            competencies.filter((c) => c.importance === "high").length /
            10) *
        100
    );

    return (
        <div className="competency-assessment">
            {/* Assessment Overview */}
            <div className="competency-overview">
                <div className="competency-score-card">
                    <div className="competency-score-header">
                        <h3>Professional Competency Score</h3>
                        <p>Based on {competencies.length} assessed competencies</p>
                    </div>
                    <div className="competency-score-meter">
                        <div className="competency-score-value">
                            <span className="competency-score-number">{overallScore}</span>
                            <span className="competency-score-max">/10</span>
                        </div>
                        <div className="competency-score-bar">
                            <div
                                className="competency-score-fill"
                                style={{ width: `${(overallScore / 10) * 100}%` }}
                            ></div>
                        </div>
                        <div className="competency-score-label">Strong Professional</div>
                    </div>
                </div>

                <div className="employability-card">
                    <div className="employability-icon">💼</div>
                    <div className="employability-content">
                        <div className="employability-label">Employability Score</div>
                        <div className="employability-value">{employabilityScore}%</div>
                        <div className="employability-status">Highly Competitive</div>
                    </div>
                </div>
            </div>

            {/* Competency Radar */}
            <div className="competency-categories">
                <h3>Competencies by Category</h3>
                <div className="category-grid">
                    {categories.map((category) => {
                        const categoryCompetencies = competencies.filter((c) => c.category === category);
                        const avgScore =
                            categoryCompetencies.reduce((sum, c) => sum + c.level, 0) /
                            categoryCompetencies.length;

                        return (
                            <div key={category} className="competency-category-card">
                                <div className="competency-category-header">
                                    <h4>{category}</h4>
                                    <span className="competency-category-score">{avgScore.toFixed(1)}/10</span>
                                </div>
                                <div className="competency-items">
                                    {categoryCompetencies.map((competency) => (
                                        <div key={competency.id} className="competency-item">
                                            <div className="competency-item-header">
                                                <span className="competency-item-name">{competency.name}</span>
                                                {competency.importance === "high" && (
                                                    <span className="competency-badge">High Priority</span>
                                                )}
                                            </div>
                                            <div className="competency-item-bar">
                                                <div
                                                    className="competency-item-fill"
                                                    style={{ width: `${(competency.level / 10) * 100}%` }}
                                                ></div>
                                                <span className="competency-item-value">{competency.level}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Development Recommendations */}
            <div className="development-recommendations">
                <h3>Development Recommendations</h3>
                <div className="recommendation-list">
                    <div className="recommendation-card recommendation-card--priority">
                        <div className="recommendation-icon">🎯</div>
                        <div className="recommendation-content">
                            <div className="recommendation-title">Focus Area: Strategic Thinking</div>
                            <div className="recommendation-description">
                                Your Strategic Thinking score (6/10) is below your average. Consider leadership
                                training or mentorship.
                            </div>
                            <div className="recommendation-actions">
                                <button className="btn btn--sm btn--primary">Create Goal</button>
                                <button className="btn btn--sm btn--ghost">View Resources</button>
                            </div>
                        </div>
                    </div>

                    <div className="recommendation-card">
                        <div className="recommendation-icon">📚</div>
                        <div className="recommendation-content">
                            <div className="recommendation-title">Strengthen: Leadership Skills</div>
                            <div className="recommendation-description">
                                Boost from 7/10 to 9/10 to enhance your readiness for senior roles.
                            </div>
                            <div className="recommendation-actions">
                                <button className="btn btn--sm btn--ghost">Explore Courses</button>
                            </div>
                        </div>
                    </div>

                    <div className="recommendation-card recommendation-card--success">
                        <div className="recommendation-icon">⭐</div>
                        <div className="recommendation-content">
                            <div className="recommendation-title">Strength: Problem Solving & Adaptability</div>
                            <div className="recommendation-description">
                                Your scores in these areas (9/10) are exceptional. Consider mentoring others.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
