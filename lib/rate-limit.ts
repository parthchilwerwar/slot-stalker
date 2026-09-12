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
    __slotStalkerRateLimitCleanup?: ReturnType<typeof setInterval>;
  };
  if (!globalStore.__slotStalkerRateLimit) {
    globalStore.__slotStalkerRateLimit = new Map<string, RateLimitEntry>();
  }
  if (!globalStore.__slotStalkerRateLimitLocks) {
    globalStore.__slotStalkerRateLimitLocks = new Map<string, Promise<void>>();
  }
  const entries = globalStore.__slotStalkerRateLimit;
  // Reclaim abandoned users' windows without requiring another request from them.
  // Keep one unreferenced timer across hot reloads so it cannot hold Node open.
  if (!globalStore.__slotStalkerRateLimitCleanup) {
    globalStore.__slotStalkerRateLimitCleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of entries) {
        if (now >= entry.resetAt) entries.delete(key);
      }
    }, 60_000);
    globalStore.__slotStalkerRateLimitCleanup.unref();
  }
  return {
    entries,
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
    if (!entry || now >= entry.resetAt) {
      store.entries.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const nextEntry = { count: entry.count + 1, resetAt: entry.resetAt };
    store.entries.set(key, nextEntry);

    const allowed = nextEntry.count <= limit;
    const retryAfterSeconds = allowed
      ? 0
      : Math.ceil(Math.max(nextEntry.resetAt - now, 0) / 1000);
    return {
      allowed,
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
  const queued = previous.then(() => next);
  store.locks.set(key, queued);

  await previous;
  try {
    return fn();
  } finally {
    release?.();
    if (store.locks.get(key) === queued) {
      store.locks.delete(key);
    }
  }
}
