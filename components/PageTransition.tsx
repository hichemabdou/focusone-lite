"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * PageTransition component - Premium page transitions with modern blur and scale effects
 * Creates a natural, fluid feeling when navigating between pages
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{
          opacity: 0,
          scale: 0.98,
          filter: "blur(4px)"
        }}
        animate={{
          opacity: 1,
          scale: 1,
          filter: "blur(0px)"
        }}
        exit={{
          opacity: 0,
          scale: 0.98,
          filter: "blur(4px)"
        }}
        transition={{
          duration: 0.35,
          ease: [0.22, 0.61, 0.36, 1] // Smooth premium easing curve
        }}
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: 'center center',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
