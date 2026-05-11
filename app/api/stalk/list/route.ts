// GET /api/stalk/list — Return all stalks for userId
import { NextRequest, NextResponse } from 'next/server';
import { getAllStalks } from '@/lib/state';
import { checkRateLimit } from '@/lib/rate-limit';
import { rateLimitError, requireUser } from '@/lib/api-guards';

export async function GET(req: NextRequest) {
  const auth = requireUser(req, { allowQuery: true });
  if ('error' in auth) return auth.error;

  const rate = await checkRateLimit(`${auth.userId}:stalk:list`, 30, 60_000);
  if (!rate.allowed) {
    return rateLimitError(rate.retryAfterSeconds);
  }

  const stalks = getAllStalks(auth.userId);
  return NextResponse.json({ success: true, stalks });
}
