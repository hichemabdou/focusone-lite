"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onDismiss: (id: string) => void;
}

function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(message.id);
    }, message.duration || 4000);

    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  const icons = {
    success: "✓",
    error: "✕",
    info: "i",
    warning: "⚠",
  };

  return (
    <div
      className={`toast toast--${message.type}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="toast__icon">{icons[message.type]}</span>
      <span className="toast__message">{message.message}</span>
      <button
        type="button"
        className="toast__close"
        onClick={() => onDismiss(message.id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (event: CustomEvent<Omit<ToastMessage, "id">>) => {
      const newToast: ToastMessage = {
        ...event.detail,
        id: Date.now().toString() + Math.random().toString(36).substring(7),
      };
      setToasts((prev) => [...prev, newToast]);
    };

    window.addEventListener("show-toast" as any, handleToast);
    return () => window.removeEventListener("show-toast" as any, handleToast);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

// Helper function to show toasts
export function showToast(
  message: string,
  type: ToastType = "info",
  duration?: number
) {
  window.dispatchEvent(
    new CustomEvent("show-toast", {
      detail: { message, type, duration },
    })
  );
}
