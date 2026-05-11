'use client';

import { useState, useEffect, useCallback } from 'react';
import { StalkRecord } from '@/lib/types';
import StalkCard from './StalkCard';
import BookingConfirm from './BookingConfirm';
import AlternativesList from './AlternativesList';
import PollTimeline from './PollTimeline';

type FilterState = 'ALL' | 'WATCHING' | 'SLOT_FOUND' | 'BOOKED' | 'EXPIRED';

const FILTERS: { label: string; value: FilterState; icon: string }[] = [
  { label: 'All', value: 'ALL', icon: '📋' },
  { label: 'Watching', value: 'WATCHING', icon: '👁' },
  { label: 'Slot Found', value: 'SLOT_FOUND', icon: '✨' },
  { label: 'Booked', value: 'BOOKED', icon: '✅' },
  { label: 'Expired', value: 'EXPIRED', icon: '⏰' },
];

const DEMO_USER_ID = 'demo_user';

export default function StalkDashboard() {
  const [stalks, setStalks] = useState<StalkRecord[]>([]);
  const [filter, setFilter] = useState<FilterState>('ALL');
  const [loading, setLoading] = useState(true);
  const [bookingStalk, setBookingStalk] = useState<StalkRecord | null>(null);
  const [expandedStalk, setExpandedStalk] = useState<string | null>(null);

  const fetchStalks = useCallback(async () => {
    try {
      const res = await fetch('/api/stalk/list', {
        cache: 'no-store',
        headers: { 'x-user-id': DEMO_USER_ID },
      });
      const data = await res.json();
      if (data.success) {
        setStalks(data.stalks);
      }
    } catch (err) {
      console.error('Failed to fetch stalks:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStalks();
    const interval = setInterval(fetchStalks, 10000);
    return () => clearInterval(interval);
  }, [fetchStalks]);

  const handlePoll = async (stalkId: string) => {
    try {
      const res = await fetch('/api/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': DEMO_USER_ID },
        body: JSON.stringify({ stalkId }),
      });
      const data = await res.json();
      if (data.success) {
        setStalks(prev =>
          prev.map(s => (s.id === stalkId ? data.stalk : s))
        );
      }
    } catch (err) {
      console.error('Poll failed:', err);
    }
  };

  const handleBook = async (stalkId: string, slot: string, restaurantId: string) => {
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': DEMO_USER_ID },
      body: JSON.stringify({ stalkId, slot, restaurantId }),
    });
    const data = await res.json();
    if (data.success) {
      setStalks(prev =>
        prev.map(s => (s.id === stalkId ? data.stalk : s))
      );
      setBookingStalk(null);
    } else {
      throw new Error(data.error);
    }
  };

  const filteredStalks = filter === 'ALL'
    ? stalks
    : stalks.filter(s => s.state === filter);

  const counts = {
    ALL: stalks.length,
    WATCHING: stalks.filter(s => s.state === 'WATCHING').length,
    SLOT_FOUND: stalks.filter(s => s.state === 'SLOT_FOUND').length,
    BOOKED: stalks.filter(s => s.state === 'BOOKED').length,
    EXPIRED: stalks.filter(s => s.state === 'EXPIRED').length,
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === f.value
                ? 'bg-[var(--accent-orange-dim)] text-[var(--accent-orange)] border border-[rgba(255,138,0,0.3)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-transparent hover:text-[var(--text-secondary)]'
            }`}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
            <span className={`text-xs ml-1 px-1.5 py-0.5 rounded-md ${
              filter === f.value ? 'bg-[rgba(255,138,0,0.2)]' : 'bg-[var(--bg-card)]'
            }`}>
              {counts[f.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-[200px] shimmer" />
          ))}
        </div>
      ) : filteredStalks.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl mb-4 block">🔍</span>
          <p className="text-[var(--text-muted)]">No stalks found for this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
          {filteredStalks.map(stalk => (
            <div key={stalk.id}>
              <div onClick={() => setExpandedStalk(expandedStalk === stalk.id ? null : stalk.id)}>
                <StalkCard
                  stalk={stalk}
                  onBook={(s) => { setBookingStalk(s); }}
                />
              </div>

              {/* Expanded details */}
              {expandedStalk === stalk.id && (
                <div className="mt-2 glass-card p-5 space-y-5 animate-fade-in !hover:transform-none">
                  <PollTimeline polls={stalk.polls} />
                  <AlternativesList alternatives={stalk.alternates} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Booking modal */}
      {bookingStalk && (
        <BookingConfirm
          stalk={bookingStalk}
          onConfirm={async (stalkId, slot, restaurantId) => {
            await handleBook(stalkId, slot, restaurantId);
          }}
          onClose={() => setBookingStalk(null)}
        />
      )}
    </div>
  );
}
