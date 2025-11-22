"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { Goal, Priority, Status, Category, useGoals } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";
import Modal from "./Modal";
import { createDefaultGoal } from "./goalHelpers";
import EnhancedSelect from "./EnhancedSelect";

type GoalDraft = Omit<Goal, "id"> & { id?: string };

type Props = {
  mode: "create" | "edit";
  open: boolean;
  goal?: Goal | null;
  onCancel(): void;
  onSave(goal: Goal | Omit<Goal, "id">): void;
};

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
  const { categories, priorities, statuses, addCategory } = useCustomization();
  const [draft, setDraft] = useState<GoalDraft>(initialDraft);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
      })),
    [categories]
  );

  const priorityOptions = useMemo(
    () =>
      priorities.map((pri) => ({
        id: pri.id,
        name: pri.name,
        color: pri.color,
      })),
    [priorities]
  );

  const statusOptions = useMemo(
    () =>
      statuses.map((status) => ({
        id: status.id,
        name: status.name,
        color: status.color,
      })),
    [statuses]
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

    // Optimistic update first
    onSave(mode === "edit" ? (payload as Goal) : payload);

    // Trigger background sync if needed
    if (payload.syncToGoogle || (goal?.syncToGoogle && !payload.syncToGoogle)) {
      // We need the ID for sync. If creating, we might not have it yet unless we generated it.
      // In GoalsContext, addGoal returns the new goal with ID.
      // But here we just call onSave.
      // Ideally, onSave should return the saved goal, or we handle sync in GoalsContext.
      // Let's handle it in GoalsContext to keep this component pure UI.
    }
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
          <EnhancedSelect
            type="category"
            value={draft.category}
            options={categoryOptions}
            onChange={(value) => updateField("category", value as Category)}
            allowCreate={true}
            onCreateNew={(name: string, color?: string) => {
              addCategory(name, color || `hsl(${Math.random() * 360}, 65%, 55%)`);
              updateField("category", name.toUpperCase());
            }}
          />
        </label>

        <label className="goal-editor__field goal-editor__field--inline">
          <span>Priority</span>
          <EnhancedSelect
            type="priority"
            value={draft.priority}
            options={priorityOptions}
            onChange={(value) => updateField("priority", value as Priority)}
          />
        </label>

        <label className="goal-editor__field goal-editor__field--inline">
          <span>Status</span>
          <EnhancedSelect
            type="status"
            value={draft.status}
            options={statusOptions}
            onChange={(value) => updateField("status", value as Status)}
          />
        </label>
      </div>

      {/* Sync & Reminders Section */}
      <div className="goal-editor__section">
        <h3 className="goal-editor__section-title">Integrations & Reminders</h3>

        <div className="goal-editor__field goal-editor__field--checkbox">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.syncToGoogle ?? false}
              onChange={(e) => {
                setDraft(prev => ({ ...prev, syncToGoogle: e.target.checked }));
              }}
              className="checkbox"
            />
            <span>Sync to Google Calendar</span>
          </label>
        </div>

        <div className="goal-editor__field">
          <div className="flex items-center justify-between mb-2">
            <span>Reminders</span>
            <button
              type="button"
              className="text-xs text-blue-400 hover:text-blue-300"
              onClick={() => {
                const newReminder = {
                  id: crypto.randomUUID(),
                  type: "email" as const,
                  trigger: "24h" as const,
                  offsetMinutes: 1440
                };
                setDraft(prev => ({
                  ...prev,
                  reminders: [...(prev.reminders || []), newReminder]
                }));
              }}
            >
              + Add Reminder
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {(draft.reminders || []).map((reminder, idx) => (
              <div key={reminder.id} className="flex items-center gap-2 bg-white/5 p-2 rounded">
                <select
                  value={reminder.type}
                  onChange={(e) => {
                    const newReminders = [...(draft.reminders || [])];
                    newReminders[idx] = { ...reminder, type: e.target.value as any };
                    setDraft(prev => ({ ...prev, reminders: newReminders }));
                  }}
                  className="bg-transparent border border-white/10 rounded px-2 py-1 text-sm"
                >
                  <option value="email">Email</option>
                  <option value="notification">In-app</option>
                </select>

                <select
                  value={reminder.trigger}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    let offset = 0;
                    if (val === "1h") offset = 60;
                    if (val === "24h") offset = 1440;
                    if (val === "1w") offset = 10080;

                    const newReminders = [...(draft.reminders || [])];
                    newReminders[idx] = { ...reminder, trigger: val, offsetMinutes: offset };
                    setDraft(prev => ({ ...prev, reminders: newReminders }));
                  }}
                  className="bg-transparent border border-white/10 rounded px-2 py-1 text-sm"
                >
                  <option value="1h">1 hour before</option>
                  <option value="24h">1 day before</option>
                  <option value="1w">1 week before</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setDraft(prev => ({
                      ...prev,
                      reminders: (prev.reminders || []).filter(r => r.id !== reminder.id)
                    }));
                  }}
                  className="ml-auto text-white/40 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
            {(!draft.reminders || draft.reminders.length === 0) && (
              <div className="text-xs text-white/30 italic">No reminders set</div>
            )}
          </div>
        </div>
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
  const { data: session } = useSession();
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  // Get user initials for avatar
  const getUserInitials = () => {
    if (session?.user?.name) {
      const parts = session.user.name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    if (session?.user?.email) {
      return session.user.email[0].toUpperCase();
    }
    return 'U';
  };

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
        {comments.length > 0 && <span className="goal-comments__count">{comments.length}</span>}
      </header>

      {/* Composer - now at top with avatar */}
      <div className="goal-comments__composer">
        <div className="goal-comments__avatar">
          {getUserInitials()}
        </div>
        <div className="goal-comments__composer-input-wrapper">
          <input
            type="text"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Add a comment..."
            className="goal-comments__composer-input"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
          />
        </div>
      </div>

      {/* Comments List */}
      {sortedComments.length > 0 && (
        <div className="goal-comments__content">
          <ul className="goal-comments__list">
            {sortedComments.map((comment) => (
              <li key={comment.id} className="goal-comments__item">
                {editingId === comment.id ? (
                  <div className="goal-comments__edit">
                    <div className="goal-comments__avatar">
                      {getUserInitials()}
                    </div>
                    <div className="goal-comments__edit-content">
                      <input
                        type="text"
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="goal-comments__edit-input"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
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
                          className="goal-comments__edit-cancel"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="goal-comments__edit-save"
                          onClick={() => saveEdit(comment.id)}
                          disabled={!editBody.trim()}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="goal-comments__item-content">
                    <div className="goal-comments__avatar">
                      {getUserInitials()}
                    </div>
                    <div className="goal-comments__item-main">
                      <div className="goal-comments__item-header">
                        <span className="goal-comments__date">
                          {formatDate(comment.createdAt)}
                        </span>
                        <div className="goal-comments__item-actions">
                          <button
                            type="button"
                            className="goal-comments__action-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              startEdit(comment);
                            }}
                            aria-label="Edit comment"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="goal-comments__action-btn goal-comments__action-btn--delete"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onDelete(comment.id);
                            }}
                            aria-label="Delete comment"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="goal-comments__body">
                        {comment.body}
                      </p>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
