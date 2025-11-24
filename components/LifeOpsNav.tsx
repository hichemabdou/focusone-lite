"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "./ThemeContext";
import { useGoals } from "./GoalsContext";
import { ChangeEvent } from "react";
import { openCustomizationPanel } from "./customizationEvents";
import { motion, AnimatePresence } from "framer-motion";

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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
        ),
    },
    {
        id: "goals",
        label: "Goals",
        href: "/classic",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
            </svg>
        ),
    },
    {
        id: "tasks",
        label: "Tasks",
        href: "/tasks",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        id: "finances",
        label: "Finances",
        href: "/finances",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                <path d="M2 12h20" opacity="0.3" />
            </svg>
        ),
    },
    {
        id: "health",
        label: "Health",
        href: "/health",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                <path d="M12 5.5v7M8.5 9h7" opacity="0.5" />
            </svg>
        ),
    },
    {
        id: "personal-dev",
        label: "Growth",
        href: "/personal-dev",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18M3 12h18" />
                <path d="M12 3l3 3m-3-3L9 6M12 21l3-3m-3 3l-3-3M21 12l-3 3m3-3l-3-3M3 12l3 3m-3-3l3-3" />
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

    // Hide navigation on auth pages
    if (pathname?.startsWith("/auth")) {
        return null;
    }

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
                    <Link href="/dashboard" className="lifeops-nav__logo flex items-center gap-3 group">
                        {/* Animated 3D Logo - exact same as auth page, just smaller */}
                        <div style={{
                            perspective: '400px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            {/* Outer cube */}
                            <div style={{
                                position: 'absolute',
                                width: '24px',
                                height: '24px',
                                transformStyle: 'preserve-3d',
                                animation: 'rotateCube 25s linear infinite',
                            }}>
                                <div style={{ position: 'absolute', width: '24px', height: '24px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))', border: '1px solid rgba(255, 255, 255, 0.2)', transform: 'translateZ(12px)' }} />
                                <div style={{ position: 'absolute', width: '24px', height: '24px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05))', border: '1px solid rgba(255, 255, 255, 0.15)', transform: 'translateZ(-12px) rotateY(180deg)' }} />
                                <div style={{ position: 'absolute', width: '24px', height: '24px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))', border: '1px solid rgba(255, 255, 255, 0.18)', transform: 'rotateY(90deg) translateZ(12px)' }} />
                                <div style={{ position: 'absolute', width: '24px', height: '24px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))', border: '1px solid rgba(255, 255, 255, 0.15)', transform: 'rotateY(-90deg) translateZ(12px)' }} />
                                <div style={{ position: 'absolute', width: '24px', height: '24px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.1))', border: '1px solid rgba(255, 255, 255, 0.22)', transform: 'rotateX(90deg) translateZ(12px)' }} />
                                <div style={{ position: 'absolute', width: '24px', height: '24px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03))', border: '1px solid rgba(255, 255, 255, 0.12)', transform: 'rotateX(-90deg) translateZ(12px)' }} />
                            </div>

                            {/* Inner triangle - same positioning as auth */}
                            <div style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                width: '19px',
                                height: '16px',
                                marginLeft: '-9.5px',
                                marginTop: '-8px',
                                transformOrigin: 'center center',
                                animation: 'rotateTriangle 15s linear infinite',
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-2.7px',
                                    left: '0',
                                    width: 0,
                                    height: 0,
                                    borderLeft: '9.5px solid transparent',
                                    borderRight: '9.5px solid transparent',
                                    borderBottom: '16px solid rgba(255, 255, 255, 0.35)',
                                    filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.4))',
                                }} />
                            </div>

                            {/* Center sphere - exact same positioning as auth */}
                            <div style={{
                                position: 'absolute',
                                width: '4px',
                                height: '4px',
                                background: 'radial-gradient(circle, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.9))',
                                borderRadius: '50%',
                                left: '50%',
                                top: '50%',
                                marginLeft: '-1.5px', // Scaled from -3.5px (auth) to match smaller size
                                marginTop: '-1.5px',  // Scaled from -3.5px (auth) to match smaller size
                                transform: 'translate(-50%, -50%)',
                                animation: 'pulseSphere 2s ease-in-out infinite',
                                boxShadow: '0 0 6px rgba(255, 255, 255, 0.5)',
                            }} />
                        </div>

                        <div className="flex items-center gap-2">
                            <span style={{
                                fontSize: '20px',
                                fontWeight: '600',
                                color: '#ffffff',
                                letterSpacing: '-0.01em',
                            }}>Focus One</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">Lite</span>
                        </div>
                    </Link>

                    <style jsx>{`
                        @keyframes rotateCube {
                            from { transform: rotateX(0deg) rotateY(0deg); }
                            to { transform: rotateX(360deg) rotateY(360deg); }
                        }
                        @keyframes rotateTriangle {
                            from { transform: rotateZ(0deg); }
                            to { transform: rotateZ(360deg); }
                        }
                        @keyframes pulseSphere {
                            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.85; box-shadow: 0 0 6px rgba(255, 255, 255, 0.5); }
                            50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; box-shadow: 0 0 12px rgba(255, 255, 255, 0.9); }
                        }
                    `}</style>
                </div>

                <div className="lifeops-nav__sections">
                    {NAV_SECTIONS.map((section, index) => {
                        const active = isActive(section.href);
                        return (
                            <Link
                                key={section.id}
                                href={section.href}
                                className={`lifeops-nav__item ${active ? "lifeops-nav__item--active" : ""}`}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: index * 0.05,
                                        ease: [0.19, 1, 0.22, 1]
                                    }}
                                    className="lifeops-nav__item-content"
                                >
                                    {/* Icon with hover scale effect */}
                                    <motion.span
                                        className="lifeops-nav__icon"
                                        whileHover={{
                                            scale: 1.1,
                                            rotate: [0, -5, 5, 0],
                                            transition: { duration: 0.3 }
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {section.icon}
                                    </motion.span>

                                    <span className="lifeops-nav__label">{section.label}</span>

                                    {/* Active indicator with smooth animation */}
                                    <AnimatePresence>
                                        {active && (
                                            <motion.div
                                                className="lifeops-nav__active-indicator"
                                                layoutId="activeTab"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 500,
                                                    damping: 30
                                                }}
                                            />
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>

                <div className="lifeops-nav__actions">
                    <motion.button
                        className="lifeops-nav__action-btn"
                        aria-label="Search"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <motion.svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            whileHover={{ rotate: 15 }}
                            transition={{ duration: 0.2 }}
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </motion.svg>
                    </motion.button>

                    <motion.button
                        className="lifeops-nav__action-btn"
                        aria-label="Toggle theme"
                        onClick={toggleTheme}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <AnimatePresence mode="wait">
                            {theme === "dark" ? (
                                <motion.svg
                                    key="sun"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    whileHover={{ rotate: 180 }}
                                >
                                    <path d="M12 5.5V3M12 21v-2.5M5.5 12H3M21 12h-2.5M5.99 5.99 4.57 4.57M19.43 19.43l-1.41-1.41M18.01 5.99l1.42-1.42M4.57 19.43l1.41-1.41" />
                                    <circle cx="12" cy="12" r="4" />
                                </motion.svg>
                            ) : (
                                <motion.svg
                                    key="moon"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    whileHover={{ rotate: -15 }}
                                >
                                    <path d="M21 15.5A8.5 8.5 0 0 1 8.5 3a8.5 8.5 0 1 0 12.5 12.5Z" />
                                </motion.svg>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    <div className="lifeops-nav__account-settings" ref={settingsRef}>
                        <motion.button
                            type="button"
                            className={`lifeops-nav__action-btn ${toolsOpen ? "lifeops-nav__action-btn--active" : ""}`}
                            aria-label="Settings"
                            aria-expanded={toolsOpen}
                            onClick={() => setToolsOpen((prev) => !prev)}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            <motion.svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                animate={{ rotate: toolsOpen ? 90 : 0 }}
                                transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                            >
                                <path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm9 2.5a7 7 0 0 0-.2-1.7l2.2-1.7-2-3.4-2.6 1a7.2 7.2 0 0 0-2.9-1.6l-.4-2.8H9.9l-.4 2.8a7.2 7.2 0 0 0-2.9 1.6l-2.6-1-2 3.4 2.2 1.7a7 7 0 0 0 0 3.4l-2.2 1.7 2 3.4 2.6-1a7.2 7.2 0 0 0 2.9 1.6l.4 2.8h4.2l.4-2.8a7.2 7.2 0 0 0 2.9-1.6l2.6 1 2-3.4-2.2-1.7c.13-.55.2-1.12.2-1.7Z" strokeLinejoin="round" />
                            </motion.svg>
                        </motion.button>
                        <AnimatePresence>
                            {toolsOpen && (
                                <motion.div
                                    className="lifeops-nav__tools"
                                    role="menu"
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
                                >
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
                                </motion.div>
                            )}
                        </AnimatePresence>
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
