"use client";

import type { Goal } from "./GoalsContext";
import type { DomainMode } from "./FilterBar";
import VisTimeline from "./VisTimeline";

export default function Timeline({ goals, mode }: { goals: Goal[]; mode: DomainMode }) {
  return <VisTimeline goals={goals} mode={mode} />;
}
