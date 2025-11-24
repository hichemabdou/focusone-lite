"use client";

import { motion } from "framer-motion";

export default function VyloLogo({ className = "w-12 h-12" }: { className?: string }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Outer glow */}
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />

            {/* Rotating rings */}
            <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                <div className="w-full h-full rounded-full border border-indigo-500/30" />
            </motion.div>

            <motion.div
                className="absolute inset-2"
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
                <div className="w-full h-full rounded-full border border-purple-500/20" />
            </motion.div>

            {/* V shape with gradient */}
            <svg
                viewBox="0 0 100 100"
                className="w-3/5 h-3/5 relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]"
            >
                <defs>
                    <linearGradient id="vylo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                </defs>

                {/* V shape */}
                <motion.path
                    d="M 20 20 L 50 75 L 80 20"
                    stroke="url(#vylo-gradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                {/* Flow lines */}
                <motion.path
                    d="M 25 25 Q 40 40, 50 70"
                    stroke="rgba(99, 102, 241, 0.4)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 1, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                <motion.path
                    d="M 75 25 Q 60 40, 50 70"
                    stroke="rgba(139, 92, 246, 0.4)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 1, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />
            </svg>

            {/* Particle dots */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-indigo-400 rounded-full"
                    style={{
                        left: "50%",
                        top: "50%",
                    }}
                    animate={{
                        x: [0, Math.cos((i / 6) * Math.PI * 2) * 30],
                        y: [0, Math.sin((i / 6) * Math.PI * 2) * 30],
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeOut",
                    }}
                />
            ))}
        </div>
    );
}
