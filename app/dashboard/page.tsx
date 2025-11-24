"use client";

import { useState } from "react";
import Link from "next/link";
import { useGoals, Goal } from "@/components/GoalsContext";
import { useCustomization } from "@/components/CustomizationContext";
import StrategicOverview from "@/components/StrategicOverview";
import GoalsAtRisk from "@/components/GoalsAtRisk";
import FocusScore from "@/components/FocusScore";
import LifePillars from "@/components/LifePillars";
import CategoryRadar from "@/components/CategoryRadar";
import SmartSuggestions from "@/components/SmartSuggestions";
import GoalEditor from "@/components/GoalEditor";
import GoalListModal from "@/components/GoalListModal";
import { createDefaultGoal } from "@/components/goalHelpers";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { goals } = useGoals();
  const { getCategoryColor } = useCustomization();

  // State for modals
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [goalListModal, setGoalListModal] = useState<{ open: boolean; title: string; goals: Goal[] }>({
    open: false,
    title: "",
    goals: [],
  });

  const now = new Date();
  const hour = now.getHours();
  let greeting = "Good morning";
  if (hour >= 12) greeting = "Good afternoon";
  if (hour >= 17) greeting = "Good evening";

  // Find top priority category
  const activeHighPriGoals = goals.filter(g => (g.priority === 'high' || g.priority === 'critical') && g.status !== 'done');
  const categoryCounts: Record<string, number> = {};
  activeHighPriGoals.forEach(g => {
    categoryCounts[g.category] = (categoryCounts[g.category] || 0) + 1;
  });
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Life";

  // Handlers
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
  };

  const handleCreateGoal = (category?: string) => {
    setIsCreating(true);
    // If we wanted to pre-fill category, we'd need to modify GoalEditor to accept initial values or handle it here
    // For now, just opening create mode is good.
  };

  const handleSuggestionAction = (type: 'blocked' | 'overdue' | 'balance' | 'strategic', payload?: any) => {
    if (type === 'blocked') {
      const blocked = goals.filter(g => g.status === 'blocked');
      setGoalListModal({ open: true, title: "Blocked Goals", goals: blocked });
    } else if (type === 'overdue') {
      const overdue = goals.filter(g => g.status !== 'done' && new Date(g.endDate) < new Date());
      setGoalListModal({ open: true, title: "Overdue Goals", goals: overdue });
    } else if (type === 'balance') {
      // Open create modal, ideally pre-filled with category (payload)
      // For now just open create
      setIsCreating(true);
    } else if (type === 'strategic') {
      setIsCreating(true);
    }
  };

  return (
    <PageTransition>
      <main className="workspace">
        <div className="dashboard-grid">
        {/* 1. Control Bar */}
        <motion.header
          className="control-bar"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div className="control-bar__left">
            <motion.h1
              className="control-bar__title"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 0.61, 0.36, 1] }}
            >
              {greeting}.
            </motion.h1>
            <div className="control-bar__divider" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <FocusScore variant="compact" />
            </motion.div>
            <div className="control-bar__divider" />
            <motion.span
              className="text-sm text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              Focus: <span className="text-slate-200 font-medium">{topCategory}</span>
            </motion.span>
          </div>

          <motion.div
            className="control-bar__right"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="date-display text-sm text-muted font-medium">
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <Link href="/classic" className="btn btn--secondary btn--sm">
              Workspace
            </Link>
          </motion.div>
        </motion.header>

        {/* 2. Strategic Horizon */}
        <motion.section
          className="dashboard-section--strategic"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <StrategicOverview />
        </motion.section>

        {/* 3. Main Content Grid */}
        <div className="dashboard-main-grid grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Pillars & Suggestions */}
          <div className="dashboard-column dashboard-column--main lg:col-span-7 flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <LifePillars />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <SmartSuggestions onAction={handleSuggestionAction} />
            </motion.div>
          </div>

          {/* Right Column: Bottlenecks & Balance */}
          <div className="dashboard-column dashboard-column--side lg:col-span-5 flex flex-col gap-8">
            <motion.div
              className="dashboard-card-premium"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <GoalsAtRisk onEditGoal={handleEditGoal} />
            </motion.div>

            <motion.div
              className="dashboard-card-premium"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="flex justify-center items-center min-h-[300px]">
                <CategoryRadar variant="compact" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <GoalEditor
        mode="edit"
        open={!!editingGoal}
        goal={editingGoal}
        onCancel={() => setEditingGoal(null)}
        onSave={() => setEditingGoal(null)} // GoalsContext handles the actual save via optimistic updates usually, but GoalEditor calls onSave. We might need to refresh or just close.
      />

      <GoalEditor
        mode="create"
        open={isCreating}
        onCancel={() => setIsCreating(false)}
        onSave={() => setIsCreating(false)}
      />

      <GoalListModal
        open={goalListModal.open}
        title={goalListModal.title}
        goals={goalListModal.goals}
        onClose={() => setGoalListModal(prev => ({ ...prev, open: false }))}
        onSelectGoal={(goal) => {
          setGoalListModal(prev => ({ ...prev, open: false }));
          setEditingGoal(goal);
        }}
      />
      </main>
    </PageTransition>
  );
}
