"use client";

import { useState } from "react";
import HealthMetrics from "@/components/HealthMetrics";
import HealthAppointments from "@/components/HealthAppointments";
import WellnessInsights from "@/components/WellnessInsights";

export default function HealthPage() {
    const [activeTab, setActiveTab] = useState<"metrics" | "appointments" | "insights">("metrics");

    return (
        <main className="workspace">
            <header className="control-bar">
                <div className="control-bar__left">
                    <h1 className="control-bar__title">Health & Wellness</h1>
                    <p className="control-bar__subtitle">Track your physical health, appointments, and wellness goals</p>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="health-tabs">
                <button
                    className={`health-tab ${activeTab === "metrics" ? "health-tab--active" : ""}`}
                    onClick={() => setActiveTab("metrics")}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                    <span>Health Metrics</span>
                </button>
                <button
                    className={`health-tab ${activeTab === "appointments" ? "health-tab--active" : ""}`}
                    onClick={() => setActiveTab("appointments")}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Appointments</span>
                </button>
                <button
                    className={`health-tab ${activeTab === "insights" ? "health-tab--active" : ""}`}
                    onClick={() => setActiveTab("insights")}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                    <span>Wellness Insights</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="health-content">
                {activeTab === "metrics" && <HealthMetrics />}
                {activeTab === "appointments" && <HealthAppointments />}
                {activeTab === "insights" && <WellnessInsights />}
            </div>
        </main>
    );
}
