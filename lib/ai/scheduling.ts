import { Goal } from "@/components/GoalsContext";
import { parseISO, isWithinInterval, addDays, differenceInDays } from "date-fns";

type WorkHour = {
    day_of_week: number;
    start_time: string | null;
    end_time: string | null;
    is_active: boolean;
};

type SchedulingSuggestion = {
    id: string;
    type: "scheduling";
    title: string;
    description: string;
    action_type: string;
    action_payload: any;
    priority: number;
};

/**
 * AI-powered scheduling suggestions
 * Analyzes goals, work hours, and calendar to suggest optimal scheduling
 */
export class SchedulingAI {
    /**
     * Generate scheduling suggestions based on current goals and work hours
     */
    static generateSuggestions(
        goals: Goal[],
        workHours: WorkHour[],
        categoryBalance?: Record<string, number>
    ): SchedulingSuggestion[] {
        const suggestions: SchedulingSuggestion[] = [];
        const today = new Date();

        // 1. Suggest rescheduling overdue goals
        const overdueGoals = goals.filter(
            (g) => g.status !== "completed" && g.status !== "cancelled" && parseISO(g.endDate) < today
        );

        if (overdueGoals.length > 0) {
            suggestions.push({
                id: `schedule-overdue-${Date.now()}`,
                type: "scheduling",
                title: `Reschedule ${overdueGoals.length} overdue goal${overdueGoals.length > 1 ? "s" : ""}`,
                description: "These goals have passed their deadline. Consider rescheduling or marking complete.",
                action_type: "reschedule_goals",
                action_payload: { goal_ids: overdueGoals.map((g) => g.id) },
                priority: 10,
            });
        }

        // 2. Suggest spreading out goals that are too concentrated
        const upcomingGoals = goals.filter((g) => {
            if (g.status === "completed" || g.status === "cancelled") return false;
            const end = parseISO(g.endDate);
            const daysUntilEnd = differenceInDays(end, today);
            return daysUntilEnd >= 0 && daysUntilEnd <= 7;
        });

        if (upcomingGoals.length >= 5) {
            suggestions.push({
                id: `spread-goals-${Date.now()}`,
                type: "scheduling",
                title: `${upcomingGoals.length} goals due in the next week`,
                description: "This is a heavy week. Consider spreading some goals across a longer timeframe.",
                action_type: "spread_goals",
                action_payload: { goal_ids: upcomingGoals.map((g) => g.id) },
                priority: 8,
            });
        }

        // 3. Suggest scheduling goals during work hours
        const unscheduledGoals = goals.filter((g) => {
            if (g.status === "completed" || g.status === "cancelled") return false;
            const start = parseISO(g.startDate);
            const end = parseISO(g.endDate);
            const duration = differenceInDays(end, start);
            return duration <= 1; // Single-day goals
        });

        if (unscheduledGoals.length > 0) {
            const workDays = workHours.filter((wh) => wh.is_active);
            if (workDays.length > 0) {
                suggestions.push({
                    id: `optimize-work-hours-${Date.now()}`,
                    type: "scheduling",
                    title: "Optimize goals for work hours",
                    description: `Align ${unscheduledGoals.length} short-term goals with your productive hours.`,
                    action_type: "align_work_hours",
                    action_payload: {
                        goal_ids: unscheduledGoals.map((g) => g.id),
                        work_days: workDays.map((w) => w.day_of_week)
                    },
                    priority: 6,
                });
            }
        }

        // 4. Suggest batch scheduling for similar category goals
        if (categoryBalance) {
            const categoryCounts: Record<string, Goal[]> = {};
            goals.forEach((g) => {
                if (g.status !== "completed" && g.status !== "cancelled") {
                    if (!categoryCounts[g.category]) categoryCounts[g.category] = [];
                    categoryCounts[g.category].push(g);
                }
            });

            for (const [category, categoryGoals] of Object.entries(categoryCounts)) {
                if (categoryGoals.length >= 3) {
                    suggestions.push({
                        id: `batch-${category}-${Date.now()}`,
                        type: "scheduling",
                        title: `Batch ${category} goals together`,
                        description: `You have ${categoryGoals.length} ${category} goals. Batching similar tasks can improve focus.`,
                        action_type: "batch_schedule",
                        action_payload: {
                            category,
                            goal_ids: categoryGoals.map((g) => g.id)
                        },
                        priority: 5,
                    });
                }
            }
        }

        // 5. Suggest utilizing weekend if work hours are only weekdays
        const hasWeekendWorkHours = workHours.some((wh) => (wh.day_of_week === 0 || wh.day_of_week === 6) && wh.is_active);
        const weekdayWorkHours = workHours.filter((wh) => wh.day_of_week >= 1 && wh.day_of_week <= 5 && wh.is_active);

        if (!hasWeekendWorkHours && weekdayWorkHours.length > 0) {
            const personalGoals = goals.filter((g) =>
                (g.category.toLowerCase().includes("personal") ||
                    g.category.toLowerCase().includes("health") ||
                    g.category.toLowerCase().includes("social")) &&
                g.status !== "completed" && g.status !== "cancelled"
            );

            if (personalGoals.length > 0) {
                suggestions.push({
                    id: `weekend-personal-${Date.now()}`,
                    type: "scheduling",
                    title: "Consider weekend time for personal goals",
                    description: `You have ${personalGoals.length} personal goals. Weekends might be ideal for these.`,
                    action_type: "suggest_weekend",
                    action_payload: { goal_ids: personalGoals.map((g) => g.id) },
                    priority: 4,
                });
            }
        }

        return suggestions.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Calculate optimal time slots for a new goal based on existing schedule
     */
    static suggestOptimalTimeSlot(
        goals: Goal[],
        workHours: WorkHour[],
        duration: number = 7 // days
    ): { startDate: string; endDate: string } {
        const today = new Date();
        let bestStart = addDays(today, 1);

        // Find the first available work day
        for (let i = 1; i <= 14; i++) {
            const date = addDays(today, i);
            const dayOfWeek = date.getDay();
            const workHour = workHours.find((wh) => wh.day_of_week === dayOfWeek);

            if (workHour && workHour.is_active) {
                bestStart = date;
                break;
            }
        }

        const bestEnd = addDays(bestStart, duration);

        return {
            startDate: bestStart.toISOString().split("T")[0],
            endDate: bestEnd.toISOString().split("T")[0],
        };
    }

    /**
     * Check if a goal conflicts with work hours
     */
    static checkWorkHourConflicts(
        goal: Goal,
        workHours: WorkHour[]
    ): boolean {
        const start = parseISO(goal.startDate);
        const end = parseISO(goal.endDate);
        const dayOfWeek = start.getDay();

        const workHour = workHours.find((wh) => wh.day_of_week === dayOfWeek);

        // If it's a work day and the goal is work-related, no conflict
        if (workHour && workHour.is_active) {
            return false;
        }

        // If it's not a work day but goal is personal, no conflict
        if (!workHour || !workHour.is_active) {
            const isPersonal = ["personal", "health", "social", "lifestyle"].some(
                (cat) => goal.category.toLowerCase().includes(cat)
            );
            return !isPersonal;
        }

        return true;
    }
}
