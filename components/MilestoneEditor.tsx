"use client";

import { useState } from "react";
import { Goal } from "./GoalsContext";
import Modal from "./Modal";
import { ensureMilestoneDraft, normalizeMilestoneDraft } from "./goalHelpers";

type Props = {
  open: boolean;
  goal: Goal | null;
  onClose(): void;
  onSave(next: Goal): void;
};

const COLOR_OPTIONS = ["#f97316", "#0ea5e9", "#a855f7", "#22c55e", "#eab308"];

export default function MilestoneEditor(props: Props) {
  const { goal } = props;
  if (!goal) return null;
  return <MilestoneEditorForm key={goal.id} {...props} goal={goal} />;
}

function MilestoneEditorForm({ open, goal, onClose, onSave }: Required<Props>) {
  const fallbackDate = goal.endDate;
  const initial = goal.milestone;

  const [type, setType] = useState<"none" | "point" | "window">(initial?.type ?? "none");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [pointDate, setPointDate] = useState(
    initial?.type === "point" ? initial.date : fallbackDate
  );
  const [windowStart, setWindowStart] = useState(
    initial?.type === "window" ? initial.windowStart : fallbackDate
  );
  const [windowEnd, setWindowEnd] = useState(
    initial?.type === "window" ? initial.windowEnd : fallbackDate
  );
  const [color, setColor] = useState<string | undefined>(initial?.color);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    if (type === "none") {
      onSave({ ...goal, milestone: null });
      onClose();
      return;
    }
    if (!label.trim()) {
      setError("Give the milestone a label.");
      return;
    }
    if (type === "point" && !pointDate) {
      setError("Pick a target date.");
      return;
    }
    if (type === "window" && (!windowStart || !windowEnd)) {
      setError("Provide the window start and end.");
      return;
    }
    const base = ensureMilestoneDraft(goal.milestone, goal.endDate, type === "point" ? "point" : "window");
    const draft =
      type === "point"
        ? { ...base, type: "point" as const, label, date: pointDate, color }
        : {
            ...base,
            type: "window" as const,
            label,
            windowStart,
            windowEnd,
            color,
          };
    const normalized = normalizeMilestoneDraft(draft, goal.endDate);
    onSave({ ...goal, milestone: normalized });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Milestone">
        <form
          className="milestone-editor"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          {error && <div className="milestone-editor__error">{error}</div>}

          <label className="goal-editor__field">
            <span>Title</span>
            <input
              className="field"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Launch beta"
            />
          </label>

          <div className="milestone-editor__type">
            <span>Type</span>
            <div className="goal-editor__chips">
              {["none", "point", "window"].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={["chip", "chip--interactive", type === option ? "chip--on" : ""].join(" ")}
                  onClick={() => setType(option as typeof type)}
                >
                  {option === "none" ? "None" : option === "point" ? "Point" : "Window"}
                </button>
              ))}
            </div>
          </div>

          {type === "point" && (
            <label className="goal-editor__field">
              <span>Date</span>
              <input type="date" className="field" value={pointDate} onChange={(e) => setPointDate(e.target.value)} />
            </label>
          )}

          {type === "window" && (
            <div className="goal-editor__milestone-grid">
              <label className="goal-editor__field">
                <span>Window start</span>
                <input type="date" className="field" value={windowStart} onChange={(e) => setWindowStart(e.target.value)} />
              </label>
              <label className="goal-editor__field">
                <span>Window end</span>
                <input type="date" className="field" value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} />
              </label>
            </div>
          )}

          {type !== "none" && (
            <div className="milestone-editor__colors">
              <span>Color</span>
              <div className="milestone-editor__swatches">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option}
                    style={{ background: option }}
                    className={[
                      "milestone-editor__swatch",
                      color === option ? "is-active" : "",
                    ].join(" ")}
                    onClick={() => setColor(option)}
                  />
                ))}
                <button
                  type="button"
                  className={["milestone-editor__swatch", !color ? "is-active" : ""].join(" ")}
                  onClick={() => setColor(undefined)}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="goal-editor__actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              {type === "none" ? "Clear milestone" : "Save milestone"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
