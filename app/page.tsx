'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { LuPlus, LuSettings, LuHistory } from 'react-icons/lu';
import { StalkRecord } from '@/lib/types';
import { mockStalks } from '@/lib/mock-data';
import StalkCard from '@/components/StalkCard';

const DEMO_USER_ID = 'demo_user';

export default function DashboardPage() {
  const [stalks, setStalks] = useState<StalkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStalks = useCallback(async () => {
    try {
      const res = await fetch('/api/stalk/list', {
        cache: 'no-store',
        headers: { 'x-user-id': DEMO_USER_ID },
      });
      const data = await res.json();
      if (data.success) {
        setStalks(data.stalks);
      } else {
        setStalks(mockStalks);
      }
    } catch {
      setStalks(mockStalks);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStalks();
    const interval = setInterval(fetchStalks, 10000);
    return () => clearInterval(interval);
  }, [fetchStalks]);

  // Split into 3 sections
  const watching = stalks.filter((s) => s.state === 'WATCHING' || s.state === 'SLOT_FOUND');
  const booked = stalks.filter((s) => s.state === 'BOOKED');
  const expired = stalks.filter((s) => s.state === 'EXPIRED');

  const stats = {
    active: watching.length,
    booked: booked.length,
    expired: expired.length,
  };

  return (
    <div className="px-5 md:px-8 py-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-[26px] md:text-[32px] text-white tracking-[-0.03em]">
            Slot Stalker
          </h1>
          <p className="text-[12px] font-sans text-white/40 mt-0.5">
            Dineout reservation agent
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/history"
            className="p-2.5 rounded-lg border border-rim text-subtle hover:text-white hover:border-white/15 transition-colors duration-200"
          >
            <LuHistory size={16} />
          </Link>
          <Link
            href="/settings"
            className="p-2.5 rounded-lg border border-rim text-subtle hover:text-white hover:border-white/15 transition-colors duration-200"
          >
            <LuSettings size={16} />
          </Link>
          <Link
            href="/stalk/new"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-[13px] font-sans font-medium px-4 py-2.5 rounded-lg transition-all duration-200"
          >
            <LuPlus size={14} />
            New stalk
          </Link>
        </div>
      </header>

      {/* Quick stats row */}
      <div className="flex items-center gap-5 mb-8">
        <StatPill label="Watching" count={stats.active} color="brand" />
        <span className="w-px h-4 bg-white/10" />
        <StatPill label="Booked" count={stats.booked} color="white" />
        <span className="w-px h-4 bg-white/10" />
        <StatPill label="Expired" count={stats.expired} color="subtle" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface border border-rim rounded-xl h-[80px]" />
          ))}
        </div>
      ) : stalks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="font-serif text-[22px] text-white mb-2">No active stalks</h2>
          <p className="text-[13px] font-sans text-subtle mb-6">
            Start your first stalk to monitor restaurant slots.
          </p>
          <Link
            href="/stalk/new"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-[14px] font-sans font-medium px-6 py-3 rounded-lg transition-all duration-200"
          >
            <LuPlus size={16} />
            Create your first stalk
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Section: Watching & Found */}
          {watching.length > 0 && (
            <Section title="Watching" count={watching.length}>
              {watching.map((stalk, idx) => (
                <div key={stalk.id} className="animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                  <StalkCard stalk={stalk} />
                </div>
              ))}
            </Section>
          )}

          {/* Section: Booked */}
          {booked.length > 0 && (
            <Section title="Booked" count={booked.length}>
              {booked.map((stalk, idx) => (
                <div key={stalk.id} className="animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                  <StalkCard stalk={stalk} />
                </div>
              ))}
            </Section>
          )}

          {/* Section: Expired */}
          {expired.length > 0 && (
            <Section title="Expired" count={expired.length}>
              {expired.map((stalk, idx) => (
                <div key={stalk.id} className="animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                  <StalkCard stalk={stalk} />
                </div>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[14px] font-sans font-medium text-faint uppercase tracking-[0.06em]">
          {title}
        </h2>
        <span className="text-[11px] font-sans text-white/40 bg-white/[0.06] px-2 py-0.5 rounded-md">
          {count}
        </span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {children}
      </div>
    </section>
  );
}

function StatPill({ label, count, color }: { label: string; count: number; color: string }) {
  const colorMap: Record<string, string> = {
    brand: 'text-brand',
    white: 'text-white',
    subtle: 'text-white/50',
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[14px] font-sans font-semibold tabular-nums ${colorMap[color] || 'text-white'}`}>
        {count}
      </span>
      <span className="text-[12px] font-sans text-white/50">{label}</span>
    </div>
  );
}
