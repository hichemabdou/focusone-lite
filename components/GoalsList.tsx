"use client";

import { useState, useEffect } from "react";

interface Goal {
  id: string;
  title: string;
  start: string;
  due: string;
  priority?: string;
}

export default function GoalsList() {
  const [items, setItems] = useState<Goal[]>([]);

  // ✅ Load data (if any) from localStorage for now
  useEffect(() => {
    try {
      const stored = localStorage.getItem("goals");
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load goals:", err);
    }
  }, []);

  // ✅ Add new goal
  const addGoal = () => {
    const title = prompt("Enter new goal title:");
    if (!title) return;
    const newGoal: Goal = {
      id: Math.random().toString(36).slice(2),
      title,
      start: new Date().toISOString().slice(0, 10),
      due: new Date().toISOString().slice(0, 10),
      priority: "medium",
    };
    const updated = [...items, newGoal];
    setItems(updated);
    localStorage.setItem("goals", JSON.stringify(updated));
  };

  // ✅ Delete goal
  const deleteGoal = (id: string) => {
    if (!confirm("Delete this goal?")) return;
    const updated = items.filter((g) => g.id !== id);
    setItems(updated);
    localStorage.setItem("goals", JSON.stringify(updated));
  };

  return (
    <div className="text-neutral-200">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Goals</h2>
        <button
          onClick={addGoal}
          className="rounded-md bg-white/10 hover:bg-white/20 px-3 py-1 text-sm"
        >
          + Add
        </button>
      </div>

      {(!items || items.length === 0) && (
        <p className="text-sm text-neutral-400 italic">
          No goals yet. Click “Add” to create one.
        </p>
      )}

      <ul className="divide-y divide-neutral-700 mt-2">
        {items.map((g) => (
          <li key={g.id} className="py-2 flex items-center justify-between">
            <span className="text-sm flex-1 truncate">{g.title}</span>
            <button
              onClick={() => deleteGoal(g.id)}
              className="text-xs text-red-400 hover:text-red-300 ml-2"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
