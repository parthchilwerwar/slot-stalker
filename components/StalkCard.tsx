'use client';

import { useState, useEffect, useCallback } from 'react';
import { StalkRecord, Alternative, PollRecord } from '@/lib/types';
import { cn } from '@/lib/utils';
import { NumberTicker } from './ui/NumberTicker';
import { BorderBeam } from './ui/BorderBeam';
import {
  RiCalendarLine,
  RiUserLine,
  RiTimeLine,
  RiAlertLine,
  RiRefreshLine,
  RiCheckLine,
  RiCloseLine,
} from 'react-icons/ri';
import { TbStar, TbArrowRight } from 'react-icons/tb';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { GradientButton } from './ui/GradientButton';

interface StalkCardProps {
  stalk: StalkRecord;
  onBook?: (stalk: StalkRecord) => void;
}

function formatTime(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// State badge — no pulse dots, clean minimal
const stateConfig = {
  WATCHING: {
    label: 'Watching',
    bgClass: 'bg-brand/8',
    borderClass: 'border-brand/15',
    textClass: 'text-brand',
    icon: RiRefreshLine,
  },
  SLOT_FOUND: {
    label: 'Slot Found',
    bgClass: 'bg-brand/12',
    borderClass: 'border-brand/25',
    textClass: 'text-brand',
    icon: RiAlertLine,
  },
  BOOKED: {
    label: 'Booked',
    bgClass: 'bg-white/8',
    borderClass: 'border-white/15',
    textClass: 'text-white',
    icon: RiCheckLine,
  },
  EXPIRED: {
    label: 'Expired',
    bgClass: 'bg-white/5',
    borderClass: 'border-white/12',
    textClass: 'text-white/50',
    icon: RiCloseLine,
  },
};

function StateBadge({ state }: { state: StalkRecord['state'] }) {
  const cfg = stateConfig[state];
  const Icon = cfg.icon;
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-sans font-medium',
        cfg.bgClass,
        cfg.borderClass,
        cfg.textClass
      )}
    >
      <Icon size={11} />
      {cfg.label}
    </div>
  );
}

// Countdown hook
function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Poll progress bar
function PollProgressBar({ pollCount, state }: { pollCount: number; state: StalkRecord['state'] }) {
  const countdown = useCountdown(state === 'WATCHING' ? 180 : 0);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (state !== 'WATCHING') return;
    setProgress(100);
    const interval = setInterval(() => {
      setProgress((p) => Math.max(0, p - 100 / 180));
    }, 1000);
    return () => clearInterval(interval);
  }, [state, pollCount]);

  if (state !== 'WATCHING') return null;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-sans text-subtle">
          Poll #<NumberTicker value={pollCount} className="text-[10px]" />
        </span>
        <span className="text-[10px] font-sans text-subtle">
          {countdown}
        </span>
      </div>
      <div className="h-[2px] bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/70 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Poll timeline entry — no dot animations
function PollTimelineEntry({ poll, index }: { poll: PollRecord; index: number }) {
  const isHit = poll.newSlotDetected;
  return (
    <div className="flex items-start gap-2.5 relative animate-fade-in" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex flex-col items-center">
        <div className={cn('w-1 h-1 rounded-full mt-2 shrink-0', isHit ? 'bg-brand' : 'bg-white/15')} />
        <div className="w-px flex-1 bg-white/5 mt-1" />
      </div>
      <div className="pb-3 min-w-0">
        <p className="text-[12px] font-sans text-faint">
          {formatTimestamp(poll.polledAt)} — #{index + 1}
        </p>
        <p className="text-[11px] font-sans text-subtle">
          {poll.slotsFound.length} slot{poll.slotsFound.length !== 1 ? 's' : ''}
          {poll.slotsFound.length > 0 && (
            <span className="text-brand ml-1">({poll.slotsFound.join(', ')})</span>
          )}
        </p>
      </div>
    </div>
  );
}

// Alternative card
function AlternativeCard({ alt }: { alt: Alternative }) {
  return (
    <div className="relative bg-white/[0.04] border border-white/10 rounded-lg p-3 min-w-[180px] shrink-0">
      <p className="text-[13px] font-sans font-medium text-white mb-0.5 truncate">{alt.name}</p>
      {alt.bestAvailableSlot && (
        <p className="text-[11px] font-sans text-brand mb-0.5">{alt.bestAvailableSlot}</p>
      )}
      <p className="text-[10px] font-sans text-white/40 mb-2">{alt.cuisine}</p>
      <div className="flex items-center gap-1.5 mb-1">
        <TbStar size={10} className="text-white/50" />
        <span className="text-[10px] font-sans text-white/50">
          <NumberTicker value={alt.matchScore} className="text-[10px]" suffix="%" /> match
        </span>
      </div>
      <div className="h-[2px] bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/50 rounded-full transition-all duration-700"
          style={{ width: `${alt.matchScore}%` }}
        />
      </div>
      <GradientButton size="sm" fullWidth className="mt-2.5">
        Book <TbArrowRight size={10} />
      </GradientButton>
    </div>
  );
}

// Slot found alert
function SlotFoundAlert({ stalk, onBook }: { stalk: StalkRecord; onBook?: (stalk: StalkRecord) => void }) {
  const countdown = useCountdown(900);
  return (
    <div className="bg-brand/8 border border-brand/15 rounded-lg p-4 mb-3">
      <div className="flex items-start gap-2.5 mb-3">
        <RiAlertLine size={16} className="text-brand mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-sans font-medium text-white">Slot available — 15 min to confirm</p>
          <p className="text-[11px] font-sans text-subtle mt-0.5">
            {stalk.request.restaurantName} · {stalk.foundSlot} · {stalk.request.guests} guests
          </p>
        </div>
      </div>
      <div className="text-center mb-3">
        <span className="text-[18px] font-sans font-light text-white tabular-nums">{countdown}</span>
      </div>
      <div className="flex gap-2">
        <GradientButton size="md" urgent className="flex-1" onClick={() => onBook?.(stalk)}>
          Book now →
        </GradientButton>
        <button className="px-3 py-2 text-[12px] font-sans text-subtle hover:text-faint transition-colors duration-200">
          Skip
        </button>
      </div>
    </div>
  );
}

export default function StalkCard({ stalk, onBook }: StalkCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = useCallback(() => setExpanded((e) => !e), []);

  const cardContent = (
    <div
      className={cn(
        'bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl transition-all duration-200',
        'hover:border-white/15 cursor-pointer',
        stalk.state === 'SLOT_FOUND' && 'border-brand/20',
        stalk.state === 'EXPIRED' && 'opacity-70'
      )}
    >
      {/* Collapsed */}
      <div className="p-4" onClick={toggleExpand}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-[17px] text-white tracking-[-0.02em] truncate">
              {stalk.request.restaurantName}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-sans text-subtle flex-wrap">
              <span className="inline-flex items-center gap-1">
                <RiCalendarLine size={10} />
                {formatDate(stalk.request.date)}
              </span>
              <span className="text-white/10">·</span>
              <span className="inline-flex items-center gap-1">
                <RiUserLine size={10} />
                {stalk.request.guests}
              </span>
              <span className="text-white/10">·</span>
              <span className="inline-flex items-center gap-1">
                <RiTimeLine size={10} />
                {formatTime(stalk.request.preferredFrom)}–{formatTime(stalk.request.preferredTo)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StateBadge state={stalk.state} />
            {expanded ? <LuChevronUp size={14} className="text-subtle" /> : <LuChevronDown size={14} className="text-subtle" />}
          </div>
        </div>

        <PollProgressBar pollCount={stalk.pollCount} state={stalk.state} />
      </div>

      {/* Expanded */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="h-px bg-white/5 mx-4" />
        <div className="p-4 pt-3 space-y-4">
          {stalk.state === 'SLOT_FOUND' && stalk.foundSlot && (
            <SlotFoundAlert stalk={stalk} onBook={onBook} />
          )}

          {stalk.state === 'BOOKED' && stalk.bookingId && (
            <div className="bg-white/5 border border-white/8 rounded-lg p-3 mb-2">
              <div className="flex items-center gap-2.5">
                <RiCheckLine size={16} className="text-white" />
                <div>
                  <p className="text-[11px] font-sans text-subtle font-medium">Booking Confirmed</p>
                  <p className="text-[15px] font-sans font-semibold text-white">{stalk.bookingId}</p>
                </div>
              </div>
            </div>
          )}

          {stalk.polls.length > 0 && (
            <div>
              <p className="text-[10px] font-sans text-subtle uppercase tracking-[0.08em] mb-2">
                Poll timeline
              </p>
              <div className="max-h-[160px] overflow-y-auto pr-1">
                {[...stalk.polls].reverse().slice(0, 8).map((poll, idx) => (
                  <PollTimelineEntry key={idx} poll={poll} index={idx} />
                ))}
              </div>
            </div>
          )}

          {stalk.alternates.length > 0 && (
            <div>
              <p className="text-[10px] font-sans text-subtle uppercase tracking-[0.08em] mb-2">
                Alternatives
              </p>
              <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
                {stalk.alternates.slice(0, 3).map((alt) => (
                  <AlternativeCard key={alt.id} alt={alt} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (stalk.state === 'SLOT_FOUND') {
    return (
      <BorderBeam size={100} duration={8} colorFrom="#FF6A00" colorTo="#FF9A40" borderWidth={1}>
        {cardContent}
      </BorderBeam>
    );
  }

  return cardContent;
}
