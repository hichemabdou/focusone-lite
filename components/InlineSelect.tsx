"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = { value: string; label: string; tone?: string };

type InlineSelectProps = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

export default function InlineSelect({ value, options, onChange }: InlineSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeOption = useMemo(() => options.find((opt) => opt.value === value), [options, value]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
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
        </div>
      )}
    </div>
  );
}
