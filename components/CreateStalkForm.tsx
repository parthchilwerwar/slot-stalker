'use client';

import { useState } from 'react';
import { ParsedIntent } from '@/lib/types';

interface CreateStalkFormProps {
  onCreated?: () => void;
}

export default function CreateStalkForm({ onCreated }: CreateStalkFormProps) {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'preview' | 'done'>('input');
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const examplePrompts = [
    "Table for 4 at Punjab Grill Bengaluru this Saturday at 8 PM",
    "Dinner for 2 at Karavalli next Friday, 7:30 PM",
    "Book Trishna Mumbai, 6 people, June 20th evening",
    "Toscano Bengaluru lunch for 6 this weekend",
  ];

  const handleSubmit = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stalk/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText, userId: 'demo_user' }),
      });
      const data = await res.json();

      if (data.needsClarification) {
        setParsedIntent(data.intent);
        setError(data.error);
        setStep('preview');
      } else if (data.success) {
        setParsedIntent(data.intent);
        setStep('done');
        onCreated?.();
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Network error — please try again');
    }
    setLoading(false);
  };

  const handleReset = () => {
    setStep('input');
    setRawText('');
    setParsedIntent(null);
    setError(null);
  };

  return (
    <div className="glass-card p-6 md:p-8">
      {step === 'input' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">🎯 New Stalk</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Describe your reservation in natural language
            </p>
          </div>

          <div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. Table for 4 at Punjab Grill Bengaluru this Saturday at 8 PM"
              className="input-dark min-h-[100px] resize-none"
              rows={3}
            />
          </div>

          {/* Example prompts */}
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setRawText(prompt)}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--accent-orange)] hover:bg-[var(--accent-orange-dim)] transition-colors cursor-pointer border border-transparent hover:border-[rgba(255,138,0,0.2)]"
              >
                {prompt}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-[var(--accent-red-dim)] border border-[rgba(255,82,82,0.2)] rounded-xl p-3 text-sm text-[var(--accent-red)]">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!rawText.trim() || loading}
            className="btn-glow w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="radar-spin inline-block">🔍</span> Parsing & Searching...</>
            ) : (
              <>🚀 Start Stalking</>
            )}
          </button>
        </div>
      )}

      {step === 'preview' && parsedIntent && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold text-[var(--accent-orange)] mb-1">⚠️ Low Confidence</h3>
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 space-y-2">
            <p className="text-xs text-[var(--text-muted)]">We parsed:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-[var(--text-muted)]">Restaurant:</span>
              <span className="text-white">{parsedIntent.restaurantName || '—'}</span>
              <span className="text-[var(--text-muted)]">City:</span>
              <span className="text-white">{parsedIntent.city || '—'}</span>
              <span className="text-[var(--text-muted)]">Date:</span>
              <span className="text-white">{parsedIntent.date}</span>
              <span className="text-[var(--text-muted)]">Guests:</span>
              <span className="text-white">{parsedIntent.guests}</span>
              <span className="text-[var(--text-muted)]">Confidence:</span>
              <span className="text-[var(--accent-orange)]">{Math.round(parsedIntent.confidence * 100)}%</span>
            </div>
          </div>

          <button onClick={handleReset} className="btn-ghost w-full">← Try Again</button>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-4 animate-fade-in">
          <span className="text-4xl mb-3 block">✅</span>
          <h3 className="text-lg font-bold text-[var(--accent-green)] mb-2">Stalk Created!</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Monitoring {parsedIntent?.restaurantName} for available slots
          </p>
          <button onClick={handleReset} className="btn-glow">+ Create Another</button>
        </div>
      )}
    </div>
  );
}
