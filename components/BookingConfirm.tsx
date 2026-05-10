'use client';

import { StalkRecord } from '@/lib/types';
import { useState } from 'react';
import { GradientButton } from './ui/GradientButton';

interface BookingConfirmProps {
  stalk: StalkRecord;
  onConfirm: (stalkId: string, slot: string, restaurantId: string) => Promise<void>;
  onClose: () => void;
}

export default function BookingConfirm({ stalk, onConfirm, onClose }: BookingConfirmProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; bookingId?: string; error?: string } | null>(null);

  const handleBook = async () => {
    if (!stalk.foundSlot) return;
    setLoading(true);
    try {
      await onConfirm(stalk.id, stalk.foundSlot, stalk.restaurantId);
      setResult({ success: true, bookingId: stalk.bookingId || 'BKG-XXXX' });
    } catch {
      setResult({ success: false, error: 'Booking failed — slot may have been taken' });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass-card p-8 max-w-md w-full animate-fade-in !hover:transform-none">
        {!result ? (
          <>
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">🎯</span>
              <h3 className="text-xl font-bold text-white mb-2">Confirm Booking</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Ready to lock in this slot?
              </p>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-xl p-5 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">Restaurant</span>
                <span className="text-sm font-medium text-white">{stalk.request.restaurantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">Date</span>
                <span className="text-sm font-medium text-white">{stalk.request.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">Time</span>
                <span className="text-sm font-bold text-[var(--accent-green)]">{stalk.foundSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">Guests</span>
                <span className="text-sm font-medium text-white">{stalk.request.guests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">City</span>
                <span className="text-sm font-medium text-white">{stalk.request.city}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <GradientButton
                size="md"
                urgent
                onClick={handleBook}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <><span className="inline-block animate-spin">⏳</span> Booking...</>
                ) : (
                  <>🎫 Confirm Booking</>
                )}
              </GradientButton>
            </div>
          </>
        ) : result.success ? (
          <div className="text-center py-4">
            <span className="text-5xl mb-4 block">🎉</span>
            <h3 className="text-xl font-bold text-[var(--accent-green)] mb-2">Booking Confirmed!</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Your table is reserved</p>
            <div className="bg-[var(--accent-green-dim)] rounded-xl p-4 mb-6">
              <p className="text-xs text-[var(--accent-green)] mb-1">Booking ID</p>
              <p className="text-2xl font-bold text-[var(--accent-green)]">{result.bookingId}</p>
            </div>
            <button onClick={onClose} className="btn-glow w-full">Done</button>
          </div>
        ) : (
          <div className="text-center py-4">
            <span className="text-5xl mb-4 block">😔</span>
            <h3 className="text-xl font-bold text-[var(--accent-red)] mb-2">Booking Failed</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">{result.error}</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-ghost flex-1">Close</button>
              <button onClick={() => setResult(null)} className="btn-glow flex-1">Try Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
