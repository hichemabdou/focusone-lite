"use client";

import { motion } from "framer-motion";

export default function LuminaLogo({ className = "w-12 h-12" }: { className?: string }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Outer Ring */}
            <motion.div
                className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            {/* Middle Ring */}
            <motion.div
                className="absolute inset-2 rounded-full border-2 border-indigo-500/50"
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />

            {/* Core Prism */}
            <motion.div
                className="relative z-10 w-1/2 h-1/2 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                animate={{
                    rotate: [0, 45, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Glow Effect */}
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse" />
        </div>
    );
}
