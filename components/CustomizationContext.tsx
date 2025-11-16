"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type CustomCategory = {
  id: string;
  name: string;
  color: string;
};

export type CustomPriority = {
  id: string;
  name: string;
  color: string;
};

export type CustomStatus = {
  id: string;
  name: string;
  color: string;
};

type CustomizationState = {
  categories: CustomCategory[];
  priorities: CustomPriority[];
  statuses: CustomStatus[];
};

const STORAGE_KEY = "focusone_customization_v1";

// Default values
const DEFAULT_CATEGORIES: CustomCategory[] = [
  { id: "strategy", name: "STRATEGY", color: "#3b82f6" },
  { id: "vision", name: "VISION", color: "#a855f7" },
  { id: "tactical", name: "TACTICAL", color: "#14b8a6" },
  { id: "project", name: "PROJECT", color: "#f97316" },
  { id: "daily", name: "DAILY", color: "#facc15" },
];

const DEFAULT_PRIORITIES: CustomPriority[] = [
  { id: "low", name: "low", color: "#94a3b8" },
  { id: "medium", name: "medium", color: "#60a5fa" },
  { id: "high", name: "high", color: "#facc15" },
  { id: "critical", name: "critical", color: "#fb7185" },
];

const DEFAULT_STATUSES: CustomStatus[] = [
  { id: "open", name: "open", color: "#38bdf8" },
  { id: "in-progress", name: "in-progress", color: "#fbbf24" },
  { id: "blocked", name: "blocked", color: "#f87171" },
  { id: "done", name: "done", color: "#22c55e" },
];

function load(): CustomizationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        categories: DEFAULT_CATEGORIES,
        priorities: DEFAULT_PRIORITIES,
        statuses: DEFAULT_STATUSES,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      categories: parsed.categories || DEFAULT_CATEGORIES,
      priorities: parsed.priorities || DEFAULT_PRIORITIES,
      statuses: parsed.statuses || DEFAULT_STATUSES,
    };
  } catch {
    return {
      categories: DEFAULT_CATEGORIES,
      priorities: DEFAULT_PRIORITIES,
      statuses: DEFAULT_STATUSES,
    };
  }
}

function persist(state: CustomizationState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

type CustomizationContextType = {
  categories: CustomCategory[];
  priorities: CustomPriority[];
  statuses: CustomStatus[];
  getCategoryColor: (name: string) => string;
  getPriorityColor: (name: string) => string;
  getStatusColor: (name: string) => string;
  addCategory: (name: string, color: string) => void;
  updateCategory: (id: string, updates: Partial<CustomCategory>) => void;
  deleteCategory: (id: string) => void;
  updatePriority: (id: string, color: string) => void;
  updateStatus: (id: string, color: string) => void;
  resetToDefaults: () => void;
};

const CustomizationContext = createContext<CustomizationContextType | null>(null);

export function CustomizationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CustomizationState>(() => load());

  useEffect(() => {
    persist(state);
  }, [state]);

  const getCategoryColor = (name: string): string => {
    const category = state.categories.find((c) => c.name.toUpperCase() === name.toUpperCase());
    return category?.color || DEFAULT_CATEGORIES[0].color;
  };

  const getPriorityColor = (name: string): string => {
    const priority = state.priorities.find((p) => p.name === name);
    return priority?.color || DEFAULT_PRIORITIES[0].color;
  };

  const getStatusColor = (name: string): string => {
    const status = state.statuses.find((s) => s.name === name || (name === "inprog" && s.name === "in-progress"));
    return status?.color || DEFAULT_STATUSES[0].color;
  };

  const addCategory = (name: string, color: string) => {
    const newCategory: CustomCategory = {
      id: `cat-${Date.now()}`,
      name: name.toUpperCase(),
      color,
    };
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }));
  };

  const updateCategory = (id: string, updates: Partial<CustomCategory>) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)),
    }));
  };

  const deleteCategory = (id: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat.id !== id),
    }));
  };

  const updatePriority = (id: string, color: string) => {
    setState((prev) => ({
      ...prev,
      priorities: prev.priorities.map((p) => (p.id === id ? { ...p, color } : p)),
    }));
  };

  const updateStatus = (id: string, color: string) => {
    setState((prev) => ({
      ...prev,
      statuses: prev.statuses.map((s) => (s.id === id ? { ...s, color } : s)),
    }));
  };

  const resetToDefaults = () => {
    setState({
      categories: DEFAULT_CATEGORIES,
      priorities: DEFAULT_PRIORITIES,
      statuses: DEFAULT_STATUSES,
    });
  };

  const value: CustomizationContextType = {
    categories: state.categories,
    priorities: state.priorities,
    statuses: state.statuses,
    getCategoryColor,
    getPriorityColor,
    getStatusColor,
    addCategory,
    updateCategory,
    deleteCategory,
    updatePriority,
    updateStatus,
    resetToDefaults,
  };

  return <CustomizationContext.Provider value={value}>{children}</CustomizationContext.Provider>;
}

export function useCustomization() {
  const ctx = useContext(CustomizationContext);
  if (!ctx) throw new Error("useCustomization must be inside CustomizationProvider");
  return ctx;
}

