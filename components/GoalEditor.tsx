"use client";

import { useMemo, useState } from "react";
import { Goal, Priority, Status, Category, useGoals } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";
import Modal from "./Modal";
import { createDefaultGoal } from "./goalHelpers";
import InlineSelect from "./InlineSelect";
import { openCustomizationPanel } from "./customizationEvents";

type GoalDraft = Omit<Goal, "id"> & { id?: string };

type Props = {
  mode: "create" | "edit";
  open: boolean;
  goal?: Goal | null;
  onCancel(): void;
  onSave(goal: Goal | Omit<Goal, "id">): void;
};

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
        goal={goal ?? undefined}
        onCancel={onCancel}
        onSave={onSave}
      />
    </Modal>
  );
}

type FormProps = {
  mode: "create" | "edit";
  initialDraft: GoalDraft;
  goal?: Goal | null;
  onCancel(): void;
  onSave(goal: Goal | Omit<Goal, "id">): void;
};

function GoalEditorForm({ mode, initialDraft, goal, onCancel, onSave }: FormProps) {
  const { addComment, deleteComment } = useGoals();
  const { categories } = useCustomization();
  const [draft, setDraft] = useState<GoalDraft>(initialDraft);
  const [error, setError] = useState<string | null>(null);
  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        value: cat.name,
        label: cat.name.charAt(0) + cat.name.slice(1).toLowerCase(),
        tone: `category-${cat.name.toLowerCase()}`,
      })),
    [categories]
  );
  const priorityOptions = useMemo(
    () =>
      PRIORITY_OPTIONS.map((opt) => ({
        value: opt,
        label: opt.charAt(0).toUpperCase() + opt.slice(1),
        tone: `priority-${opt}`,
      })),
    []
  );
  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((opt) => ({
        value: opt,
        label: opt === "in-progress" ? "In progress" : opt.charAt(0).toUpperCase() + opt.slice(1),
        tone: opt === "in-progress" ? "status-inprog" : `status-${opt}`,
      })),
    []
  );

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
        <label className="goal-editor__field goal-editor__field--inline">
          <span>Category</span>
          <InlineSelect
            value={draft.category}
            options={categoryOptions}
            onChange={(next) => updateField("category", next as Category)}
            addLabel="Add category"
            onAdd={() => openCustomizationPanel("categories")}
          />
        </label>

        <label className="goal-editor__field goal-editor__field--inline">
          <span>Priority</span>
          <InlineSelect
            value={draft.priority}
            options={priorityOptions}
            onChange={(next) => updateField("priority", next as Priority)}
            addLabel="Add priority"
            onAdd={() => openCustomizationPanel("priorities")}
          />
        </label>

        <label className="goal-editor__field goal-editor__field--inline">
          <span>Status</span>
          <InlineSelect
            value={draft.status}
            options={statusOptions}
            onChange={(next) => updateField("status", next as Status)}
            addLabel="Add status"
            onAdd={() => openCustomizationPanel("statuses")}
          />
        </label>
      </div>

      <p className="goal-editor__hint">
        Need checkpoints? Add milestones from the timeline after the goal is created.
      </p>

      {mode === "edit" && goal?.id && (
        <GoalCommentsSection
          goalId={goal.id}
          comments={goal.comments ?? []}
          addComment={addComment}
          deleteComment={deleteComment}
        />
      )}

      <div className="goal-editor__actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary">
          {mode === "create" ? "Add goal" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

type GoalCommentsSectionProps = {
  goalId: string;
  comments: Goal["comments"];
  addComment(goalId: string, body: string): void;
  deleteComment(goalId: string, commentId: string): void;
};

function GoalCommentsSection({ goalId, comments, addComment, deleteComment }: GoalCommentsSectionProps) {
  const [body, setBody] = useState("");
  const formatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }),
    []
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    addComment(goalId, body.trim());
    setBody("");
  };

  return (
    <section className="goal-comments">
      <header className="goal-comments__header">
        <span>Comments</span>
        <span className="goal-comments__count">{comments.length}</span>
      </header>
      <ul className="goal-comments__list">
        {comments.length === 0 && <li className="goal-comments__empty">No comments yet.</li>}
        {comments.map((comment) => (
          <li key={comment.id} className="goal-comments__item">
            <p>{comment.body}</p>
            <div className="goal-comments__meta">
              <span>{formatter.format(new Date(comment.createdAt))}</span>
              <button type="button" onClick={() => deleteComment(goalId, comment.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form className="goal-comments__composer" onSubmit={handleSubmit}>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Leave a reflection or progress note"
          rows={2}
        />
        <button type="submit" className="btn">
          Add comment
        </button>
      </form>
    </section>
  );
}
