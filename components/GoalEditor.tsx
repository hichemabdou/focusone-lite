"use client";

import { useMemo, useState, type ChangeEvent } from "react";
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
  const { addComment, deleteComment, updateComment } = useGoals();
  const { categories, addCategory } = useCustomization();
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

    const payload = { ...draft };
    onSave(mode === "edit" ? (payload as Goal) : payload);
  };

  const handleDateChange = (field: "startDate" | "endDate") => (event: ChangeEvent<HTMLInputElement>) => {
    updateField(field, event.target.value);
    event.currentTarget.blur();
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
          placeholder="Name your goal"
          autoFocus
        />
      </label>

      <div className="goal-editor__grid goal-editor__grid--dates">
        <label className="goal-editor__field">
          <span>Start</span>
          <input
            type="date"
            className="field"
            value={draft.startDate}
            onChange={handleDateChange("startDate")}
          />
        </label>
        <label className="goal-editor__field">
          <span>End</span>
          <input
            type="date"
            className="field"
            value={draft.endDate}
            onChange={handleDateChange("endDate")}
          />
        </label>
      </div>

      <div className="goal-editor__grid goal-editor__grid--meta">
        <label className="goal-editor__field goal-editor__field--inline">
          <span>Category</span>
          <InlineSelect
            value={draft.category}
            options={categoryOptions}
            onChange={(next) => updateField("category", next as Category)}
            addLabel="Add category"
            quickAddType="category"
            onQuickAdd={(name, color) => {
              addCategory(name, color);
              updateField("category", name.toUpperCase());
            }}
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

      <GoalCommentsSection
        mode={mode}
        comments={draft.comments ?? []}
        onAdd={(body) => {
          const trimmed = body.trim();
          if (!trimmed) return;
          const nextComment = {
            id: crypto.randomUUID(),
            body: trimmed,
            createdAt: new Date().toISOString(),
          };
          setDraft((prev) => ({
            ...prev,
            comments: [...(prev.comments ?? []), nextComment],
          }));
          if (mode === "edit" && goal?.id) {
            addComment(goal.id, nextComment);
          }
        }}
        onDelete={(commentId) => {
          setDraft((prev) => ({
            ...prev,
            comments: (prev.comments ?? []).filter((comment) => comment.id !== commentId),
          }));
          if (mode === "edit" && goal?.id) {
            deleteComment(goal.id, commentId);
          }
        }}
        onUpdate={(commentId, body) => {
          const trimmed = body.trim();
          if (!trimmed) return;
          setDraft((prev) => ({
            ...prev,
            comments: (prev.comments ?? []).map((comment) =>
              comment.id === commentId ? { ...comment, body: trimmed } : comment
            ),
          }));
          if (mode === "edit" && goal?.id) {
            updateComment(goal.id, commentId, trimmed);
          }
        }}
      />

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
  mode: "create" | "edit";
  comments: Goal["comments"];
  onAdd(body: string): void;
  onDelete(commentId: string): void;
  onUpdate(commentId: string, body: string): void;
};

function GoalCommentsSection({ mode, comments, onAdd, onDelete, onUpdate }: GoalCommentsSectionProps) {
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let label = "";
    if (diffMins < 1) label = "Just now";
    else if (diffMins < 60) label = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    else if (diffHours < 24) label = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    else if (diffDays < 7) label = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    else {
      label = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }

    const absolute = date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return `${label} • ${absolute}`;
  };

  const handleAddComment = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    
    onAdd(trimmed);
    setBody("");
  };

  const startEdit = (comment: Goal["comments"][0]) => {
    setEditingId(comment.id);
    setEditBody(comment.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditBody("");
  };

  const saveEdit = (commentId: string) => {
    const trimmed = editBody.trim();
    if (!trimmed) return;
    onUpdate(commentId, trimmed);
    setEditingId(null);
    setEditBody("");
  };

  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <section className="goal-comments">
      <header className="goal-comments__header">
        <span>{mode === "create" ? "Add context" : "Comments"}</span>
        <span className="goal-comments__count">{comments.length}</span>
      </header>
      <div className="goal-comments__content">
        {sortedComments.length === 0 ? (
          <p className="goal-comments__empty">No comments yet. Add a reflection or progress note below.</p>
        ) : (
          <ul className="goal-comments__list">
            {sortedComments.map((comment) => (
              <li key={comment.id} className="goal-comments__item">
                {editingId === comment.id ? (
                  <div className="goal-comments__edit">
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="field goal-comments__edit-textarea"
                      rows={3}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          saveEdit(comment.id);
                        }
                        if (e.key === 'Escape') {
                          cancelEdit();
                        }
                      }}
                    />
                    <div className="goal-comments__edit-actions">
                      <button 
                        type="button" 
                        className="btn btn--ghost"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        className="btn btn--primary"
                        onClick={() => saveEdit(comment.id)}
                        disabled={!editBody.trim()}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="goal-comments__item-body">
                    <button
                      type="button"
                      className="goal-comments__delete-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(comment.id);
                      }}
                      aria-label="Delete comment"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M2 2L10 10M10 2L2 10"/>
                      </svg>
                    </button>
                    <div className="goal-comments__date-row">
                      <span className="goal-comments__date" title={new Date(comment.createdAt).toLocaleString()}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p 
                      className="goal-comments__body"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startEdit(comment);
                      }}
                      role="button"
                      tabIndex={0}
                      title="Click to edit"
                    >
                      {comment.body}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="goal-comments__composer">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a comment..."
          rows={3}
          className="field"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddComment();
            }
          }}
        />
        <span className="goal-comments__composer-hint">Press Enter to submit • Shift + Enter for a new line</span>
      </div>
    </section>
  );
}
