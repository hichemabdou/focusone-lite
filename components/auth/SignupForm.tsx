"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SignupForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Focus states
    const [nameFocused, setNameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push("/auth/login?registered=true");
            } else {
                setError(data.error || data.message || "Something went wrong");
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = (isFocused: boolean, hasIcon: boolean = true) => ({
        width: '100%',
        padding: hasIcon ? '14px 48px 14px 48px' : '14px 16px',
        fontSize: '15px',
        color: '#ffffff',
        background: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${isFocused ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: '12px',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.15), 0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
        fontFamily: 'inherit',
    });

    const labelStyle = {
        display: 'block',
        fontSize: '13px',
        fontWeight: '600' as const,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: '8px',
        letterSpacing: '0.01em',
    };

    return (
        <div>
            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            padding: '16px',
                            marginBottom: '24px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                        }}
                    >
                        <svg style={{ width: '20px', height: '20px', color: '#ef4444', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#ef4444', margin: 0 }}>
                            {error}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Signup Form */}
            <form onSubmit={handleSubmit}>
                {/* Name Field */}
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="name" style={labelStyle}>
                        Full name
                    </label>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                        }}>
                            <User size={20} color={nameFocused ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)'} style={{ transition: 'color 0.2s' }} />
                        </div>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onFocus={() => setNameFocused(true)}
                            onBlur={() => setNameFocused(false)}
                            style={inputStyle(nameFocused)}
                            placeholder="John Doe"
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Email Field */}
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="email" style={labelStyle}>
                        Email address
                    </label>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                        }}>
                            <Mail size={20} color={emailFocused ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)'} style={{ transition: 'color 0.2s' }} />
                        </div>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                            style={inputStyle(emailFocused)}
                            placeholder="you@example.com"
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Password Field */}
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="password" style={labelStyle}>
                        Password
                    </label>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                        }}>
                            <Lock size={20} color={passwordFocused ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)'} style={{ transition: 'color 0.2s' }} />
                        </div>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            style={inputStyle(passwordFocused)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: 'rgba(255, 255, 255, 0.5)',
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '6px', marginBottom: 0 }}>
                        Minimum 8 characters
                    </p>
                </div>

                {/* Confirm Password Field */}
                <div style={{ marginBottom: '24px' }}>
                    <label htmlFor="confirmPassword" style={labelStyle}>
                        Confirm password
                    </label>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                        }}>
                            <Lock size={20} color={confirmPasswordFocused ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)'} style={{ transition: 'color 0.2s' }} />
                        </div>
                        <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onFocus={() => setConfirmPasswordFocused(true)}
                            onBlur={() => setConfirmPasswordFocused(false)}
                            style={inputStyle(confirmPasswordFocused)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                                position: 'absolute',
                                right: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: 'rgba(255, 255, 255, 0.5)',
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '15px',
                        fontWeight: '700',
                        color: '#000000',
                        background: loading ? 'rgba(255, 255, 255, 0.5)' : 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                        fontFamily: 'inherit',
                        letterSpacing: '0.01em',
                    }}
                    onMouseEnter={(e) => {
                        if (!loading) {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    }}
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Creating account...</span>
                        </>
                    ) : (
                        "Create account"
                    )}
                </button>
            </form>

            {/* Sign In Link */}
            <div style={{
                textAlign: 'center',
                paddingTop: '24px',
            }}>
                <p style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    margin: 0,
                }}>
                    Already have an account?{" "}
                    <Link
                        href="/auth/login"
                        style={{
                            fontWeight: '600',
                            color: '#3b82f6',
                            textDecoration: 'none',
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#60a5fa'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#3b82f6'}
                    >
                        Sign in
                    </Link>
                </p>
            </div>

            <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
        </div>
    );
}
