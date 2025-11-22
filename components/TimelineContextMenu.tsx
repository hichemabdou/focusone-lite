"use client";

import React, { useEffect, useRef } from "react";
import { Goal, Priority, Status } from "./GoalsContext";
import { useCustomization } from "./CustomizationContext";

type Props = {
  x: number;
  y: number;
  goal: Goal;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onStatusChange: (status: Status) => void;
  onPriorityChange: (priority: Priority) => void;
  selectedCount?: number;
  onDeleteMultiple?: () => void;
};

export default function TimelineContextMenu({
  x,
  y,
  goal,
  onClose,
  onDelete,
  onEdit,
  onStatusChange,
  onPriorityChange,
  selectedCount = 0,
  onDeleteMultiple,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { getStatusColor, getPriorityColor } = useCustomization();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport
  const style: React.CSSProperties = {
    position: "fixed",
    left: x,
    top: y,
    zIndex: 1000,
  };

  // Simple adjustment to prevent going off-screen (can be improved with useLayoutEffect)
  // For now, we'll trust the initial click position is reasonably safe or CSS will handle basic constraints if we used a portal, 
  // but here we are just rendering it fixed.

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="context-menu__header">
        <span className="context-menu__title">{goal.title || "Untitled"}</span>
      </div>

      <div className="context-menu__group">
        {selectedCount > 1 ? (
          <button className="context-menu__item context-menu__item--danger" onClick={onDeleteMultiple}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete {selectedCount} goals
          </button>
        ) : (
          <>
            <button className="context-menu__item" onClick={onEdit}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit details
            </button>
            <button className="context-menu__item context-menu__item--danger" onClick={onDelete}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete goal
            </button>
          </>
        )}
      </div>

      <div className="context-menu__divider" />

      <div className="context-menu__group">
        <div className="context-menu__label">Status</div>
        <div className="context-menu__grid">
          {(["open", "in-progress", "blocked", "done"] as Status[]).map((s) => (
            <button
              key={s}
              className={`context-menu__chip ${goal.status === s ? "is-active" : ""}`}
              onClick={() => onStatusChange(s)}
              style={{
                "--chip-color": getStatusColor(s === "in-progress" ? "inprog" : s)
              } as React.CSSProperties}
            >
              {s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="context-menu__group">
        <div className="context-menu__label">Priority</div>
        <div className="context-menu__grid">
          {(["low", "medium", "high", "critical"] as Priority[]).map((p) => (
            <button
              key={p}
              className={`context-menu__chip ${goal.priority === p ? "is-active" : ""}`}
              onClick={() => onPriorityChange(p)}
              style={{
                "--chip-color": getPriorityColor(p)
              } as React.CSSProperties}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .context-menu {
          background: var(--bg-surface, #1e1e1e);
          border: 1px solid var(--border-subtle, rgba(255,255,255,0.1));
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05);
          padding: 6px;
          min-width: 220px;
          animation: menu-in 0.1s ease-out;
          color: var(--fg-primary, #fff);
        }
        @keyframes menu-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .context-menu__header {
          padding: 8px 10px;
          border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.1));
          margin-bottom: 4px;
        }
        .context-menu__title {
          font-size: 13px;
          font-weight: 600;
          color: var(--fg-secondary, rgba(255,255,255,0.7));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
          max-width: 200px;
        }
        .context-menu__group {
          padding: 4px 0;
        }
        .context-menu__item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 10px;
          border: none;
          background: none;
          color: var(--fg-primary, #fff);
          font-size: 13px;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.1s;
          text-align: left;
        }
        .context-menu__item:hover {
          background: var(--bg-hover, rgba(255,255,255,0.1));
        }
        .context-menu__item--danger {
          color: #ff6b6b;
        }
        .context-menu__item--danger:hover {
          background: rgba(255, 107, 107, 0.1);
        }
        .context-menu__divider {
          height: 1px;
          background: var(--border-subtle, rgba(255,255,255,0.1));
          margin: 4px 0;
        }
        .context-menu__label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--fg-tertiary, rgba(255,255,255,0.4));
          padding: 4px 10px;
          margin-bottom: 4px;
        }
        .context-menu__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          padding: 0 4px;
        }
        .context-menu__chip {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 8px;
          border: 1px solid transparent;
          background: rgba(255,255,255,0.03);
          color: var(--fg-secondary, rgba(255,255,255,0.7));
          font-size: 11px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.1s;
        }
        .context-menu__chip:hover {
          background: rgba(255,255,255,0.08);
        }
        .context-menu__chip.is-active {
          background: var(--chip-color);
          color: #000;
          font-weight: 600;
          border-color: rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
