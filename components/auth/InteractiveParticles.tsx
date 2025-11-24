"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    color: string;
}

export default function InteractiveParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        // Initialize particles
        const initParticles = () => {
            particlesRef.current = [];
            const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 100);

            for (let i = 0; i < particleCount; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;

                particlesRef.current.push({
                    x,
                    y,
                    baseX: x,
                    baseY: y,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.3 + 0.1,
                    color: Math.random() > 0.5 ? "rgba(59, 130, 246" : "rgba(168, 85, 247",
                });
            }
        };

        // Handle mouse move
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach((particle, i) => {
                // Calculate distance from mouse
                const dx = mousePos.x - particle.x;
                const dy = mousePos.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 200;

                // Mouse repulsion effect
                if (distance < maxDistance) {
                    const force = (maxDistance - distance) / maxDistance;
                    const angle = Math.atan2(dy, dx);
                    particle.x -= Math.cos(angle) * force * 3;
                    particle.y -= Math.sin(angle) * force * 3;
                } else {
                    // Return to base position
                    particle.x += (particle.baseX - particle.x) * 0.05;
                    particle.y += (particle.baseY - particle.y) * 0.05;
                }

                // Add gentle floating animation
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Bounce off edges
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `${particle.color}, ${particle.opacity})`;
                ctx.fill();

                // Draw connections
                particlesRef.current.forEach((otherParticle, j) => {
                    if (i === j) return;

                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        const opacity = (1 - distance / 120) * 0.15;
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = `rgba(100, 100, 100, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        window.addEventListener("mousemove", handleMouseMove);
        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("mousemove", handleMouseMove);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [mousePos.x, mousePos.y]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 1,
            }}
        />
    );
}
