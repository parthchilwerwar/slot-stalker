// POST /api/stalk/create — Parse intent → search → slots → score → save
import { NextRequest, NextResponse } from 'next/server';
import { createStalk } from '@/lib/agent';
import { checkRateLimit } from '@/lib/rate-limit';
import { jsonError, rateLimitError, requireUser, isNonEmptyString } from '@/lib/api-guards';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonError('Invalid JSON body', 400);
    }

    const rawText = typeof body.rawText === 'string' ? body.rawText.trim() : '';
    if (!isNonEmptyString(rawText, 1000)) {
      return jsonError('rawText is required and must be under 1000 characters', 400);
    }

    const auth = requireUser(req, {
      fallbackUserId: typeof body.userId === 'string' ? body.userId : null,
    });
    if ('error' in auth) return auth.error;

    const rate = await checkRateLimit(`${auth.userId}:stalk:create`, 10, 60_000);
    if (!rate.allowed) {
      return rateLimitError(rate.retryAfterSeconds);
    }

    const result = await createStalk(rawText, auth.userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Create stalk error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
