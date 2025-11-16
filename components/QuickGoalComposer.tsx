"use client";

import { useMemo, useState, useEffect } from "react";
import { Category, Priority, useGoals } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";

type Draft = {
  title: string;
  startDate: string;
  endDate: string;
  category: Category;
  priority: Priority;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function createDraft(defaultCategory: Category): Draft {
  const today = new Date();
  const inSixWeeks = new Date(today.getTime() + DAY_MS * 42);
  return {
    title: "",
    startDate: formatDate(today),
    endDate: formatDate(inSixWeeks),
    category: defaultCategory,
    priority: "medium",
  };
}

export default function QuickGoalComposer() {
  const { addGoal } = useGoals();
  const { categories } = useCustomization();
  const fallbackCategory = (categories[0]?.name ?? "PROJECT") as Category;
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed
  const [draft, setDraft] = useState<Draft>(() => createDraft(fallbackCategory));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const categoryOptions = useMemo(() => {
    if (!categories.length) {
      return [{ id: "PROJECT", name: "PROJECT" }];
    }
    return categories;
  }, [categories]);

  const handleChange = (field: keyof Draft, value: string) => {
    setError(null);
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const resetDraft = (nextCategory: Category) => {
    setDraft(createDraft(nextCategory));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError("Give the goal a title to capture it quickly.");
      return;
    }
    if (draft.startDate > draft.endDate) {
      setError("End date must be after start date.");
      return;
    }
    addGoal({
      title: draft.title.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
      category: draft.category,
      priority: draft.priority,
      status: "open",
      notes: "",
      milestone: null,
      comments: [],
    });
    setMessage("Goal captured");
    resetDraft(draft.category);
    setIsExpanded(false);
    window.setTimeout(() => setMessage(null), 2500);
  };

  const openFullComposer = () => {
    window.dispatchEvent(new Event("open-goal-composer"));
    setIsExpanded(false);
  };

  useEffect(() => {
    const handleToggle = () => setIsExpanded((prev) => !prev);
    window.addEventListener("toggle-quick-composer", handleToggle);
    return () => window.removeEventListener("toggle-quick-composer", handleToggle);
  }, []);

  if (!isExpanded) {
    return (
      <div className="quick-composer quick-composer--collapsed">
        <button
          type="button"
          className="quick-composer__toggle"
          onClick={() => setIsExpanded(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Quick add goal</span>
        </button>
      </div>
    );
  }

  return (
    <form className="quick-composer quick-composer--expanded" onSubmit={handleSubmit}>
      <div className="quick-composer__header">
        <span className="quick-composer__title">Quick add goal</span>
        <button
          type="button"
          className="quick-composer__close"
          onClick={() => setIsExpanded(false)}
          aria-label="Collapse quick add"
        >
          ×
        </button>
      </div>

      <div className="quick-composer__fields">
        <input
          className="quick-composer__title-input"
          value={draft.title}
          onChange={(event) => handleChange("title", event.target.value)}
          placeholder="Name your goal..."
          autoFocus
        />
        <div className="quick-composer__meta">
          <input
            type="date"
            value={draft.startDate}
            onChange={(event) => handleChange("startDate", event.target.value)}
            className="quick-composer__date"
          />
          <span className="quick-composer__arrow">→</span>
          <input
            type="date"
            value={draft.endDate}
            onChange={(event) => handleChange("endDate", event.target.value)}
            className="quick-composer__date"
          />
          <select
            value={draft.category}
            onChange={(event) => handleChange("category", event.target.value as Category)}
            className="quick-composer__select"
          >
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.name}>
                {option.name.charAt(0) + option.name.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <select
            value={draft.priority}
            onChange={(event) => handleChange("priority", event.target.value as Priority)}
            className="quick-composer__select"
          >
            {(["low", "medium", "high", "critical"] as Priority[]).map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="quick-composer__actions">
        {message && <span className="quick-composer__message">{message}</span>}
        {error && <span className="quick-composer__error">{error}</span>}
        <div className="quick-composer__buttons">
          <button type="button" className="btn btn--ghost" onClick={openFullComposer}>
            Full editor
          </button>
          <button type="submit" className="btn btn--primary">
            Add goal
          </button>
        </div>
      </div>
    </form>
  );
}

