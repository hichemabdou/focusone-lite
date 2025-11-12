"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import GoalsList from "@/components/GoalsList";
import GoalFilters from "@/components/GoalFilters";
import Timeline from "@/components/Timeline";
import { useGoals } from "@/components/GoalsContext";

export default function ClassicClient() {
  const { goals, visibleGoals, importJson, exportJson } = useGoals();
  const activeGoals = visibleGoals ?? goals ?? [];

  const scrollToLibrary = () => {
    document.getElementById("goal-library")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const openGlobalComposer = () => window.dispatchEvent(new Event("open-goal-composer"));
  const openDashboardSoon = () => window.alert("Dashboard view is coming soon.");

  const [toolsOpen, setToolsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!toolsOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!settingsRef.current) return;
      if (!settingsRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [toolsOpen]);

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) importJson(data);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "goals.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="workspace">
      <header className="workspace__masthead">
        <div className="workspace__brand">
          <span className="workspace__wordmark">Focus.One workspace</span>
          <span className="workspace__badge">{activeGoals.length} intentions tracked</span>
        </div>
        <div className="workspace__account">
          <div className="workspace__account-meta">
            <span className="workspace__account-label">Your account</span>
            <span className="workspace__account-status">Single-user mode</span>
          </div>
          <div className="workspace__avatar">FO</div>
          <div className="workspace__account-settings" ref={settingsRef}>
            <button
              type="button"
              className={["btn", "btn--icon", toolsOpen ? "is-active" : ""].join(" ")}
              aria-label="Workspace settings"
              aria-expanded={toolsOpen}
              onClick={() => setToolsOpen((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
                <path
                  d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm9 2.5a7 7 0 0 0-.2-1.7l2.2-1.7-2-3.4-2.6 1a7.2 7.2 0 0 0-2.9-1.6l-.4-2.8H9.9l-.4 2.8a7.2 7.2 0 0 0-2.9 1.6l-2.6-1-2 3.4 2.2 1.7a7 7 0 0 0 0 3.4l-2.2 1.7 2 3.4 2.6-1a7.2 7.2 0 0 0 2.9 1.6l.4 2.8h4.2l.4-2.8a7.2 7.2 0 0 0 2.9-1.6l2.6 1 2-3.4-2.2-1.7c.13-.55.2-1.12.2-1.7Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {toolsOpen && (
              <div className="workspace__tools" role="menu">
                <p className="workspace__tools-title">Workspace controls</p>
                <div className="workspace__tools-row">
                  <label className="btn workspace__tools-import">
                    Import
                    <input type="file" accept="application/json" onChange={handleImport} disabled={busy} />
                  </label>
                  <button type="button" className="btn w-full" disabled={busy} onClick={handleExport}>
                    Export
                  </button>
                </div>
                <p className="workspace__tools-hint">Use JSON backups to move goals between accounts later.</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="workspace__layout">
        <aside className="workspace__sidebar">
          <GoalFilters onJumpToLibrary={scrollToLibrary} />
        </aside>

        <div className="workspace__main">
          <section className="workspace__panel workspace__panel--timeline">
            <div className="workspace__panel-head">
              <p className="workspace__eyebrow">Timeline</p>
              <div className="workspace__panel-actions">
                <button type="button" className="btn" onClick={openDashboardSoon}>
                  Dashboard view
                </button>
                <button type="button" className="btn btn--primary" onClick={openGlobalComposer}>
                  + Add goal
                </button>
              </div>
            </div>
            <Timeline />
          </section>

          <section id="goal-library" className="workspace__panel workspace__panel--library">
            <div className="workspace__panel-head" aria-label="Goal library" />
            <GoalsList />
          </section>
        </div>
      </div>
    </div>
  );
}
