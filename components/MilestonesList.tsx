"use client";

import { useState } from "react";

export type StandaloneMilestone = {
  id: string;
  type: "point" | "window";
  label: string;
  date?: string;
  windowStart?: string;
  windowEnd?: string;
  color: string;
  icon?: string;
};

type Props = {
  milestones: StandaloneMilestone[];
  onAdd: (milestone: Omit<StandaloneMilestone, "id">) => void;
  onEdit: (milestone: StandaloneMilestone) => void;
  onDelete: (id: string) => void;
};

const DEFAULT_ICONS = ["🎯", "🚀", "💡", "⭐", "🏆", "📍", "🔔", "💎"];
const DEFAULT_COLORS = ["#3b82f6", "#a855f7", "#14b8a6", "#f97316", "#facc15", "#fb7185", "#22c55e"];

export default function MilestonesList({ milestones, onAdd, onEdit, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<StandaloneMilestone>>({
    type: "point",
    label: "",
    color: DEFAULT_COLORS[0],
    icon: DEFAULT_ICONS[0],
  });

  const handleAdd = () => {
    if (!draft.label?.trim()) return;
    
    const newMilestone: Omit<StandaloneMilestone, "id"> = {
      type: draft.type || "point",
      label: draft.label.trim(),
      color: draft.color || DEFAULT_COLORS[0],
      icon: draft.icon,
      ...(draft.type === "point" 
        ? { date: draft.date || new Date().toISOString().slice(0, 10) }
        : {
            windowStart: draft.windowStart || new Date().toISOString().slice(0, 10),
            windowEnd: draft.windowEnd || new Date().toISOString().slice(0, 10),
          }
      ),
    };

    onAdd(newMilestone);
    setDraft({
      type: "point",
      label: "",
      color: DEFAULT_COLORS[0],
      icon: DEFAULT_ICONS[0],
    });
    setIsAdding(false);
  };

  return (
    <div className={`milestones-list ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="milestones-list__header">
        <button
          type="button"
          className="milestones-list__toggle"
          onClick={() => setCollapsed(!collapsed)}
        >
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
            style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s ease' }}
          >
            <path d="M4 2L8 6L4 10"/>
          </svg>
          <span>Milestones</span>
          <span className="milestones-list__count">{milestones.length}</span>
        </button>
        {!collapsed && (
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? "Cancel" : "+ Add"}
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="milestones-list__content">
          {isAdding && (
            <div className="milestone-form">
              <div className="milestone-form__field">
                <span>Label</span>
                <input
                  type="text"
                  className="field"
                  value={draft.label || ""}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                  placeholder="e.g., Product Launch"
                  autoFocus
                />
              </div>

              <div className="milestone-form__type">
                <span>Type</span>
                <div className="milestone-form__types">
                  <button
                    type="button"
                    className={`chip chip--interactive ${draft.type === 'point' ? 'chip--on' : ''}`}
                    onClick={() => setDraft({ ...draft, type: 'point' })}
                  >
                    Point
                  </button>
                  <button
                    type="button"
                    className={`chip chip--interactive ${draft.type === 'window' ? 'chip--on' : ''}`}
                    onClick={() => setDraft({ ...draft, type: 'window' })}
                  >
                    Window
                  </button>
                </div>
              </div>

              {draft.type === 'point' ? (
                <div className="milestone-form__field">
                  <span>Date</span>
                  <input
                    type="date"
                    className="field"
                    value={draft.date || ""}
                    onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  />
                </div>
              ) : (
                <div className="milestone-form__dates">
                  <div className="milestone-form__field">
                    <span>Start</span>
                    <input
                      type="date"
                      className="field"
                      value={draft.windowStart || ""}
                      onChange={(e) => setDraft({ ...draft, windowStart: e.target.value })}
                    />
                  </div>
                  <div className="milestone-form__field">
                    <span>End</span>
                    <input
                      type="date"
                      className="field"
                      value={draft.windowEnd || ""}
                      onChange={(e) => setDraft({ ...draft, windowEnd: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="milestone-form__field">
                <span>Icon (for point milestones)</span>
                <div className="milestone-form__icons">
                  {DEFAULT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`milestone-form__icon ${draft.icon === icon ? 'is-active' : ''}`}
                      onClick={() => setDraft({ ...draft, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="milestone-form__field">
                <span>Color</span>
                <div className="milestone-form__colors">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`milestone-form__color ${draft.color === color ? 'is-active' : ''}`}
                      style={{ background: color }}
                      onClick={() => setDraft({ ...draft, color })}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn btn--primary"
                onClick={handleAdd}
                disabled={!draft.label?.trim()}
              >
                Add Milestone
              </button>
            </div>
          )}

          {milestones.length === 0 && !isAdding ? (
            <p className="milestones-list__empty">No milestones yet. Click "+ Add" to create one.</p>
          ) : (
            <ul className="milestones-list__items">
              {milestones.map((milestone) => (
                <li key={milestone.id} className="milestone-item">
                  <div className="milestone-item__indicator" style={{ background: milestone.color }}>
                    {milestone.type === "point" && milestone.icon}
                  </div>
                  <div className="milestone-item__content">
                    <span className="milestone-item__label">{milestone.label}</span>
                    <span className="milestone-item__date">
                      {milestone.type === "point" 
                        ? new Date(milestone.date!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                        : `${new Date(milestone.windowStart!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} → ${new Date(milestone.windowEnd!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                      }
                    </span>
                  </div>
                  <button
                    type="button"
                    className="milestone-item__delete"
                    onClick={() => onDelete(milestone.id)}
                    aria-label="Delete milestone"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M2 2L10 10M10 2L2 10"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

