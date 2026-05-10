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
    __slotStalkerRateLimitLocks?: Map<string, Promise<void>>;
  };
  if (!globalStore.__slotStalkerRateLimit) {
    globalStore.__slotStalkerRateLimit = new Map<string, RateLimitEntry>();
  }
  if (!globalStore.__slotStalkerRateLimitLocks) {
    globalStore.__slotStalkerRateLimitLocks = new Map<string, Promise<void>>();
  }
  return {
    entries: globalStore.__slotStalkerRateLimit,
    locks: globalStore.__slotStalkerRateLimitLocks,
  };
})();

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  return withLock(key, () => {
    const now = Date.now();
    const entry = store.entries.get(key);
    if (!entry || now > entry.resetAt) {
      store.entries.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
    }

    const nextEntry = { count: entry.count + 1, resetAt: entry.resetAt };
    store.entries.set(key, nextEntry);

    const retryAfterSeconds = Math.ceil(Math.max(nextEntry.resetAt - now, 0) / 1000);
    return {
      allowed: nextEntry.count <= limit,
      retryAfterSeconds,
    };
  });
}

async function withLock<T>(key: string, fn: () => T): Promise<T> {
  const previous = store.locks.get(key) ?? Promise.resolve();
  let release: (() => void) | undefined;
  const next = new Promise<void>(resolve => {
    release = resolve;
  });
  store.locks.set(key, previous.then(() => next));

  await previous;
  try {
    return fn();
  } finally {
    release?.();
    if (store.locks.get(key) === next) {
      store.locks.delete(key);
    }
  }
}
