'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LuArrowLeft } from 'react-icons/lu';
import { RiSearchLine, RiMapPinLine, RiCalendarLine, RiUserLine, RiTimeLine } from 'react-icons/ri';
import { ParsedIntent } from '@/lib/types';

const examplePills = [
  'Book Toit, Bengaluru, Friday, 4 people, 7:30pm',
  'Indian Accent Delhi, this Saturday, 2 guests, 8pm',
  'Farmlore Bangalore, next weekend, 6 people, 7pm',
];

const DEMO_USER_ID = 'demo_user';

function formatTime(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function NewStalkPage() {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'confirm' | 'done'>('input');
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stalk/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': DEMO_USER_ID },
        body: JSON.stringify({ rawText }),
      });
      const data = await res.json();

      if (data.needsClarification) {
        setParsedIntent(data.intent);
        setError(data.error);
        setStep('confirm');
      } else if (data.success) {
        setParsedIntent(data.intent);
        setStep('confirm');
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setParsedIntent({
        restaurantName: 'Indian Accent',
        city: 'New Delhi',
        date: '2026-06-14',
        guests: 2,
        preferredFrom: '20:00',
        preferredTo: '21:30',
        confidence: 0.92,
      });
      setStep('confirm');
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleStartStalking = () => {
    setStep('done');
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };

  const intentRows = parsedIntent
    ? [
        { icon: RiMapPinLine, label: 'Restaurant', value: `${parsedIntent.restaurantName}, ${parsedIntent.city}` },
        { icon: RiCalendarLine, label: 'Date', value: formatDate(parsedIntent.date) },
        { icon: RiUserLine, label: 'Guests', value: `${parsedIntent.guests} people` },
        { icon: RiTimeLine, label: 'Time window', value: `${formatTime(parsedIntent.preferredFrom)} – ${formatTime(parsedIntent.preferredTo)}` },
      ]
    : [];

  return (
    <div className="px-5 md:px-8 py-6 max-w-[540px] mx-auto">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[12px] font-sans text-subtle hover:text-white transition-colors duration-200 mb-6"
      >
        <LuArrowLeft size={13} />
        Back
      </Link>

      <h1 className="font-serif text-[28px] md:text-[32px] text-white tracking-[-0.03em] mb-1">New stalk</h1>
      <p className="text-[13px] font-sans text-subtle mb-8">
        Describe what you&apos;re looking for in plain English.
      </p>

      {step === 'input' && (
        <div className="space-y-4">
          {/* Input */}
          <div className="relative">
            <RiSearchLine size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Book Indian Accent, Delhi, Saturday, 2 people, 8pm..."
              className="w-full h-[50px] bg-white/[0.03] border border-white/[0.08] rounded-xl pl-11 pr-4 text-[14px] font-sans text-white placeholder:text-subtle/60 focus:border-brand/40 focus:outline-none transition-[border-color] duration-150"
            />
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-2">
            {examplePills.map((pill) => (
              <button
                key={pill}
                onClick={() => setRawText(pill)}
                className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] font-sans text-subtle hover:border-brand/20 hover:text-faint transition-colors duration-200"
              >
                {pill}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-brand/8 border border-brand/15 rounded-lg p-3 text-[12px] font-sans text-brand">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!rawText.trim() || loading}
            className="w-full h-[46px] bg-brand hover:bg-brand-dark disabled:opacity-30 disabled:cursor-not-allowed text-white text-[13px] font-sans font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RiSearchLine size={14} className="animate-spin" />
                Parsing...
              </>
            ) : (
              'Start Stalking →'
            )}
          </button>
        </div>
      )}

      {step === 'confirm' && parsedIntent && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[11px] font-sans text-subtle mb-3">Extracted from your request</p>
            <div className="space-y-2.5">
              {intentRows.map((row) => (
                <div key={row.label} className="flex items-center gap-2.5">
                  <row.icon size={13} className="text-subtle shrink-0" />
                  <span className="text-[12px] font-sans text-subtle w-20 shrink-0">{row.label}</span>
                  <span className="text-[12px] font-sans text-white">{row.value}</span>
                </div>
              ))}
            </div>

            {parsedIntent.confidence < 0.8 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                <div className="w-1 h-1 rounded-full bg-brand" />
                <span className="text-[10px] font-sans text-brand">
                  Low confidence — please verify details
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setStep('input')}
            className="text-[11px] font-sans text-brand hover:text-brand-dark transition-colors duration-200"
          >
            ← Edit request
          </button>

          <button
            onClick={handleStartStalking}
            className="w-full h-[46px] bg-brand hover:bg-brand-dark text-white text-[13px] font-sans font-medium rounded-lg transition-all duration-200"
          >
            Start Stalking →
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-12 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-brand/15 border border-brand/25 flex items-center justify-center mx-auto mb-4">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-brand">
              <path d="M4 10L8 14L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="font-serif text-[20px] text-white mb-1.5">Stalk created</h2>
          <p className="text-[12px] font-sans text-subtle">
            Monitoring {parsedIntent?.restaurantName} for available slots...
          </p>
        </div>
      )}
    </div>
  );
}
