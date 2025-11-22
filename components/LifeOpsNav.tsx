"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "./ThemeContext";
import { useGoals } from "./GoalsContext";
import { ChangeEvent } from "react";
import { openCustomizationPanel } from "./customizationEvents";

type NavSection = {
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
};

const NAV_SECTIONS: NavSection[] = [
    {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
            </svg>
        ),
    },
    {
        id: "goals",
        label: "Goals",
        href: "/classic",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M2 12h20" />
                <circle cx="12" cy="12" r="9" />
            </svg>
        ),
    },
    {
        id: "tasks",
        label: "Tasks",
        href: "/tasks",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
        ),
    },
    {
        id: "finances",
        label: "Finances",
        href: "/finances",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
    },
    {
        id: "health",
        label: "Health",
        href: "/health",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        ),
    },
    {
        id: "personal-dev",
        label: "Growth",
        href: "/personal-dev",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
    },
];

// Helper function to get user initials
function getUserInitials(name: string): string {
    if (!name) return 'U';
    if (name.includes('@')) {
        return name.charAt(0).toUpperCase();
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
}

// Helper function to generate a deterministic color from a string
function generateAvatarColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 60) % 360;
    const saturation = 65;
    const lightness1 = 55;
    const lightness2 = 45;
    return `hsl(${hue1}, ${saturation}%, ${lightness1}%), hsl(${hue2}, ${saturation}%, ${lightness2}%)`;
}

export default function LifeOpsNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { theme, toggleTheme } = useTheme();
    const { importJson, exportJson } = useGoals();
    const [toolsOpen, setToolsOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const settingsRef = useRef<HTMLDivElement | null>(null);

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === href;
        return pathname?.startsWith(href);
    };

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
        <nav className="lifeops-nav">
            <div className="lifeops-nav__container">
                <div className="lifeops-nav__brand">
                    <Link href="/dashboard" className="lifeops-nav__logo">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M12 2L2 7L12 12L22 7L12 2Z"
                                fill="url(#logo-gradient)"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M2 17L12 22L22 17"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M2 12L12 17L22 12"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <defs>
                                <linearGradient id="logo-gradient" x1="2" y1="2" x2="22" y2="12">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#2563eb" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="lifeops-nav__brand-text">Life Ops</span>
                    </Link>
                </div>

                <div className="lifeops-nav__sections">
                    {NAV_SECTIONS.map((section) => (
                        <Link
                            key={section.id}
                            href={section.href}
                            className={`lifeops-nav__item ${isActive(section.href) ? "lifeops-nav__item--active" : ""
                                }`}
                        >
                            <span className="lifeops-nav__icon">{section.icon}</span>
                            <span className="lifeops-nav__label">{section.label}</span>
                        </Link>
                    ))}
                </div>

                <div className="lifeops-nav__actions">
                    <button className="lifeops-nav__action-btn" aria-label="Search">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                    </button>

                    <button
                        className="lifeops-nav__action-btn"
                        aria-label="Toggle theme"
                        onClick={toggleTheme}
                    >
                        {theme === "dark" ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5.5V3M12 21v-2.5M5.5 12H3M21 12h-2.5M5.99 5.99 4.57 4.57M19.43 19.43l-1.41-1.41M18.01 5.99l1.42-1.42M4.57 19.43l1.41-1.41" />
                                <circle cx="12" cy="12" r="4" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15.5A8.5 8.5 0 0 1 8.5 3a8.5 8.5 0 1 0 12.5 12.5Z" />
                            </svg>
                        )}
                    </button>

                    <div className="lifeops-nav__account-settings" ref={settingsRef}>
                        <button
                            type="button"
                            className={`lifeops-nav__action-btn ${toolsOpen ? "lifeops-nav__action-btn--active" : ""}`}
                            aria-label="Settings"
                            aria-expanded={toolsOpen}
                            onClick={() => setToolsOpen((prev) => !prev)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm9 2.5a7 7 0 0 0-.2-1.7l2.2-1.7-2-3.4-2.6 1a7.2 7.2 0 0 0-2.9-1.6l-.4-2.8H9.9l-.4 2.8a7.2 7.2 0 0 0-2.9 1.6l-2.6-1-2 3.4 2.2 1.7a7 7 0 0 0 0 3.4l-2.2 1.7 2 3.4 2.6-1a7.2 7.2 0 0 0 2.9 1.6l.4 2.8h4.2l.4-2.8a7.2 7.2 0 0 0 2.9-1.6l2.6 1 2-3.4-2.2-1.7c.13-.55.2-1.12.2-1.7Z" strokeLinejoin="round" />
                            </svg>
                        </button>
                        {toolsOpen && (
                            <div className="lifeops-nav__tools" role="menu">
                                <p className="lifeops-nav__tools-title">Control Center</p>

                                <div className="lifeops-nav__tools-group">
                                    <div className="lifeops-nav__tools-row lifeops-nav__tools-row--compact">
                                        <label className="lifeops-nav__tools-action">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                                            </svg>
                                            <span>Import</span>
                                            <input type="file" accept="application/json" onChange={handleImport} disabled={busy} />
                                        </label>
                                        <button type="button" className="lifeops-nav__tools-action" disabled={busy} onClick={handleExport}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                                            </svg>
                                            <span>Export</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="lifeops-nav__tools-group">
                                    <button
                                        type="button"
                                        className="lifeops-nav__tools-item"
                                        onClick={() => {
                                            openCustomizationPanel("categories");
                                            setToolsOpen(false);
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                                        </svg>
                                        <span>Customize categories & statuses</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="lifeops-nav__tools-item"
                                        onClick={() => {
                                            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                                            const modKey = isMac ? 'Cmd' : 'Ctrl';
                                            alert(`Keyboard Shortcuts:\n\n${modKey} + K → Focus search\n${modKey} + N → Create new goal\n${modKey} + , → Open settings\n${modKey} + / → Show this help\nEsc → Close modals/panels`);
                                            setToolsOpen(false);
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h12" />
                                        </svg>
                                        <span>Keyboard shortcuts</span>
                                    </button>
                                </div>

                                {session?.user ? (
                                    <div className="lifeops-nav__tools-group">
                                        <button
                                            type="button"
                                            className="lifeops-nav__tools-item lifeops-nav__tools-item--danger"
                                            onClick={() => signOut({ callbackUrl: '/auth/login' })}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                                            </svg>
                                            <span>Sign out</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="lifeops-nav__tools-group">
                                        <Link href="/auth/login" className="lifeops-nav__tools-item">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                                            </svg>
                                            <span>Sign in</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {session?.user ? (
                        <div
                            className="lifeops-nav__avatar"
                            style={session.user.image ? {} : {
                                background: `linear-gradient(135deg, ${generateAvatarColor(session.user.name || session.user.email || 'User')})`,
                            }}
                        >
                            {session.user.image ? (
                                <img src={session.user.image} alt={session.user.name || 'User'} />
                            ) : (
                                getUserInitials(session.user.name || session.user.email || 'User')
                            )}
                        </div>
                    ) : (
                        <Link href="/auth/login" className="lifeops-nav__avatar">
                            FO
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
