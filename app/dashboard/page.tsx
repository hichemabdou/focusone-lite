'use client';
import React, { useState } from 'react';
import TimelineVis, { TimelineItem } from '@/components/Timeline';
import GoalsList from '@/components/GoalsList';

export default function DashboardPage() {
  const [items, setItems] = useState<TimelineItem[]>([
    { id:'g1', title:'Define Life Vision', level:'strategy', priority:'high', status:'open', start:'2025-01-01', end:'2025-03-01' },
    { id:'g2', title:'A2 German Course', level:'tactical', priority:'med', status:'open', start:'2025-02-10', end:'2025-05-15' },
    { id:'g3', title:'MVP Timeline v1', level:'project', priority:'high', status:'at_risk', start:'2025-11-01', end:'2025-11-15' },
    { id:'g4', title:'Daily German 20m', level:'daily', priority:'low', status:'open', start:'2025-11-02', end:'2025-12-31' },
    { id:'g5', title:'Quarterly Review Q4', level:'vision', priority:'med', status:'open', start:'2025-12-20', end:'2025-12-31' },
  ]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <TimelineVis items={items} />
        </div>
        <GoalsList items={items} onChange={setItems} />
      </div>
    </div>
  );
}
