'use client';
import React from 'react';
import type { TimelineItem, Status } from '@/components/Timeline';

type Props = {
  items: TimelineItem[];
  onChange: (next: TimelineItem[]) => void;
};

export default function GoalsList({ items, onChange }: Props) {
  const setStatus = (id: string, status: Status) => {
    onChange(items.map(g => g.id === id ? { ...g, status } : g));
  };
  const remove = (id: string) => {
    onChange(items.filter(g => g.id !== id));
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Goals</h2>
        <button
          className="px-3 py-1 rounded bg-neutral-900 text-white text-sm"
          onClick={()=>{
            const now = new Date();
            const end = new Date(Date.now()+1000*60*60*24*14);
            const n: TimelineItem = {
              id: crypto.randomUUID(),
              title: 'New Goal',
              level: 'project',
              priority: 'med',
              status: 'open',
              start: now.toISOString().slice(0,10),
              end: end.toISOString().slice(0,10),
            };
            onChange([...items, n]);
          }}
        >+ Add</button>
      </div>
      <ul className="divide-y">
        {items.map(g=>(
          <li key={g.id} className="py-2 flex items-center gap-2">
            <span className="text-sm flex-1 truncate" title={g.title}>{g.title}</span>
            <select
              className="text-sm border rounded px-1 py-0.5"
              value={g.status}
              onChange={e=>setStatus(g.id, e.target.value as any)}
            >
              <option value="open">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="overdue">Overdue</option>
              <option value="done">Done</option>
            </select>
            <button className="text-xs px-2 py-1 border rounded" onClick={()=>remove(g.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
