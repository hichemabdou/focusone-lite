"use client";

import { motion } from "framer-motion";

export default function VeloxLogo({ className = "w-12 h-12" }: { className?: string }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Outer Ring */}
            <motion.div
                className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner Triangle/V Shape */}
            <svg viewBox="0 0 24 24" className="w-2/3 h-2/3 text-white fill-current relative z-10 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                <path d="M12 2L2 19h20L12 2zm0 3.5L18.5 17h-13L12 5.5z" />
                <motion.path
                    d="M12 8L7 16h10L12 8z"
                    className="text-cyan-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </svg>

            {/* Glow Effect */}
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse" />
        </div>
    );
}
