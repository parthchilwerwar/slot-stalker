'use client';

import { NumberTicker } from './ui/NumberTicker';

interface StatCardProps {
  label: string;
  value: number;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4">
      <NumberTicker value={value} className="font-sans text-[20px] font-semibold text-white tabular-nums block" />
      <p className="text-[11px] font-sans text-white/40 mt-0.5">{label}</p>
    </div>
  );
}
