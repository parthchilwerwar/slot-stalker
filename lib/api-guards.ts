import { NextRequest, NextResponse } from 'next/server';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const API_TOKEN = process.env.SLOT_STALKER_API_TOKEN;

const USER_ID_HEADER = 'x-user-id';
const API_KEY_HEADER = 'x-api-key';

export type UserContext = {
  userId: string;
  demoMode: boolean;
};

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function rateLimitError(retryAfterSeconds: number) {
  return NextResponse.json(
    { success: false, error: 'Rate limit exceeded', retryAfterSeconds },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}

export function requireUser(
  req: NextRequest,
  options?: { allowQuery?: boolean; fallbackUserId?: string | null }
): UserContext | { error: NextResponse } {
  const tokenRequired = !DEMO_MODE || Boolean(API_TOKEN);
  if (tokenRequired) {
    if (!API_TOKEN) {
      return { error: jsonError('Server auth token is not configured', 500) };
    }
    const token = extractToken(req);
    if (!token || token !== API_TOKEN) {
      return { error: jsonError('Unauthorized', 401) };
    }
  }

  const headerUserId = normalizeUserId(req.headers.get(USER_ID_HEADER));
  const queryUserId = options?.allowQuery
    ? normalizeUserId(req.nextUrl.searchParams.get('userId'))
    : null;
  const fallbackUserId = normalizeUserId(options?.fallbackUserId ?? null);

  const userId =
    headerUserId || (DEMO_MODE ? (fallbackUserId || queryUserId || 'demo_user') : null);

  if (!userId) {
    return { error: jsonError('userId is required', 400) };
  }

  return { userId, demoMode: DEMO_MODE };
}

export function isSafeId(value: unknown, maxLength = 64): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return false;
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

export function isNonEmptyString(value: unknown, maxLength = 2000): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength;
}

export function isValidTime(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function normalizeUserId(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 64) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    return token || null;
  }
  const apiKey = req.headers.get(API_KEY_HEADER);
  return apiKey?.trim() || null;
}
