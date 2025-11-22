"use client";

import { useState, useMemo, useEffect } from "react";
import { useGoals, Goal } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    parseISO,
    isWithinInterval
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";

type GoogleCalendarEvent = {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
};

type ViewMode = "month" | "week";

export default function CalendarView() {
    const { visibleGoals, updateGoal } = useGoals();
    const { getPriorityColor } = useCustomization();
    const { data: session } = useSession();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>("month");
    const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    // Fetch Google Calendar events
    useEffect(() => {
        const fetchEvents = async () => {
            if (session && (session as any).accessToken) {
                setLoadingEvents(true);
                const start = viewMode === "month"
                    ? startOfMonth(currentDate).toISOString()
                    : startOfWeek(currentDate).toISOString();
                const end = viewMode === "month"
                    ? endOfMonth(currentDate).toISOString()
                    : endOfWeek(currentDate).toISOString();

                try {
                    const res = await fetch(`/api/integrations/google/calendar?start=${start}&end=${end}`);
                    if (res.ok) {
                        const data = await res.json();
                        setGoogleEvents(data.events || []);
                    }
                } catch (e) {
                    console.error("Failed to fetch events", e);
                } finally {
                    setLoadingEvents(false);
                }
            }
        };

        fetchEvents();
    }, [currentDate, viewMode, session]);

    const days = useMemo(() => {
        const start = viewMode === "month" ? startOfWeek(startOfMonth(currentDate)) : startOfWeek(currentDate);
        const end = viewMode === "month" ? endOfWeek(endOfMonth(currentDate)) : endOfWeek(currentDate);
        return eachDayOfInterval({ start, end });
    }, [currentDate, viewMode]);

    const nextPeriod = () => {
        setCurrentDate(d => viewMode === "month" ? addMonths(d, 1) : addWeeks(d, 1));
    };

    const prevPeriod = () => {
        setCurrentDate(d => viewMode === "month" ? subMonths(d, 1) : subWeeks(d, 1));
    };

    const getGoalsForDay = (day: Date) => {
        return visibleGoals.filter(goal => {
            const start = parseISO(goal.startDate);
            const end = parseISO(goal.endDate);
            return isWithinInterval(day, { start, end });
        });
    };

    const getEventsForDay = (day: Date) => {
        return googleEvents.filter(event => {
            if (!event.start.dateTime && !event.start.date) return false;
            const eventStart = parseISO(event.start.dateTime || event.start.date!);
            return isSameDay(day, eventStart);
        });
    };

    return (
        <div className="flex flex-col h-full bg-transparent text-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0F0F11]/50 backdrop-blur-xl z-10">
                <div className="flex items-center gap-6">
                    <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        {format(currentDate, "MMMM yyyy")}
                    </h2>
                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => setViewMode("month")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "month" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setViewMode("week")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "week" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                        >
                            Week
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white/5 rounded-lg border border-white/5">
                        <button onClick={prevPeriod} className="p-2 hover:bg-white/10 rounded-l-lg transition-colors text-white/60 hover:text-white">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="w-px h-5 bg-white/10" />
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                            Today
                        </button>
                        <div className="w-px h-5 bg-white/10" />
                        <button onClick={nextPeriod} className="p-2 hover:bg-white/10 rounded-r-lg transition-colors text-white/60 hover:text-white">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] overflow-hidden bg-[#0F0F11]/30">
                {/* Day Headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="py-3 text-center text-xs font-medium text-white/30 uppercase tracking-wider border-b border-white/5 bg-[#0F0F11]/50">
                        {day}
                    </div>
                ))}

                {/* Days */}
                <div className="col-span-7 grid grid-cols-7 auto-rows-fr overflow-y-auto custom-scrollbar">
                    {days.map((day, idx) => {
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isToday = isSameDay(day, new Date());
                        const dayGoals = getGoalsForDay(day);
                        const dayEvents = getEventsForDay(day);

                        return (
                            <div
                                key={day.toISOString()}
                                className={`
                  min-h-[140px] p-3 border-b border-r border-white/5 flex flex-col gap-2 transition-colors
                  ${!isCurrentMonth ? "bg-white/[0.01] text-white/20" : "hover:bg-white/[0.02]"}
                  ${isToday ? "bg-blue-500/[0.03]" : ""}
                `}
                            >
                                <div className={`text-sm font-medium flex items-center justify-between ${isToday ? "text-blue-400" : "text-white/40"}`}>
                                    <span className={isToday ? "bg-blue-500/10 px-2 py-0.5 rounded-full" : ""}>{format(day, "d")}</span>
                                    {dayGoals.length + dayEvents.length > 0 && (
                                        <span className="text-[10px] text-white/20">{dayGoals.length + dayEvents.length} items</span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar max-h-[120px]">
                                    {/* Google Events */}
                                    {dayEvents.map(event => (
                                        <div key={event.id} className="group flex items-center gap-2 text-xs px-2 py-1.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-200/80 hover:bg-red-500/20 transition-colors cursor-default">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                            <span className="truncate font-medium">{event.summary}</span>
                                        </div>
                                    ))}

                                    {/* FocusOne Goals */}
                                    {dayGoals.map(goal => (
                                        <div
                                            key={goal.id}
                                            onClick={() => {
                                                // Trigger edit logic if needed
                                            }}
                                            className="group flex items-center gap-2 text-xs px-2 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-200/80 hover:bg-blue-500/20 transition-colors cursor-pointer"
                                            title={goal.title}
                                        >
                                            <div
                                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                                style={{ backgroundColor: getPriorityColor(goal.priority) }}
                                            />
                                            <span className="truncate font-medium">{goal.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
