import { Goal } from "@/components/GoalsContext";
import { parseISO, differenceInDays } from "date-fns";

type PrioritySuggestion = {
    id: string;
    type: "priority";
    title: string;
    description: string;
    action_type: string;
    action_payload: any;
    priority: number;
};

/**
 * AI-powered task prioritization
 * Analyzes goals and suggests priority adjustments
 */
export class PrioritizationAI {
    /**
     * Generate priority adjustment suggestions
     */
    static generateSuggestions(
        goals: Goal[],
        categoryBalance?: Record<string, number>
    ): PrioritySuggestion[] {
        const suggestions: PrioritySuggestion[] = [];
        const today = new Date();
        const activeGoals = goals.filter(
            (g) => g.status !== "completed" && g.status !== "cancelled"
        );

        // 1. Suggest upgrading priority for goals nearing deadline
        const urgentGoals = activeGoals.filter((g) => {
            const end = parseISO(g.endDate);
            const daysRemaining = differenceInDays(end, today);
            return daysRemaining >= 0 && daysRemaining <= 3 && g.priority !== "p1" && g.priority !== "p2";
        });

        if (urgentGoals.length > 0) {
            suggestions.push({
                id: `urgent-priority-${Date.now()}`,
                type: "priority",
                title: `Upgrade priority for ${urgentGoals.length} urgent goal${urgentGoals.length > 1 ? "s" : ""}`,
                description: "These goals are due soon but have low priority. Consider upgrading.",
                action_type: "upgrade_priority",
                action_payload: {
                    goal_ids: urgentGoals.map((g) => g.id),
                    suggested_priority: "p2",
                },
                priority: 9,
            });
        }

        // 2. Suggest downgrading low-urgency high-priority goals
        const misalignedGoals = activeGoals.filter((g) => {
            const end = parseISO(g.endDate);
            const daysRemaining = differenceInDays(end, today);
            return daysRemaining > 30 && (g.priority === "p1" || g.priority === "p2");
        });

        if (misalignedGoals.length > 0) {
            suggestions.push({
                id: `downgrade-priority-${Date.now()}`,
                type: "priority",
                title: `${misalignedGoals.length} high-priority goal${misalignedGoals.length > 1 ? "s" : ""} with distant deadline${misalignedGoals.length > 1 ? "s" : ""}`,
                description: "These high-priority goals are due in 30+ days. Consider lowering priority temporarily.",
                action_type: "downgrade_priority",
                action_payload: {
                    goal_ids: misalignedGoals.map((g) => g.id),
                    suggested_priority: "p3",
                },
                priority: 6,
            });
        }

        // 3. Ensure at least one high-priority goal exists
        const highPriorityGoals = activeGoals.filter(
            (g) => g.priority === "p1" || g.priority === "p2"
        );

        if (highPriorityGoals.length === 0 && activeGoals.length > 0) {
            const nearestDeadline = activeGoals
                .map((g) => ({
                    goal: g,
                    days: differenceInDays(parseISO(g.endDate), today),
                }))
                .filter((item) => item.days >= 0)
                .sort((a, b) => a.days - b.days)[0];

            if (nearestDeadline) {
                suggestions.push({
                    id: `set-priority-focus-${Date.now()}`,
                    type: "priority",
                    title: "No high-priority goals set",
                    description: "Set at least one goal as high priority to maintain focus.",
                    action_type: "set_priority_focus",
                    action_payload: {
                        goal_id: nearestDeadline.goal.id,
                        suggested_priority: "p2",
                    },
                    priority: 8,
                });
            }
        }

        // 4. Warn about too many high-priority goals
        if (highPriorityGoals.length > 5) {
            suggestions.push({
                id: `too-many-priorities-${Date.now()}`,
                type: "priority",
                title: `${highPriorityGoals.length} high-priority goals active`,
                description: "Having too many high-priority items dilutes focus. Consider consolidating.",
                action_type: "reduce_priorities",
                action_payload: {
                    goal_ids: highPriorityGoals.map((g) => g.id),
                    max_recommended: 3,
                },
                priority: 7,
            });
        }

        // 5. Suggest priority based on category balance
        if (categoryBalance) {
            const underrepresentedCategories = Object.entries(categoryBalance)
                .filter(([_, count]) => count === 0)
                .map(([cat]) => cat);

            if (underrepresentedCategories.length > 0 && activeGoals.length > 0) {
                const categoryGoals = activeGoals.filter((g) =>
                    underrepresentedCategories.includes(g.category)
                );

                if (categoryGoals.length > 0) {
                    suggestions.push({
                        id: `balance-categories-${Date.now()}`,
                        type: "priority",
                        title: "Balance category priorities",
                        description: `${underrepresentedCategories.join(", ")} categories have goals but low priority. Consider balancing.`,
                        action_type: "balance_category_priorities",
                        action_payload: {
                            categories: underrepresentedCategories,
                            goal_ids: categoryGoals.map((g) => g.id),
                        },
                        priority: 5,
                    });
                }
            }
        }

        // 6. Suggest priority for blocked/on-hold goals
        const blockedGoals = activeGoals.filter((g) => g.status === "on-hold" || g.status === "blocked");

        if (blockedGoals.length > 0) {
            const highPriorityBlocked = blockedGoals.filter((g) => g.priority === "p1" || g.priority === "p2");

            if (highPriorityBlocked.length > 0) {
                suggestions.push({
                    id: `blocked-high-priority-${Date.now()}`,
                    type: "priority",
                    title: `${highPriorityBlocked.length} high-priority goal${highPriorityBlocked.length > 1 ? "s" : ""} blocked`,
                    description: "These important goals are blocked. Clear blockers or adjust priorities.",
                    action_type: "resolve_blocked_priorities",
                    action_payload: {
                        goal_ids: highPriorityBlocked.map((g) => g.id),
                    },
                    priority: 10,
                });
            }
        }

        return suggestions.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Calculate recommended priority based on multiple factors
     */
    static calculateRecommendedPriority(goal: Goal): "p1" | "p2" | "p3" | "p4" {
        const today = new Date();
        const end = parseISO(goal.endDate);
        const daysRemaining = differenceInDays(end, today);

        let score = 0;

        // Factor 1: Time urgency
        if (daysRemaining < 0) score += 10; // Overdue
        else if (daysRemaining <= 3) score += 8;
        else if (daysRemaining <= 7) score += 6;
        else if (daysRemaining <= 14) score += 4;
        else if (daysRemaining <= 30) score += 2;

        // Factor 2: Current status
        if (goal.status === "active") score += 3;
        else if (goal.status === "in-progress") score += 5;
        else if (goal.status === "on-hold") score -= 2;

        // Factor 3: Blocked items get lower priority
        if (goal.status === "blocked") score -= 3;

        // Map score to priority
        if (score >= 10) return "p1";
        if (score >= 7) return "p2";
        if (score >= 4) return "p3";
        return "p4";
    }

    /**
     * Get priority distribution insights
     */
    static getPriorityInsights(goals: Goal[]): {
        distribution: Record<string, number>;
        recommendation: string;
    } {
        const activeGoals = goals.filter(
            (g) => g.status !== "completed" && g.status !== "cancelled"
        );

        const distribution: Record<string, number> = {
            p1: 0,
            p2: 0,
            p3: 0,
            p4: 0,
        };

        activeGoals.forEach((g) => {
            distribution[g.priority] = (distribution[g.priority] || 0) + 1;
        });

        let recommendation = "Your priority distribution looks balanced.";

        const highPriCount = distribution.p1 + distribution.p2;
        const lowPriCount = distribution.p3 + distribution.p4;

        if (highPriCount === 0 && activeGoals.length > 0) {
            recommendation = "Consider setting at least 1-2 goals as high priority for focus.";
        } else if (highPriCount > activeGoals.length * 0.6) {
            recommendation = "Too many high-priority items. Try to keep high-priority goals to 20-30% of active goals.";
        } else if (lowPriCount > activeGoals.length * 0.8) {
            recommendation = "Most goals are low priority. Identify your top priorities for better focus.";
        }

        return { distribution, recommendation };
    }
}
