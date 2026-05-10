// POST /api/poll — Trigger one poll cycle
import { NextRequest, NextResponse } from 'next/server';
import { pollStalk } from '@/lib/agent';
import { getStalk } from '@/lib/state';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  jsonError,
  rateLimitError,
  requireUser,
  isSafeId,
} from '@/lib/api-guards';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonError('Invalid JSON body', 400);
    }

    const stalkId = body.stalkId;
    if (!isSafeId(stalkId)) {
      return jsonError('stalkId is required', 400);
    }

    const auth = requireUser(req);
    if ('error' in auth) return auth.error;

    const rate = checkRateLimit(`${auth.userId}:poll`, 30, 60_000);
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

    const result = await pollStalk(stalkId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Poll error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
