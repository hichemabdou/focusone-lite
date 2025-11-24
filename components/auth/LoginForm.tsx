"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (registered === "true") {
      const timer = setTimeout(() => {
        router.replace("/auth/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [registered, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/classic");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    signIn("google", { callbackUrl: "/classic" });
  };

  const inputStyle = (isFocused: boolean) => ({
    width: '100%',
    padding: '14px 16px 14px 48px',
    fontSize: '15px',
    color: '#ffffff',
    background: '#1A1A1A',
    border: `1px solid ${isFocused ? '#3A3A3A' : '#2A2A2A'}`,
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
    fontFamily: 'inherit',
  });

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500' as const,
    color: '#888888',
    marginBottom: '8px',
  };

  return (
    <div>
      {/* Success Message */}
      <AnimatePresence>
        {registered === "true" && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              padding: '16px',
              marginBottom: '24px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <svg style={{ width: '20px', height: '20px', color: '#10b981', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#10b981', margin: 0 }}>
              Account created successfully! You can now sign in.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
              border: '1px solid rgba(239, 68, 68, 0.2)',
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

      {/* Login Form */}
      <form onSubmit={handleSubmit}>
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
              <Mail size={20} color={emailFocused ? '#888888' : '#666666'} style={{ transition: 'color 0.2s' }} />
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
              disabled={loading || googleLoading}
            />
          </div>
        </div>

        {/* Password Field */}
        <div style={{ marginBottom: '16px' }}>
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
              <Lock size={20} color={passwordFocused ? '#888888' : '#666666'} style={{ transition: 'color 0.2s' }} />
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              style={inputStyle(passwordFocused)}
              placeholder="Enter your password"
              required
              disabled={loading || googleLoading}
            />
          </div>
        </div>

        {/* Forgot Password */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '24px',
        }}>
          <Link
            href="#"
            style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#888888',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#888888'}
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || googleLoading}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#000000',
            background: loading ? '#cccccc' : '#ffffff',
            border: 'none',
            borderRadius: '12px',
            cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            if (!loading && !googleLoading) {
              e.currentTarget.style.background = '#f0f0f0';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = loading ? '#cccccc' : '#ffffff';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
          }}
        >
          {loading ? (
            <>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Signing in...</span>
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      {/* Divider */}
      <div style={{
        position: 'relative',
        margin: '32px 0',
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '1px',
          background: '#2A2A2A',
        }} />
        <div style={{
          position: 'relative',
          textAlign: 'center',
        }}>
          <span style={{
            background: '#0A0A0A',
            padding: '0 16px',
            fontSize: '12px',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            color: '#666666',
            fontWeight: '500',
          }}>
            or continue with
          </span>
        </div>
      </div>

      {/* Google Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '15px',
          fontWeight: '500',
          color: '#ffffff',
          background: googleLoading ? '#2A2A2A' : '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '12px',
          cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px',
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => {
          if (!loading && !googleLoading) {
            e.currentTarget.style.background = '#222222';
            e.currentTarget.style.borderColor = '#3A3A3A';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = googleLoading ? '#2A2A2A' : '#1A1A1A';
          e.currentTarget.style.borderColor = '#2A2A2A';
        }}
      >
        {googleLoading ? (
          <>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>

      {/* Sign Up Link */}
      <div style={{
        textAlign: 'center',
        paddingTop: '8px',
      }}>
        <p style={{
          fontSize: '14px',
          color: '#888888',
          margin: 0,
        }}>
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            style={{
              fontWeight: '600',
              color: '#ffffff',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#cccccc'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#ffffff'}
          >
            Sign up
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
          color: #666666;
        }
      `}</style>
    </div>
  );
}
