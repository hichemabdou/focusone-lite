"use client";

import { useState } from "react";

type QuickAddType = "category" | "priority" | "status";

type Props = {
  type: QuickAddType;
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
};

const DEFAULT_COLORS = {
  category: "#3b82f6",
  priority: "#60a5fa",
  status: "#38bdf8",
};

const PRESET_COLORS = [
  "#3b82f6", // blue
  "#a855f7", // purple
  "#14b8a6", // teal
  "#f97316", // orange
  "#facc15", // yellow
  "#fb7185", // pink
  "#22c55e", // green
  "#94a3b8", // slate
];

export default function QuickAddModal({ type, open, onClose, onAdd }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLORS[type]);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(`Enter a ${type} name`);
      return;
    }
    onAdd(trimmed, color);
    setName("");
    setColor(DEFAULT_COLORS[type]);
    setError(null);
    onClose();
  };

  const handleClose = () => {
    setName("");
    setColor(DEFAULT_COLORS[type]);
    setError(null);
    onClose();
  };

  const title = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;

  return (
    <div className="quick-add-backdrop" onClick={handleClose}>
      <div 
        className="quick-add-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="quick-add-header">
          <h4>{title}</h4>
          <button
            type="button"
            className="quick-add-close"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2L12 12M12 2L2 12"/>
            </svg>
          </button>
        </div>

        {error && <div className="quick-add-error">{error}</div>}

        <div className="quick-add-content">
          <label className="quick-add-field">
            <span>Name</span>
            <input
              type="text"
              className="field"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={`e.g., ${type === 'category' ? 'HEALTH' : type === 'priority' ? 'Urgent' : 'Review'}`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleClose();
              }}
            />
          </label>

          <div className="quick-add-field">
            <span>Color</span>
            <div className="quick-add-colors">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className={`quick-add-color-swatch ${color === presetColor ? 'is-active' : ''}`}
                  style={{ background: presetColor }}
                  onClick={() => setColor(presetColor)}
                  aria-label={`Select color ${presetColor}`}
                />
              ))}
              <input
                type="color"
                className="quick-add-color-picker"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                title="Choose custom color"
              />
            </div>
          </div>

          <div className="quick-add-preview">
            <span>Preview</span>
            <div className="chip" style={{ 
              background: `${color}20`, 
              borderColor: `${color}40`,
              color: color 
            }}>
              {name || 'Preview'}
            </div>
          </div>
        </div>

        <div className="quick-add-actions">
          <button type="button" className="btn" onClick={handleClose}>
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn--primary" 
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Add {type}
          </button>
        </div>
      </div>
    </div>
  );
}

