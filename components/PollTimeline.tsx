'use client';

import { PollRecord } from '@/lib/types';

interface PollTimelineProps {
  polls: PollRecord[];
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function PollTimeline({ polls }: PollTimelineProps) {
  const recentPolls = [...polls].reverse().slice(0, 8);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        📊 Poll History
      </h4>
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-[var(--border-subtle)]" />

        <div className="space-y-3">
          {recentPolls.map((poll, idx) => (
            <div key={idx} className="relative flex items-start gap-3">
              {/* Dot */}
              <div
                className={`absolute left-[-18px] top-1.5 w-3 h-3 rounded-full border-2 ${
                  poll.newSlotDetected
                    ? 'bg-[var(--accent-green)] border-[var(--accent-green)]'
                    : 'bg-[var(--bg-card)] border-[var(--text-muted)]'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {formatTimestamp(poll.polledAt)}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {timeAgo(poll.polledAt)}
                  </span>
                </div>
                {poll.slotsFound.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {poll.slotsFound.map(slot => (
                      <span
                        key={slot}
                        className={`text-[11px] px-2 py-0.5 rounded-md ${
                          poll.newSlotDetected
                            ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-[var(--text-muted)]">No slots available</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
