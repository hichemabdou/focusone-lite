"use client";

import { useState } from "react";
import { useCustomization } from "@/components/CustomizationContext";
import { usePreferences } from "@/components/PreferencesContext";
import { useGoals } from "@/components/GoalsContext";
import CategoryEditor from "@/components/CategoryEditor";
import WorkHoursConfig from "@/components/WorkHoursConfig";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function SettingsPage() {
    const { categories, priorities, statuses, updateCategories } = useCustomization();
    const { preferences, updatePreferences } = usePreferences();
    const { goals, exportJson, importJson } = useGoals();
    const [activeSection, setActiveSection] = useState<"categories" | "hours" | "preferences" | "data">("categories");

    // Category editing state
    const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; color: string } | null>(null);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string } | null>(null);

    const handleDeleteCategory = async (categoryId: string) => {
        // Check if category is used by any goals
        const goalsUsingCategory = goals.filter(g => g.category === categoryId);
        if (goalsUsingCategory.length > 0) {
            alert(`Cannot delete "${deletingCategory?.name}". It's used by ${goalsUsingCategory.length} goal(s).`);
            setDeletingCategory(null);
            return;
        }

        const newCategories = categories.filter(c => c.id !== categoryId);
        await updateCategories(newCategories);
        setDeletingCategory(null);
    };

    const handleExportData = () => {
        const data = exportJson();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `focusone-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportData = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const data = JSON.parse(event.target?.result as string);
                        importJson(data);
                        alert('Data imported successfully!');
                    } catch (error) {
                        alert('Failed to import data. Please check the file format.');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    return (
        <main className="workspace">
            <header className="control-bar">
                <div className="control-bar__left">
                    <h1 className="control-bar__title">Settings & Customization</h1>
                    <p className="control-bar__subtitle">Personalize your Life Ops Center</p>
                </div>
            </header>

            <div className="settings-container">
                {/* Settings Navigation */}
                <div className="settings-nav">
                    <button
                        className={`settings-nav-item ${activeSection === "categories" ? "settings-nav-item--active" : ""}`}
                        onClick={() => setActiveSection("categories")}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 7h-9M14 17H5M17 3v18M7 7v10" />
                        </svg>
                        <span>Categories & Colors</span>
                    </button>
                    <button
                        className={`settings-nav-item ${activeSection === "hours" ? "settings-nav-item--active" : ""}`}
                        onClick={() => setActiveSection("hours")}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>Work Hours</span>
                    </button>
                    <button
                        className={`settings-nav-item ${activeSection === "preferences" ? "settings-nav-item--active" : ""}`}
                        onClick={() => setActiveSection("preferences")}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
                        </svg>
                        <span>Preferences</span>
                    </button>
                    <button
                        className={`settings-nav-item ${activeSection === "data" ? "settings-nav-item--active" : ""}`}
                        onClick={() => setActiveSection("data")}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                        </svg>
                        <span>Import / Export</span>
                    </button>
                </div>

                {/* Settings Content */}
                <div className="settings-content">
                    {activeSection === "categories" && (
                        <div className="settings-section">
                            <div className="settings-section-header">
                                <h2>Categories</h2>
                                <button className="btn btn--primary" onClick={() => setIsCreatingCategory(true)}>Add Category</button>
                            </div>
                            <div className="category-list">
                                {categories.map((category) => (
                                    <div key={category.id} className="category-item">
                                        <div
                                            className="category-color"
                                            style={{ backgroundColor: category.color }}
                                        ></div>
                                        <div className="category-info">
                                            <div className="category-name">{category.name}</div>
                                            <div className="category-meta">
                                                {goals.filter(g => g.category === category.id).length} goals
                                            </div>
                                        </div>
                                        <div className="category-actions">
                                            <button
                                                className="btn btn--sm btn--ghost"
                                                onClick={() => setEditingCategory(category)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn--sm btn--ghost"
                                                onClick={() => setDeletingCategory({ id: category.id, name: category.name })}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="settings-section-header" style={{ marginTop: "40px" }}>
                                <h2>Priorities</h2>
                            </div>
                            <div className="priority-list">
                                {priorities.map((priority) => (
                                    <div key={priority.id} className="priority-item">
                                        <div
                                            className="priority-indicator"
                                            style={{ backgroundColor: priority.color }}
                                        ></div>
                                        <div className="priority-info">
                                            <div className="priority-name">{priority.name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="settings-section-header" style={{ marginTop: "40px" }}>
                                <h2>Statuses</h2>
                            </div>
                            <div className="status-list">
                                {statuses.map((status) => (
                                    <div key={status.id} className="status-item">
                                        <div
                                            className="status-indicator"
                                            style={{ backgroundColor: status.color }}
                                        ></div>
                                        <div className="status-info">
                                            <div className="status-name">{status.name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === "hours" && (
                        <div className="settings-section">
                            <WorkHoursConfig />
                        </div>
                    )}

                    {activeSection === "preferences" && preferences && (
                        <div className="settings-section">
                            <div className="settings-section-header">
                                <h2>General Preferences</h2>
                            </div>
                            <div className="preferences-list">
                                <div className="preference-item">
                                    <div className="preference-info">
                                        <div className="preference-label">Start of Week</div>
                                        <div className="preference-description">First day of your week</div>
                                    </div>
                                    <select
                                        className="preference-select"
                                        value={preferences.start_of_week}
                                        onChange={(e) => updatePreferences({ start_of_week: parseInt(e.target.value) })}
                                    >
                                        <option value="1">Monday</option>
                                        <option value="0">Sunday</option>
                                    </select>
                                </div>

                                <div className="preference-item">
                                    <div className="preference-info">
                                        <div className="preference-label">Notifications</div>
                                        <div className="preference-description">Email reminders for goals</div>
                                    </div>
                                    <label className="preference-toggle">
                                        <input
                                            type="checkbox"
                                            checked={preferences.notifications_enabled}
                                            onChange={(e) => updatePreferences({ notifications_enabled: e.target.checked })}
                                        />
                                        <span className="preference-toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="preference-item">
                                    <div className="preference-info">
                                        <div className="preference-label">AI Suggestions</div>
                                        <div className="preference-description">Smart recommendations and insights</div>
                                    </div>
                                    <label className="preference-toggle">
                                        <input
                                            type="checkbox"
                                            checked={preferences.ai_suggestions_enabled}
                                            onChange={(e) => updatePreferences({ ai_suggestions_enabled: e.target.checked })}
                                        />
                                        <span className="preference-toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="preference-item">
                                    <div className="preference-info">
                                        <div className="preference-label">Auto Prioritization</div>
                                        <div className="preference-description">Automatically adjust goal priorities</div>
                                    </div>
                                    <label className="preference-toggle">
                                        <input
                                            type="checkbox"
                                            checked={preferences.auto_prioritization}
                                            onChange={(e) => updatePreferences({ auto_prioritization: e.target.checked })}
                                        />
                                        <span className="preference-toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="preference-item">
                                    <div className="preference-info">
                                        <div className="preference-label">Google Calendar Sync</div>
                                        <div className="preference-description">Sync goals with Google Calendar</div>
                                    </div>
                                    <label className="preference-toggle">
                                        <input
                                            type="checkbox"
                                            checked={preferences.google_calendar_sync}
                                            onChange={(e) => updatePreferences({ google_calendar_sync: e.target.checked })}
                                        />
                                        <span className="preference-toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "data" && (
                        <div className="settings-section">
                            <div className="settings-section-header">
                                <h2>Data Management</h2>
                            </div>
                            <div className="data-actions">
                                <div className="data-action-card">
                                    <div className="data-action-icon">📥</div>
                                    <div className="data-action-content">
                                        <h3>Import Data</h3>
                                        <p>Import your data from a JSON file</p>
                                        <button className="btn btn--primary" onClick={handleImportData}>Choose File</button>
                                    </div>
                                </div>

                                <div className="data-action-card">
                                    <div className="data-action-icon">📤</div>
                                    <div className="data-action-content">
                                        <h3>Export Data</h3>
                                        <p>Download all your data as JSON</p>
                                        <button className="btn btn--ghost" onClick={handleExportData}>Export Now</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <CategoryEditor
                open={isCreatingCategory}
                onClose={() => setIsCreatingCategory(false)}
                onSave={() => setIsCreatingCategory(false)}
            />

            <CategoryEditor
                open={!!editingCategory}
                category={editingCategory}
                onClose={() => setEditingCategory(null)}
                onSave={() => setEditingCategory(null)}
            />

            <ConfirmDialog
                open={!!deletingCategory}
                title="Delete Category"
                message={`Are you sure you want to delete "${deletingCategory?.name}"? This action cannot be undone.`}
                onConfirm={() => deletingCategory && handleDeleteCategory(deletingCategory.id)}
                onClose={() => setDeletingCategory(null)}
            />
        </main>
    );
}


