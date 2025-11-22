"use client";

import { useState } from "react";
import SkillsMatrix from "@/components/SkillsMatrix";
import LanguageProgress from "@/components/LanguageProgress";
import CompetencyAssessment from "@/components/CompetencyAssessment";
import BusinessAcumen from "@/components/BusinessAcumen";

export default function PersonalDevPage() {
    const [activeTab, setActiveTab] = useState<"skills" | "languages" | "competencies" | "business">("skills");

    return (
        <main className="workspace">
            <header className="control-bar">
                <div className="control-bar__left">
                    <h1 className="control-bar__title">Personal Development</h1>
                    <p className="control-bar__subtitle">Track your skills, languages, and professional growth</p>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="personal-dev-tabs">
                <button
                    className={`personal-dev-tab ${activeTab === "skills" ? "personal-dev-tab--active" : ""}`}
                    onClick={() => setActiveTab("skills")}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    <span>Skills Matrix</span>
                </button>
                <button
                    className={`personal-dev-tab ${activeTab === "languages" ? "personal-dev-tab--active" : ""}`}
                    onClick={() => setActiveTab("languages")}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span>Languages</span>
                </button>
                <button
                    className={`personal-dev-tab ${activeTab === "competencies" ? "personal-dev-tab--active" : ""}`}
                    onClick={() => setActiveTab("competencies")}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Competencies</span>
                </button>
                <button
                    className={`personal-dev-tab ${activeTab === "business" ? "personal-dev-tab--active" : ""}`}
                    onClick={() => setActiveTab("business")}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <span>Business</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="personal-dev-content">
                {activeTab === "skills" && <SkillsMatrix />}
                {activeTab === "languages" && <LanguageProgress />}
                {activeTab === "competencies" && <CompetencyAssessment />}
                {activeTab === "business" && <BusinessAcumen />}
            </div>
        </main>
    );
}
