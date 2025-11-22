"use client";

import { useState } from "react";
import { usePreferences } from "./PreferencesContext";
import { Clock, Check, X } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function WorkHoursConfig() {
    const { workHours, updateWorkHours, loading } = usePreferences();
    const [localHours, setLocalHours] = useState(workHours);
    const [hasChanges, setHasChanges] = useState(false);

    const handleTimeChange = (dayIndex: number, field: "start_time" | "end_time" | "is_active", value: any) => {
        const newHours = localHours.map((h) =>
            h.day_of_week === dayIndex
                ? { ...h, [field]: value }
                : h
        );
        setLocalHours(newHours);
        setHasChanges(true);
    };

    const handleSave = async () => {
        await updateWorkHours(localHours);
        setHasChanges(false);
    };

    const handleReset = () => {
        setLocalHours(workHours);
        setHasChanges(false);
    };

    if (loading) {
        return <div className="text-muted">Loading work hours...</div>;
    }

    return (
        <div className="work-hours-config">
            <div className="work-hours-config__header">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-medium text-white">Work Hours</h3>
                </div>
                <p className="text-sm text-muted mt-1">
                    Define your productive hours for optimal scheduling
                </p>
            </div>

            <div className="work-hours-list">
                {DAYS.map((day, index) => {
                    const hour = localHours.find((h) => h.day_of_week === index) || {
                        day_of_week: index,
                        start_time: null,
                        end_time: null,
                        is_active: false,
                    };

                    return (
                        <div key={index} className={`work-hour-item ${!hour.is_active ? "work-hour-item--inactive" : ""}`}>
                            <div className="work-hour-item__day">
                                <label className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={hour.is_active}
                                        onChange={(e) => handleTimeChange(index, "is_active", e.target.checked)}
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="text-sm font-medium">{day}</span>
                                </label>
                            </div>

                            <div className="work-hour-item__times">
                                <input
                                    type="time"
                                    value={hour.start_time || "09:00"}
                                    onChange={(e) => handleTimeChange(index, "start_time", e.target.value)}
                                    disabled={!hour.is_active}
                                    className="time-input"
                                />
                                <span className="text-muted text-sm">to</span>
                                <input
                                    type="time"
                                    value={hour.end_time || "17:00"}
                                    onChange={(e) => handleTimeChange(index, "end_time", e.target.value)}
                                    disabled={!hour.is_active}
                                    className="time-input"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {hasChanges && (
                <div className="work-hours-actions">
                    <button onClick={handleReset} className="btn btn--ghost btn--sm">
                        <X className="w-4 h-4" />
                        Cancel
                    </button>
                    <button onClick={handleSave} className="btn btn--primary btn--sm">
                        <Check className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            )}
        </div>
    );
}
