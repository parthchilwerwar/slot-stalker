// POST /api/book — Confirm a table reservation
import { NextRequest, NextResponse } from 'next/server';
import { bookSlot } from '@/lib/agent';
import { getStalk } from '@/lib/state';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  jsonError,
  rateLimitError,
  requireUser,
  isSafeId,
  normalizeString,
} from '@/lib/api-guards';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonError('Invalid JSON body', 400);
    }

    const stalkId = typeof body.stalkId === 'string' ? body.stalkId.trim() : '';
    const restaurantId = typeof body.restaurantId === 'string' ? body.restaurantId.trim() : '';
    const slot = normalizeString(body.slot, 40);

    if (!isSafeId(stalkId) || !isSafeId(restaurantId) || !slot) {
      return jsonError('stalkId, slot, and restaurantId are required', 400);
    }

    const auth = requireUser(req);
    if ('error' in auth) return auth.error;

    const rate = await checkRateLimit(`${auth.userId}:book`, 10, 60_000);
    if (!rate.allowed) {
      return rateLimitError(rate.retryAfterSeconds);
    }

    const stalk = getStalk(stalkId);
    if (!stalk || stalk.userId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Stalk not found' },
        { status: 404 }
      );
    }

    if (stalk.restaurantId !== restaurantId) {
      return jsonError('restaurantId does not match the stalk', 400);
    }

    if (!stalk.foundSlot || stalk.foundSlot !== slot) {
      return jsonError('slot does not match the available slot for this stalk', 400);
    }

    const result = await bookSlot(stalkId, slot, restaurantId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Book error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
