import React, { useState, useEffect, useRef } from 'react';
import { Goal, Priority, Status } from './GoalsContext';
import { useCustomization } from './CustomizationContext';

type Props = {
    goal?: Goal; // Optional for bulk mode
    selectedCount?: number; // For bulk mode
    onUpdate: (updates: Partial<Goal>) => void;
    onDelete: () => void;
    onOpenFull: () => void;
    position: { x: number; y: number; width: number };
};

export default function GoalActionToolbar({ goal, selectedCount = 1, onUpdate, onDelete, onOpenFull, position }: Props) {
    const { getStatusColor, getPriorityColor, statuses, priorities } = useCustomization();
    const [title, setTitle] = useState(goal?.title || "");
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync local state if goal changes externally
    useEffect(() => {
        if (goal) {
            setTitle(goal.title);
        }
    }, [goal?.title]);

    // Auto-focus input if title is empty (newly created goal)
    useEffect(() => {
        if (goal && !goal.title && inputRef.current) {
            inputRef.current.focus();
        }
    }, [goal?.title]);

    const handleTitleSubmit = () => {
        if (goal && title !== goal.title) {
            onUpdate({ title });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleTitleSubmit();
            inputRef.current?.blur();
        }
    };



    // Bulk Mode View
    if (selectedCount > 1) {
        return (
            <div
                className="goal-toolbar"
                style={{
                    left: position.x + position.width / 2,
                    top: position.y - 8, // Position above
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="goal-toolbar__row">
                    <span className="goal-toolbar__label">{selectedCount} items selected</span>
                    <div className="goal-toolbar__divider" />
                    <button
                        className="goal-toolbar__btn goal-toolbar__btn--danger"
                        onClick={onDelete}
                        title="Delete Selected Goals"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span style={{ marginLeft: 4, fontSize: 12 }}>Delete All</span>
                    </button>
                </div>
                <style jsx>{`
          .goal-toolbar {
            position: absolute; /* Changed to absolute */
            transform: translate(-50%, -100%);
            background: #1a1a1a;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 4px 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            z-index: 1000;
            animation: toolbar-pop 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            white-space: nowrap;
          }
          @keyframes toolbar-pop {
            from { opacity: 0; transform: translate(-50%, -90%) scale(0.95); }
            to { opacity: 1; transform: translate(-50%, -100%) scale(1); }
          }
          .goal-toolbar__row { display: flex; align-items: center; gap: 8px; }
          .goal-toolbar__label { font-size: 13px; color: #fff; font-weight: 500; }
          .goal-toolbar__divider { width: 1px; height: 16px; background: rgba(255, 255, 255, 0.1); }
          .goal-toolbar__btn {
            display: flex; align-items: center; justify-content: center;
            background: transparent; border: none; color: rgba(255, 255, 255, 0.6);
            border-radius: 4px; cursor: pointer; transition: all 0.2s; padding: 4px 6px;
          }
          .goal-toolbar__btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
          .goal-toolbar__btn--danger:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        `}</style>
            </div>
        );
    }

    if (!goal) return null;

    return (
        <div
            className="goal-toolbar"
            style={{
                left: position.x + position.width / 2,
                top: position.y - 8, // Position above
            }}
            onClick={(e) => e.stopPropagation()} // Prevent deselecting
        >
            <div className="goal-toolbar__row">
                <input
                    ref={inputRef}
                    type="text"
                    className="goal-toolbar__input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleSubmit}
                    onKeyDown={handleKeyDown}
                    placeholder="Goal title..."
                />
                <div className="goal-toolbar__divider" />

                {/* Status Picker */}
                <div className="goal-toolbar__picker">
                    <div
                        className="goal-toolbar__dot"
                        style={{ backgroundColor: getStatusColor(goal.status) }}
                        title={`Status: ${goal.status}`}
                    />
                    <select
                        className="goal-toolbar__select"
                        value={goal.status}
                        onChange={(e) => onUpdate({ status: e.target.value as Status })}
                    >
                        {statuses.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {/* Priority Picker */}
                <div className="goal-toolbar__picker">
                    <div
                        className="goal-toolbar__priority-icon"
                        style={{ color: getPriorityColor(goal.priority) }}
                        title={`Priority: ${goal.priority}`}
                    >
                        {/* Simple Priority Icon */}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 22h20L12 2zm0 3.5L18.5 20H5.5L12 5.5z" />
                        </svg>
                    </div>
                    <select
                        className="goal-toolbar__select"
                        value={goal.priority}
                        onChange={(e) => onUpdate({ priority: e.target.value as Priority })}
                    >
                        {priorities.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="goal-toolbar__divider" />

                <button
                    className="goal-toolbar__btn goal-toolbar__btn--icon"
                    onClick={onOpenFull}
                    title="Open Full Editor"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>

                <button
                    className="goal-toolbar__btn goal-toolbar__btn--danger"
                    onClick={onDelete}
                    title="Delete Goal"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                </button>
            </div>

            <style jsx>{`
        .goal-toolbar {
          position: absolute;
          transform: translate(-50%, -100%);
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 4px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          z-index: 1000;
          animation: toolbar-pop 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes toolbar-pop {
          from { opacity: 0; transform: translate(-50%, -90%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -100%) scale(1); }
        }
        .goal-toolbar__row {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .goal-toolbar__input {
          background: transparent;
          border: none;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          padding: 4px 8px;
          outline: none;
          min-width: 120px;
          border-radius: 4px;
        }
        .goal-toolbar__input:focus {
          background: rgba(255, 255, 255, 0.05);
        }
        .goal-toolbar__divider {
          width: 1px;
          height: 16px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0 2px;
        }
        .goal-toolbar__picker {
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          cursor: pointer;
        }
        .goal-toolbar__picker:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .goal-toolbar__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .goal-toolbar__select {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        .goal-toolbar__btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .goal-toolbar__btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .goal-toolbar__btn--danger:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
      `}</style>
        </div>
    );
}
