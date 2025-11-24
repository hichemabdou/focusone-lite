import React, { memo } from 'react';
import { Goal } from './GoalsContext';

export type SpanInfo = {
  g: Goal;
  title: string;
  start: Date;
  end: Date;
  leftPct: number;
  widthPct: number;
  pixelWidth: number;
  catClass: string;
  stClass: string;
  priClass: string;
  stKey: string;
  isCompact: boolean;
  showOutside: boolean;
  statusColor: string;
  priorityBg: string;
  priorityBgStrong: string;
  rowIndex: number; // New field for layout
};

type Props = {
  span: SpanInfo;
  isSelected: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent, type: "move" | "resize-start" | "resize-end") => void;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  rowHeight: number;
  gap: number;
  topOffset?: number;
};

const TimelineBar = memo(({
  span,
  isSelected,
  isDragging,
  onMouseDown,
  onClick,
  onDoubleClick,
  onContextMenu,
  rowHeight,
  gap,
  topOffset = 0
}: Props) => {
  // Calculate top position based on row index
  const top = span.rowIndex * (rowHeight + gap) + topOffset;

  return (
    <div
      className={`timeline__bar ${span.catClass} ${span.stClass} ${span.priClass} ${isSelected ? "timeline__bar--selected" : ""} ${isDragging ? "timeline__bar--dragging" : ""}`}
      style={{
        left: `${span.leftPct}%`,
        width: `${span.widthPct}%`,
        top: `${top}px`,
        height: `${rowHeight}px`,
        position: 'absolute',
        zIndex: isSelected ? 20 : 10,
        // Custom properties for colors
        ['--bar-color' as any]: span.priorityBg,
        ['--bar-color-strong' as any]: span.priorityBgStrong,
        ['--bar-border' as any]: span.statusColor,
      }}
      onMouseDown={(e) => onMouseDown(e, "move")}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      role="button"
      tabIndex={0}
      aria-label={`${span.title} (${span.stKey})`}
    >
      {/* Left Resize Handle */}
      <div
        className="timeline__resize-handle timeline__resize-handle--start"
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown(e, "resize-start");
        }}
      />

      {/* Content */}
      <div className="timeline__bar-content">
        <span className="timeline__bar-title">{span.title}</span>
      </div>

      {/* Right Resize Handle */}
      <div
        className="timeline__resize-handle timeline__resize-handle--end"
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown(e, "resize-end");
        }}
      />

      <style jsx>{`
        .timeline__bar {
          transition: box-shadow 0.2s, transform 0.1s;
          cursor: grab;
        }
        .timeline__bar:active {
          cursor: grabbing;
        }
        .timeline__bar--dragging {
          opacity: 0.8;
          z-index: 50 !important;
          pointer-events: none; /* Let mouse events pass through to canvas for drag tracking */
        }
        .timeline__resize-handle {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 10px;
          cursor: col-resize;
          z-index: 2;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .timeline__resize-handle:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.2);
        }
        .timeline__resize-handle--start {
          left: 0;
          border-top-left-radius: 8px;
          border-bottom-left-radius: 8px;
        }
        .timeline__resize-handle--end {
          right: 0;
          border-top-right-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        .timeline__bar:hover .timeline__resize-handle {
          opacity: 0.5;
        }
        .timeline__bar-content {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          width: 100%;
          pointer-events: none; /* Let clicks pass to bar */
        }
      `}</style>
    </div>
  );
});

TimelineBar.displayName = 'TimelineBar';

export default TimelineBar;
