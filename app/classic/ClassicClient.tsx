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
          <div className="workspace__brand-left">
            <span className="workspace__wordmark">Focus.One workspace</span>
            <nav className="workspace__nav">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "workspace__nav-btn",
                    pathname === item.href ? "is-active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
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
        <div className="workspace__account">
          {session?.user ? (
            <>
              <div className="workspace__avatar" aria-hidden>
                {session.user.image ? (
                  <img src={session.user.image} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                ) : (
                  session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="workspace__account-meta">
                <span className="workspace__account-label">{session.user.name || session.user.email}</span>
                <span className="workspace__account-status">{session.user.email}</span>
              </div>
            </>
          ) : (
            <>
              <div className="workspace__avatar" aria-hidden>FO</div>
              <div className="workspace__account-meta">
                <span className="workspace__account-label">Your account</span>
                <span className="workspace__account-status">Guest mode</span>
              </div>
            </>
          )}
          <div className="workspace__account-actions">
            <button
              type="button"
              className="workspace__icon-button workspace__theme-toggle"
              aria-label="Toggle appearance mode"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M12 5.5V3M12 21v-2.5M5.5 12H3M21 12h-2.5M5.99 5.99 4.57 4.57M19.43 19.43l-1.41-1.41M18.01 5.99l1.42-1.42M4.57 19.43l1.41-1.41" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M21 15.5A8.5 8.5 0 0 1 8.5 3a8.5 8.5 0 1 0 12.5 12.5Z" />
                </svg>
              )}
            </button>
            <div className="workspace__account-settings" ref={settingsRef}>
              <button
                type="button"
                className={["workspace__icon-button", toolsOpen ? "is-active" : ""].join(" ")}
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
                  <p className="workspace__tools-title">Control center</p>
                  <div className="workspace__tools-group">
                    <p className="workspace__tools-label">Data & backups</p>
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
                  <div className="workspace__tools-group">
                    <p className="workspace__tools-label">Customization</p>
                    <button
                      type="button"
                      className="btn w-full"
                      onClick={() => {
                        openCustomizationPanel();
                        setToolsOpen(false);
                      }}
                    >
                      Categories, priorities & statuses
                    </button>
                  </div>
                  <div className="workspace__tools-group">
                    <p className="workspace__tools-label">Appearance</p>
                    <button type="button" className="btn w-full workspace__tools-theme" onClick={toggleTheme}>
                      Switch to {theme === "light" ? "Dark" : "Light"} mode
                    </button>
                  </div>
                  <div className="workspace__tools-group">
                    <p className="workspace__tools-label">Integrations</p>
                    <button type="button" className="btn w-full" onClick={() => setIntegrationsOpen(true)}>
                      Notifications & integrations
                    </button>
                  </div>
                  <div className="workspace__tools-group">
                    <p className="workspace__tools-label">Help & Resources</p>
                    <a
                      href="https://github.com/yourusername/focusone-lite/blob/main/README.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn w-full"
                      style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}
                    >
                      Documentation
                    </a>
                    <button
                      type="button"
                      className="btn w-full"
                      onClick={() => {
                        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                        const modKey = isMac ? 'Cmd' : 'Ctrl';
                        alert(`Keyboard Shortcuts:\n\n${modKey} + K → Focus search\n${modKey} + N → Create new goal\n${modKey} + , → Open settings\n${modKey} + / → Show this help\nEsc → Close modals/panels`);
                        setToolsOpen(false);
                      }}
                    >
                      Keyboard shortcuts
                    </button>
                  </div>
                  <div className="workspace__tools-group">
                    <p className="workspace__tools-label">Account</p>
                    {session?.user ? (
                      <button
                        type="button"
                        className="btn w-full"
                        onClick={() => signOut({ callbackUrl: '/auth/login' })}
                      >
                        Sign out
                      </button>
                    ) : (
                      <Link href="/auth/login" className="btn w-full" style={{ textAlign: 'center', display: 'block' }}>
                        Sign in
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
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
