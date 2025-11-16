"use client";

import { Goal } from "./GoalsContext";

type Props = {
  open: boolean;
  goals: Goal[];
  onClose(): void;
  onEdit(goal: Goal): void;
  onClear(goal: Goal): void;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function MilestonesPanel({ open, goals, onClose, onEdit, onClear }: Props) {
  const withMilestones = goals.filter((goal) => goal.milestone);
  const withoutMilestones = goals.filter((goal) => !goal.milestone);

  return (
    <aside className={["milestones-drawer", open ? "is-open" : ""].join(" ")} aria-hidden={!open}>
      <div className="milestones-drawer__backdrop" onClick={onClose} />
      <div className="milestones-drawer__panel" role="dialog" aria-modal="true" aria-label="Milestones control">
        <header className="milestones-drawer__head">
          <div>
            <p className="milestones-drawer__eyebrow">Timeline controls</p>
            <h3>Milestones</h3>
          </div>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </header>

        <section className="milestones-drawer__section">
          <div className="milestones-drawer__section-head">
            <h4>Active milestones</h4>
            <span>{withMilestones.length}</span>
          </div>
          {withMilestones.length === 0 ? (
            <p className="milestones-drawer__empty">No milestones yet. Use the list below to attach one.</p>
          ) : (
            <ul className="milestones-drawer__list">
              {withMilestones.map((goal) => {
                const ms = goal.milestone!;
                const label = ms.label || goal.title || "Milestone";
                const range =
                  ms.type === "point"
                    ? formatDate(ms.date)
                    : `${formatDate(ms.windowStart)} → ${formatDate(ms.windowEnd)}`;
                return (
                  <li key={goal.id} className="milestones-drawer__item">
                    <div>
                      <p className="milestones-drawer__item-label">{label}</p>
                      <p className="milestones-drawer__item-meta">
                        {goal.title || "Untitled goal"} · {range}
                      </p>
                    </div>
                    <div className="milestones-drawer__item-actions">
                      <button type="button" className="btn" onClick={() => onEdit(goal)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn--danger" onClick={() => onClear(goal)}>
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="milestones-drawer__section">
          <div className="milestones-drawer__section-head">
            <h4>Add milestone</h4>
            <span>{withoutMilestones.length}</span>
          </div>
          {withoutMilestones.length === 0 ? (
            <p className="milestones-drawer__empty">Every goal already has a milestone.</p>
          ) : (
            <div className="milestones-drawer__goal-grid">
              {withoutMilestones.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  className="milestones-drawer__goal"
                  onClick={() => onEdit(goal)}
                >
                  <span className="milestones-drawer__goal-title">{goal.title || "Untitled goal"}</span>
                  <span className="milestones-drawer__goal-dates">
                    {formatDate(goal.startDate)} → {formatDate(goal.endDate)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}

