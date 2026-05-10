type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const store = (() => {
  const globalStore = globalThis as typeof globalThis & {
    __slotStalkerRateLimit?: Map<string, RateLimitEntry>;
  };
  if (!globalStore.__slotStalkerRateLimit) {
    globalStore.__slotStalkerRateLimit = new Map<string, RateLimitEntry>();
  }
  return globalStore.__slotStalkerRateLimit;
})();

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  entry.count += 1;
  store.set(key, entry);

  const retryAfterSeconds = Math.ceil(Math.max(entry.resetAt - now, 0) / 1000);
  return {
    allowed: entry.count <= limit,
    retryAfterSeconds,
  };
}
