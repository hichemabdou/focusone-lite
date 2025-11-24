import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            animation: {
                "spin-slow": "spin 20s linear infinite",
                "fade-in": "fadeIn 0.5s ease-out",
                "slide-up": "slideUp 0.5s ease-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
            boxShadow: {
                "input-focus": "0 0 0 3px rgba(59, 130, 246, 0.1)",
                "button-hover": "0 4px 12px rgba(0, 0, 0, 0.15)",
                "glow": "0 0 20px rgba(255, 255, 255, 0.05)",
            },
            colors: {
                auth: {
                    bg: "#0A0A0A",
                    card: "#111111",
                    input: "#1A1A1A",
                    border: "#2A2A2A",
                    "border-focus": "#3A3A3A",
                    text: "#E5E5E5",
                    "text-muted": "#888888",
                    "text-subtle": "#666666",
                },
            },
        },
    },
    plugins: [],
};
export default config;
// Force rebuild

