"use client";

import { motion } from "framer-motion";

// 3D cube with triangle and pulsing sphere - unique premium logo
function AnimatedLogo() {
  return (
    <div style={{
      perspective: '1000px',
      width: '72px',
      height: '72px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Outer cube - rotates smoothly */}
      <motion.div
        animate={{
          rotateX: 360,
          rotateY: 360,
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          width: '56px',
          height: '56px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Outer cube faces */}
        <div style={{ position: 'absolute', width: '56px', height: '56px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))', border: '1px solid rgba(255, 255, 255, 0.2)', transform: 'translateZ(28px)' }} />
        <div style={{ position: 'absolute', width: '56px', height: '56px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05))', border: '1px solid rgba(255, 255, 255, 0.15)', transform: 'translateZ(-28px) rotateY(180deg)' }} />
        <div style={{ position: 'absolute', width: '56px', height: '56px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))', border: '1px solid rgba(255, 255, 255, 0.18)', transform: 'rotateY(90deg) translateZ(28px)' }} />
        <div style={{ position: 'absolute', width: '56px', height: '56px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))', border: '1px solid rgba(255, 255, 255, 0.15)', transform: 'rotateY(-90deg) translateZ(28px)' }} />
        <div style={{ position: 'absolute', width: '56px', height: '56px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.1))', border: '1px solid rgba(255, 255, 255, 0.22)', transform: 'rotateX(90deg) translateZ(28px)' }} />
        <div style={{ position: 'absolute', width: '56px', height: '56px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03))', border: '1px solid rgba(255, 255, 255, 0.12)', transform: 'rotateX(-90deg) translateZ(28px)' }} />
      </motion.div>

      {/* Inner rotating triangle - spins in place at center */}
      <motion.div
        animate={{
          rotateZ: 360,
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '44px',  // Total width of triangle
          height: '38px', // Total height of triangle
          marginLeft: '-22px',  // Center horizontally: -width/2
          marginTop: '-19px',   // Center vertically: -height/2
          transformOrigin: 'center center',
        }}
      >
        {/* Triangle shape - offset so its centroid is at container center */}
        <div style={{
          position: 'absolute',
          // Triangle centroid is at 2/3 from top = 25.33px from top
          // Container center is at 19px from top
          // So shift up by: 25.33 - 19 = 6.33px
          top: '-6.33px',
          left: '0',
          width: 0,
          height: 0,
          borderLeft: '22px solid transparent',
          borderRight: '22px solid transparent',
          borderBottom: '38px solid rgba(255, 255, 255, 0.35)',
          filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))',
        }} />
      </motion.div>

      {/* Center glowing sphere - at exact center of cube */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.85, 1, 0.85],
          boxShadow: [
            '0 0 12px rgba(255, 255, 255, 0.5)',
            '0 0 25px rgba(255, 255, 255, 0.9)',
            '0 0 12px rgba(255, 255, 255, 0.5)',
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          width: '10px',
          height: '10px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.9))',
          borderRadius: '50%',
          left: '50%',
          top: '50%',
          marginLeft: '-3.5px', // Fine-tune: very slight left
          marginTop: '-3.5px',    // Fine-tune: slightly up
          transform: 'translate(-50%, -50%)',
          zIndex: 10, // Ensure sphere is on top
        }}
      />
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      overflow: 'hidden',
      background: '#0b0c0e', // Match main app
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial',
    }}>
      {/* Subtle grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
      }} />

      {/* Minimal gradient accent */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(60px)',
      }} />

      {/* Main Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '400px',
        padding: '0 24px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
        >
          {/* Clean card */}
          <div style={{
            background: 'rgba(16, 17, 20, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '48px 40px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}>
            {/* Brand Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '40px',
            }}>
              {/* 3D Animated Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '24px',
                }}
              >
                <AnimatedLogo />
              </motion.div>

              {/* Brand Name */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em',
                }}>
                  Focus One
                </h1>
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: 0,
                  fontWeight: '400',
                }}>
                  Life Operations Center
                </p>
              </motion.div>
            </div>

            {/* Auth Form */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
