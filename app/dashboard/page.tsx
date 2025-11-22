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
    <main className="workspace">
      <div className="dashboard-grid">
        {/* 1. Control Bar */}
        <header className="control-bar">
          <div className="control-bar__left">
            <h1 className="control-bar__title">{greeting}.</h1>
            <div className="control-bar__divider" />
            <FocusScore variant="compact" />
            <div className="control-bar__divider" />
            <span className="text-sm text-muted">Focus: <span className="text-slate-200 font-medium">{topCategory}</span></span>
          </div>

          <div className="control-bar__right">
            <div className="date-display text-sm text-muted font-medium">
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <Link href="/classic" className="btn btn--secondary btn--sm">
              Workspace
            </Link>
          </div>
        </header>

        {/* 2. Strategic Horizon */}
        <section className="dashboard-section--strategic">
          <StrategicOverview />
        </section>

        {/* 3. Main Content Grid */}
        <div className="dashboard-main-grid">
          {/* Left Column: Pillars & Suggestions */}
          <div className="dashboard-column dashboard-column--main">
            <LifePillars />
            <SmartSuggestions onAction={handleSuggestionAction} />
          </div>

          {/* Right Column: Bottlenecks & Balance */}
          <div className="dashboard-column dashboard-column--side">
            <div className="dashboard-card">
              <div className="dashboard-card__header">
                <h3>Bottlenecks</h3>
              </div>
              <GoalsAtRisk onEditGoal={handleEditGoal} />
            </div>

            <div className="dashboard-card">
              <div className="dashboard-card__header">
                <h3>Balance Check</h3>
              </div>
              <div className="flex justify-center h-48 items-center">
                <CategoryRadar variant="compact" />
              </div>
            </div>
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
  );
}
