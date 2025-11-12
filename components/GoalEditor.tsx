"use client";

import { useState } from "react";
import { Goal, Priority, Status, Category } from "./GoalsContext";
import Modal from "./Modal";
import { createDefaultGoal } from "./goalHelpers";

type GoalDraft = Omit<Goal, "id"> & { id?: string };

type Props = {
  mode: "create" | "edit";
  open: boolean;
  goal?: Goal | null;
  onCancel(): void;
  onSave(goal: Goal | Omit<Goal, "id">): void;
};

const CATEGORY_OPTIONS: Category[] = ["STRATEGY", "VISION", "TACTICAL", "PROJECT", "DAILY"];
const PRIORITY_OPTIONS: Priority[] = ["low", "medium", "high", "critical"];
const STATUS_OPTIONS: Status[] = ["open", "in-progress", "blocked", "done"];

export default function GoalEditor({ mode, open, goal, onCancel, onSave }: Props) {
  if (!open) return null;

  const initialDraft = goal ? { ...goal } : createDefaultGoal();
  const formKey = goal?.id ?? `mode-${mode}`;

  return (
    <Modal open={open} onClose={onCancel} title={mode === "create" ? "Add a goal" : "Edit goal"}>
      <GoalEditorForm
        key={formKey}
        mode={mode}
        initialDraft={initialDraft}
        onCancel={onCancel}
        onSave={onSave}
      />
    </Modal>
  );
}

type FormProps = {
  mode: "create" | "edit";
  initialDraft: GoalDraft;
  onCancel(): void;
  onSave(goal: Goal | Omit<Goal, "id">): void;
};

function GoalEditorForm({ mode, initialDraft, onCancel, onSave }: FormProps) {
  const [draft, setDraft] = useState<GoalDraft>(initialDraft);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof GoalDraft, value: string) => {
    setError(null);
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const save = () => {
    if (!draft.title.trim()) {
      setError("Give the goal a title.");
      return;
    }
    if (draft.startDate > draft.endDate) {
      setError("End date must be after start date.");
      return;
    }

    const payload = { ...draft, milestone: null };
    onSave(mode === "edit" ? (payload as Goal) : payload);
  };

  return (
    <form
      className="goal-editor"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      {error && <div className="goal-editor__error">{error}</div>}

      <label className="goal-editor__field">
        <span>Title</span>
        <input
          className="field"
          value={draft.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Name the intention"
        />
      </label>

      <label className="goal-editor__field">
        <span>Notes</span>
        <textarea
          className="field"
          value={draft.notes ?? ""}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Optional context"
          rows={2}
        />
      </label>

      <div className="goal-editor__grid">
        <label className="goal-editor__field">
          <span>Start</span>
          <input
            type="date"
            className="field"
            value={draft.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
          />
        </label>
        <label className="goal-editor__field">
          <span>End</span>
          <input
            type="date"
            className="field"
            value={draft.endDate}
            onChange={(e) => updateField("endDate", e.target.value)}
          />
        </label>
      </div>

      <div className="goal-editor__grid">
        <label className="goal-editor__field">
          <span>Category</span>
          <select
            className="field select"
            value={draft.category}
            onChange={(e) => updateField("category", e.target.value as Category)}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt.charAt(0) + opt.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </label>

        <label className="goal-editor__field">
          <span>Priority</span>
          <select
            className="field select"
            value={draft.priority}
            onChange={(e) => updateField("priority", e.target.value as Priority)}
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        </label>

        <label className="goal-editor__field">
          <span>Status</span>
          <select
            className="field select"
            value={draft.status}
            onChange={(e) => updateField("status", e.target.value as Status)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "in-progress" ? "In progress" : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="goal-editor__hint">
        Need checkpoints? Add milestones from the timeline after the goal is created.
      </p>

      <div className="goal-editor__actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary">
          {mode === "create" ? "Add goal" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
