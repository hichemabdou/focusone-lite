"use client";

import { motion } from "framer-motion";

export default function PrismlyLogo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer rotating ring - slow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, rgba(99, 102, 241, 0.3) 50%, transparent 100%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />

      {/* Middle rotating ring - medium */}
      <motion.div
        className="absolute inset-[8%] rounded-full"
        style={{
          background: "conic-gradient(from 180deg, transparent 0%, rgba(139, 92, 246, 0.4) 50%, transparent 100%)",
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />

      {/* Inner ring glow */}
      <motion.div
        className="absolute inset-[15%] rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-md"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Core prism - 3D geometric shape */}
      <motion.div
        className="relative z-10 w-[45%] h-[45%]"
        animate={{
          rotateY: [0, 360],
          rotateZ: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-md"
          style={{
            boxShadow: "0 0 30px rgba(139, 92, 246, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.1)",
          }}
        />

        {/* Highlight */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-md"
          style={{ transform: "translateZ(1px)" }}
        />
      </motion.div>

      {/* Orbiting particles */}
      {[0, 120, 240].map((angle, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"
          style={{
            boxShadow: "0 0 8px rgba(139, 92, 246, 0.8)",
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 8 - i,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.3,
          }}
        >
          <div
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) translateY(-${20 + i * 5}px)`,
            }}
          />
        </motion.div>
      ))}

      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.2), transparent)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}
