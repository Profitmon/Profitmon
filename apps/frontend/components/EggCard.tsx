'use client';
import { Egg } from '@/lib/types';

export default function EggCard({ egg }: { egg: Egg }) {
  return (
    <div className="bg-[var(--card)] p-6 rounded-xl shadow-md hover:shadow-lg border border-[var(--border)] transition-all">
      <h3 className="text-xl font-bold text-[var(--accent)] mb-2">{egg.type} Egg</h3>
      <p>Status: {egg.isHatched ? 'Hatched' : 'Ready to hatch'}</p>
    </div>
  );
}
