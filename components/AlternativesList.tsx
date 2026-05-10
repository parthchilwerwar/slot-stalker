'use client';

import { Alternative } from '@/lib/types';

interface AlternativesListProps {
  alternatives: Alternative[];
}

export default function AlternativesList({ alternatives }: AlternativesListProps) {
  if (alternatives.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        🔄 Alternatives
      </h4>
      <div className="space-y-2">
        {alternatives.map((alt, idx) => (
          <div
            key={alt.id}
            className="bg-[var(--bg-secondary)] rounded-xl p-4 flex items-center justify-between gap-4 group hover:bg-[var(--bg-card-hover)] transition-colors"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-white truncate">{alt.name}</span>
                <span className="text-xs text-[var(--text-muted)]">·</span>
                <span className="text-xs text-[var(--text-secondary)]">{alt.cuisine}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span>{'₹'.repeat(alt.priceRange)}</span>
                <span>⭐ {alt.rating}</span>
                {alt.bestAvailableSlot ? (
                  <span className="text-[var(--accent-green)]">🕐 {alt.bestAvailableSlot}</span>
                ) : (
                  <span className="text-[var(--accent-red)]">No slots</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-lg font-bold text-[var(--accent-orange)]">{alt.matchScore}%</span>
              <div className="w-16 score-bar">
                <div
                  className="score-bar-fill"
                  style={{ width: `${alt.matchScore}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
