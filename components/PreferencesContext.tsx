"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { useSession } from "next-auth/react";

type WorkHour = {
    id?: string;
    day_of_week: number;
    start_time: string | null;
    end_time: string | null;
    is_active: boolean;
};

type UserPreferences = {
    theme: "dark" | "light" | "auto";
    start_of_week: number;
    notifications_enabled: boolean;
    email_notifications: boolean;
    notification_preferences: any;
    quiet_hours_start: string | null;
    quiet_hours_end: string | null;
    google_calendar_sync: boolean;
    google_calendar_id: string | null;
    ai_suggestions_enabled: boolean;
    auto_prioritization: boolean;
    auto_scheduling: boolean;
};

type PreferencesContextType = {
    preferences: UserPreferences | null;
    workHours: WorkHour[];
    loading: boolean;
    updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
    updateWorkHours: (hours: WorkHour[]) => Promise<void>;
    updateSingleWorkHour: (hour: WorkHour) => Promise<void>;
    refreshPreferences: () => Promise<void>;
};

const defaultPreferences: UserPreferences = {
    theme: "dark",
    start_of_week: 1,
    notifications_enabled: true,
    email_notifications: true,
    notification_preferences: {},
    quiet_hours_start: null,
    quiet_hours_end: null,
    google_calendar_sync: false,
    google_calendar_id: null,
    ai_suggestions_enabled: true,
    auto_prioritization: false,
    auto_scheduling: false,
};

const defaultWorkHours: WorkHour[] = Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    start_time: i >= 1 && i <= 5 ? "09:00" : null,
    end_time: i >= 1 && i <= 5 ? "17:00" : null,
    is_active: i >= 1 && i <= 5,
}));

const PreferencesContext = createContext<PreferencesContextType | undefined>(
    undefined
);

export function PreferencesProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [workHours, setWorkHours] = useState<WorkHour[]>(defaultWorkHours);
    const [loading, setLoading] = useState(true);

    const isAuthenticated = status === "authenticated";

    // Load preferences
    useEffect(() => {
        const loadPreferences = async () => {
            setLoading(true);

            if (isAuthenticated) {
                // Load from API
                try {
                    const [prefsRes, hoursRes] = await Promise.all([
                        fetch("/api/preferences"),
                        fetch("/api/work-hours"),
                    ]);

                    if (prefsRes.ok) {
                        const prefsData = await prefsRes.json();
                        setPreferences(prefsData);
                    } else {
                        setPreferences(defaultPreferences);
                    }

                    if (hoursRes.ok) {
                        const hoursData = await hoursRes.json();
                        setWorkHours(hoursData);
                    } else {
                        setWorkHours(defaultWorkHours);
                    }
                } catch (error) {
                    console.error("Failed to load preferences:", error);
                    setPreferences(defaultPreferences);
                    setWorkHours(defaultWorkHours);
                }
            } else {
                // Load from localStorage
                const savedPrefs = localStorage.getItem("focusone_preferences");
                const savedHours = localStorage.getItem("focusone_work_hours");

                setPreferences(
                    savedPrefs ? JSON.parse(savedPrefs) : defaultPreferences
                );
                setWorkHours(
                    savedHours ? JSON.parse(savedHours) : defaultWorkHours
                );
            }

            setLoading(false);
        };

        loadPreferences();
    }, [isAuthenticated, session]);

    const updatePreferences = async (updates: Partial<UserPreferences>) => {
        const newPrefs = { ...preferences, ...updates } as UserPreferences;
        setPreferences(newPrefs);

        if (isAuthenticated) {
            try {
                await fetch("/api/preferences", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updates),
                });
            } catch (error) {
                console.error("Failed to save preferences:", error);
            }
        } else {
            localStorage.setItem("focusone_preferences", JSON.stringify(newPrefs));
        }
    };

    const updateWorkHours = async (hours: WorkHour[]) => {
        setWorkHours(hours);

        if (isAuthenticated) {
            try {
                await fetch("/api/work-hours", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(hours),
                });
            } catch (error) {
                console.error("Failed to save work hours:", error);
            }
        } else {
            localStorage.setItem("focusone_work_hours", JSON.stringify(hours));
        }
    };

    const updateSingleWorkHour = async (hour: WorkHour) => {
        const newHours = workHours.map((h) =>
            h.day_of_week === hour.day_of_week ? hour : h
        );
        setWorkHours(newHours);

        if (isAuthenticated) {
            try {
                await fetch("/api/work-hours", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(hour),
                });
            } catch (error) {
                console.error("Failed to save work hour:", error);
            }
        } else {
            localStorage.setItem("focusone_work_hours", JSON.stringify(newHours));
        }
    };

    const refreshPreferences = async () => {
        if (isAuthenticated) {
            try {
                const [prefsRes, hoursRes] = await Promise.all([
                    fetch("/api/preferences"),
                    fetch("/api/work-hours"),
                ]);

                if (prefsRes.ok) {
                    const prefsData = await prefsRes.json();
                    setPreferences(prefsData);
                }

                if (hoursRes.ok) {
                    const hoursData = await hoursRes.json();
                    setWorkHours(hoursData);
                }
            } catch (error) {
                console.error("Failed to refresh preferences:", error);
            }
        }
    };

    return (
        <PreferencesContext.Provider
            value={{
                preferences,
                workHours,
                loading,
                updatePreferences,
                updateWorkHours,
                updateSingleWorkHour,
                refreshPreferences,
            }}
        >
            {children}
        </PreferencesContext.Provider>
    );
}

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (!context) {
        throw new Error("usePreferences must be used within PreferencesProvider");
    }
    return context;
}
