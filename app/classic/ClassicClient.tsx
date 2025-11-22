"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import GoalsList from "@/components/GoalsList";
import GoalFilters from "@/components/GoalFilters";
import Timeline from "@/components/Timeline";
import { useGoals } from "@/components/GoalsContext";
import { useTheme } from "@/components/ThemeContext";
import IntegrationsModal from "@/components/IntegrationsModal";
import CustomizationPanel from "@/components/CustomizationPanel";
import { openCustomizationPanel } from "@/components/customizationEvents";

// Helper function to get user initials
function getUserInitials(name: string): string {
  if (!name) return 'U';

  // If it's an email, use the first letter
  if (name.includes('@')) {
    return name.charAt(0).toUpperCase();
  }

  // Split by space and get first letter of each word (up to 2)
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
}

// Helper function to generate a deterministic color from a string
function generateAvatarColor(str: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate two colors for gradient
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 60) % 360;

  const saturation = 65;
  const lightness1 = 55;
  const lightness2 = 45;

  return `hsl(${hue1}, ${saturation}%, ${lightness1}%), hsl(${hue2}, ${saturation}%, ${lightness2}%)`;
}

export default function ClassicClient() {
  const { data: session } = useSession();
  const { importJson, exportJson, filters, setFilters } = useGoals();
  const { theme, toggleTheme } = useTheme();

  const openGlobalComposer = () => window.dispatchEvent(new Event("open-goal-composer"));
  const [toolsOpen, setToolsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const navItems = [
    { href: "/classic", label: "Workspace" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/review", label: "Quarterly review" },
  ];

  useEffect(() => {
    if (!toolsOpen) return;
    const handleClick = (event: globalThis.MouseEvent) => {
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
          <div className="workspace__search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search goals..."
              value={filters.query}
              onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
            />
          </div>
        </div>
      </header>

      <div className="workspace__layout">
        <aside className="workspace__sidebar">
          <GoalFilters />
        </aside>

        <div className="workspace__main">
          <section className="workspace__panel workspace__panel--timeline">
            <div className="workspace__panel-head">
              <p className="workspace__eyebrow">Timeline</p>
              <div className="workspace__panel-actions">
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

      <IntegrationsModal open={integrationsOpen} onClose={() => setIntegrationsOpen(false)} />
      <CustomizationPanel renderTrigger={() => null} />
    </div>
  );
}
