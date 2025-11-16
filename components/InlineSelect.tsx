"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QuickAddModal from "./QuickAddModal";

type Option = { value: string; label: string; tone?: string };

type InlineSelectProps = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  addLabel?: string;
  onAdd?: () => void;
  quickAddType?: "category" | "priority" | "status";
  onQuickAdd?: (name: string, color: string) => void;
};

export default function InlineSelect({ value, options, onChange, addLabel, onAdd, quickAddType, onQuickAdd }: InlineSelectProps) {
  const [open, setOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeOption = useMemo(() => options.find((opt) => opt.value === value), [options, value]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: globalThis.MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const buttonClasses = [
    "inline-select__chip",
    "chip",
    "chip--interactive",
    activeOption?.tone ? `chip--${activeOption.tone}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={["inline-select", open ? "is-open" : ""].join(" ")} ref={wrapperRef}>
      <button
        type="button"
        className="inline-select__button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <span className={buttonClasses}>
          <span>{activeOption?.label ?? value}</span>
          <svg width="8" height="5" viewBox="0 0 8 5" aria-hidden focusable="false">
            <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="inline-select__menu" role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={[
                "inline-select__option",
                "chip",
                "chip--interactive",
                option.tone ? `chip--${option.tone}` : "",
                option.value === value ? "is-active" : "",
              ].join(" ")}
              onClick={(event) => {
                event.stopPropagation();
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
          {onAdd && (
            <button
              type="button"
              className="inline-select__option inline-select__option--add"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                if (quickAddType && onQuickAdd) {
                  // Use quick add modal
                  setTimeout(() => setShowQuickAdd(true), 100);
                } else {
                  // Fallback to settings panel
                  setTimeout(() => onAdd(), 100);
                }
              }}
              title={quickAddType ? "Quick add" : "Open customization settings"}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: "6px" }}>
                <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {addLabel ?? "Add option"}
            </button>
          )}
        </div>
      )}
      {quickAddType && onQuickAdd && (
        <QuickAddModal
          type={quickAddType}
          open={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          onAdd={(name, color) => {
            onQuickAdd(name, color);
            setShowQuickAdd(false);
          }}
        />
      )}
    </div>
  );
}
