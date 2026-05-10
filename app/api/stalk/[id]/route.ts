// GET/PATCH /api/stalk/[id] — Single stalk operations
import { NextRequest, NextResponse } from 'next/server';
import { getStalk, saveStalk } from '@/lib/state';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  jsonError,
  rateLimitError,
  requireUser,
  isSafeId,
  isValidTime,
  isValidGuestCount,
} from '@/lib/api-guards';
import type { StalkRequest } from '@/lib/types';

const MAX_GUESTS = 20;

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const auth = requireUser(req);
  if ('error' in auth) return auth.error;

  const params = await props.params;
  const { id } = params;
  if (!isSafeId(id)) {
    return jsonError('Invalid stalk id', 400);
  }

  const rate = await checkRateLimit(`${auth.userId}:stalk:get`, 60, 60_000);
  if (!rate.allowed) {
    return rateLimitError(rate.retryAfterSeconds);
  }

  const stalk = getStalk(id);
  if (!stalk || stalk.userId !== auth.userId) {
    return NextResponse.json(
      { success: false, error: 'Stalk not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, stalk });
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const auth = requireUser(req);
  if ('error' in auth) return auth.error;

  const params = await props.params;
  const { id } = params;
  if (!isSafeId(id)) {
    return jsonError('Invalid stalk id', 400);
  }

  const rate = await checkRateLimit(`${auth.userId}:stalk:patch`, 20, 60_000);
  if (!rate.allowed) {
    return rateLimitError(rate.retryAfterSeconds);
  }

  const stalk = getStalk(id);
  if (!stalk || stalk.userId !== auth.userId) {
    return NextResponse.json(
      { success: false, error: 'Stalk not found' },
      { status: 404 }
    );
  }

  const updates = await req.json().catch(() => null);
  if (!updates || typeof updates !== 'object') {
    return jsonError('Invalid JSON body', 400);
  }

  const requestUpdates = typeof updates.request === 'object'
    && updates.request
    && !Array.isArray(updates.request)
    ? updates.request as Partial<StalkRequest>
    : {};

  const allowedRequestUpdates: Partial<StalkRequest> = {};
  if (isValidTime(requestUpdates.preferredFrom)) {
    allowedRequestUpdates.preferredFrom = requestUpdates.preferredFrom;
  }
  if (isValidTime(requestUpdates.preferredTo)) {
    allowedRequestUpdates.preferredTo = requestUpdates.preferredTo;
  }
  if (isValidGuestCount(requestUpdates.guests, MAX_GUESTS)) {
    allowedRequestUpdates.guests = requestUpdates.guests;
  }

  if (Object.keys(allowedRequestUpdates).length === 0) {
    return jsonError('No valid updates provided', 400);
  }

  const mergedRequest = { ...stalk.request, ...allowedRequestUpdates };
  if (!isValidTimeRange(mergedRequest.preferredFrom, mergedRequest.preferredTo)) {
    return jsonError('preferredFrom must be earlier than preferredTo', 400);
  }

  const updated = { ...stalk, request: mergedRequest };
  saveStalk(updated);
  return NextResponse.json({ success: true, stalk: updated });
}

function isValidTimeRange(start: string, end: string): boolean {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  return toMinutes(start) < toMinutes(end);
}
