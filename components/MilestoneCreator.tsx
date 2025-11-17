"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";

type Milestone = {
  id?: string;
  type: "point" | "window";
  label: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  color: string;
  icon?: string;
};

type Props = {
  milestone?: Milestone;
  onSave: (milestone: Milestone) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

const ICONS = ["🎯", "🚀", "💡", "⭐", "🏆", "✨", "🔔", "💎", "🎉", "📌", "🌟", "💫", "🔥", "⚡", "🎊", "🏁"];
const COLORS = ["#3b82f6", "#a855f7", "#14b8a6", "#f97316", "#facc15", "#fb7185", "#22c55e", "#ec4899", "#8b5cf6", "#06b6d4"];

export default function MilestoneCreator({ milestone, onSave, onCancel, onDelete }: Props) {
  const [type, setType] = useState<"point" | "window">(milestone?.type || "point");
  const [label, setLabel] = useState(milestone?.label || "");
  const [date, setDate] = useState(milestone?.date || new Date().toISOString().slice(0, 10));
  const [startDate, setStartDate] = useState(milestone?.startDate || new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(milestone?.endDate || new Date().toISOString().slice(0, 10));
  const [color, setColor] = useState(milestone?.color || COLORS[0]);
  const [icon, setIcon] = useState(milestone?.icon || ICONS[0]);

  useEffect(() => {
    if (milestone) {
      setType(milestone.type);
      setLabel(milestone.label);
      if (milestone.date) setDate(milestone.date);
      if (milestone.startDate) setStartDate(milestone.startDate);
      if (milestone.endDate) setEndDate(milestone.endDate);
      setColor(milestone.color);
      if (milestone.icon) setIcon(milestone.icon);
    }
  }, [milestone]);

  const handleSave = () => {
    if (!label.trim()) return;

    const baseMilestone = {
      ...(milestone?.id && { id: milestone.id }),
      type,
      label: label.trim(),
      color,
    };

    if (type === "point") {
      onSave({ ...baseMilestone, date, icon });
    } else {
      onSave({ ...baseMilestone, startDate, endDate });
    }
  };

  return (
    <Modal
      open={true}
      onClose={onCancel}
      title={milestone ? "Edit Milestone" : "Add Milestone"}
    >
      <div className="milestone-creator">
        <div className="milestone-creator__field">
          <label className="milestone-creator__label">Label</label>
          <input
            type="text"
            className="field"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Product Launch"
            autoFocus
          />
        </div>

        <div className="milestone-creator__field">
          <label className="milestone-creator__label">Type</label>
          <div className="milestone-creator__types">
            <button
              type="button"
              className={`chip chip--interactive ${type === 'point' ? 'chip--on' : ''}`}
              onClick={() => setType('point')}
            >
              Point
            </button>
            <button
              type="button"
              className={`chip chip--interactive ${type === 'window' ? 'chip--on' : ''}`}
              onClick={() => setType('window')}
            >
              Window
            </button>
          </div>
        </div>

        {type === "point" ? (
          <div className="milestone-creator__field">
            <label className="milestone-creator__label">Date</label>
            <input
              type="date"
              className="field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        ) : (
          <div className="milestone-creator__dates">
            <div className="milestone-creator__field">
              <label className="milestone-creator__label">Start Date</label>
              <input
                type="date"
                className="field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="milestone-creator__field">
              <label className="milestone-creator__label">End Date</label>
              <input
                type="date"
                className="field"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {type === "point" && (
          <div className="milestone-creator__field">
            <label className="milestone-creator__label">Icon</label>
            <div className="milestone-creator__icons">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  className={`milestone-creator__icon ${icon === i ? 'is-active' : ''}`}
                  onClick={() => setIcon(i)}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="milestone-creator__field">
          <label className="milestone-creator__label">Color</label>
          <div className="milestone-creator__colors">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`milestone-creator__color ${color === c ? 'is-active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="milestone-creator__actions">
          {onDelete && (
            <button type="button" className="btn btn--danger" onClick={onDelete}>
              Delete
            </button>
          )}
          <div className="milestone-creator__actions-right">
            <button type="button" className="btn" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSave}
              disabled={!label.trim()}
            >
              {milestone ? "Save" : "Add Milestone"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
