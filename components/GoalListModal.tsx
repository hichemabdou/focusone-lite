"use client";

import Modal from "./Modal";
import { Goal } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";

type Props = {
    open: boolean;
    title: string;
    goals: Goal[];
    onClose: () => void;
    onSelectGoal: (goal: Goal) => void;
};

export default function GoalListModal({ open, title, goals, onClose, onSelectGoal }: Props) {
    const { getCategoryColor, getPriorityColor } = useCustomization();

    if (!open) return null;

    return (
        <Modal open={open} onClose={onClose} title={title}>
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto p-1">
                {goals.length === 0 ? (
                    <p className="text-muted text-center py-8">No goals found.</p>
                ) : (
                    goals.map(goal => (
                        <div
                            key={goal.id}
                            className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between group"
                            onClick={() => onSelectGoal(goal)}
                        >
                            <div className="flex flex-col gap-1">
                                <span className="font-medium text-slate-200">{goal.title}</span>
                                <div className="flex items-center gap-2 text-xs">
                                    <span style={{ color: getCategoryColor(goal.category) }}>{goal.category}</span>
                                    <span className="text-muted">•</span>
                                    <span style={{ color: getPriorityColor(goal.priority) }} className="capitalize">{goal.priority}</span>
                                    <span className="text-muted">•</span>
                                    <span className="text-muted">Due {new Date(goal.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="btn btn--xs btn--secondary">Edit</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
}
