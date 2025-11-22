/**
 * Life Ops Center Migration Utilities
 * 
 * Handles migration from old goal system to new Life Ops system:
 * - Priorities: low/medium/high/critical → p4/p3/p2/p1
 * - Statuses: open/in-progress/blocked/done → idea/active/on-hold/completed
 * - Categories: STRATEGY/TACTICAL/PROJECT → CAREER/PERSONAL DEV/FINANCE
 */

export type OldPriority = "low" | "medium" | "high" | "critical";
export type NewPriority = "p1" | "p2" | "p3" | "p4";

export type OldStatus = "open" | "in-progress" | "blocked" | "done";
export type NewStatus = "idea" | "planned" | "active" | "on-hold" | "completed" | "cancelled";

const PRIORITY_MIGRATION_MAP: Record<OldPriority, NewPriority> = {
    "low": "p4",
    "medium": "p3",
    "high": "p2",
    "critical": "p1",
};

const STATUS_MIGRATION_MAP: Record<OldStatus, NewStatus> = {
    "open": "idea",
    "in-progress": "active",
    "blocked": "on-hold",
    "done": "completed",
};

const CATEGORY_MIGRATION_MAP: Record<string, string> = {
    "STRATEGY": "CAREER",
    "TACTICAL": "PERSONAL DEV",
    "PROJECT": "FINANCE",
    "LEARNING": "PERSONAL DEV",
    "HEALTH": "HEALTH",
    "WORK": "CAREER",
    "PERSONAL": "LIFESTYLE",
};

/**
 * Migrate priority from old system to new Life Ops system
 */
export function migratePriority(priority: string): string {
    // If already in new format, return as-is
    if (priority.startsWith("p") && ["p1", "p2", "p3", "p4"].includes(priority)) {
        return priority;
    }

    // Map old to new
    return PRIORITY_MIGRATION_MAP[priority as OldPriority] || "p3"; // Default to P3 (Medium)
}

/**
 * Migrate status from old system to new Life Ops system
 */
export function migrateStatus(status: string): string {
    // If already in new format, return as-is
    if (["idea", "planned", "active", "on-hold", "completed", "cancelled"].includes(status)) {
        return status;
    }

    // Map old to new
    return STATUS_MIGRATION_MAP[status as OldStatus] || "idea"; // Default to Idea
}

/**
 * Migrate category from old system to new Life Ops system
 */
export function migrateCategory(category: string): string {
    const upper = category.toUpperCase();

    // If already in new format, return as-is
    if (["FINANCE", "PERSONAL DEV", "HEALTH", "CAREER", "SOCIAL", "LIFESTYLE"].includes(upper)) {
        return upper;
    }

    // Map old to new
    return CATEGORY_MIGRATION_MAP[upper] || "FINANCE"; // Default to Finance
}

/**
 * Check if a goal needs migration
 */
export function needsMigration(goal: any): boolean {
    const oldPriorities = ["low", "medium", "high", "critical"];
    const oldStatuses = ["open", "in-progress", "blocked", "done"];
    const oldCategories = ["STRATEGY", "TACTICAL", "PROJECT", "LEARNING", "WORK"];

    return (
        oldPriorities.includes(goal.priority) ||
        oldStatuses.includes(goal.status) ||
        oldCategories.includes(goal.category?.toUpperCase())
    );
}

/**
 * Migrate a complete goal object to Life Ops system
 */
export function migrateGoal<T extends { priority: string; status: string; category: string }>(goal: T): T {
    if (!needsMigration(goal)) {
        return goal; // Already migrated
    }

    return {
        ...goal,
        priority: migratePriority(goal.priority),
        status: migrateStatus(goal.status),
        category: migrateCategory(goal.category),
    };
}

/**
 * Migrate an array of goals
 */
export function migrateGoals<T extends { priority: string; status: string; category: string }>(goals: T[]): T[] {
    return goals.map(migrateGoal);
}

/**
 * Get migration summary for logging
 */
export function getMigrationSummary(goals: any[]): string {
    const needingMigration = goals.filter(needsMigration);

    if (needingMigration.length === 0) {
        return "No goals need migration - all are using Life Ops system";
    }

    return `Migrated ${needingMigration.length} of ${goals.length} goals to Life Ops system`;
}
