import assert from 'node:assert/strict';
import { after, before, beforeEach, mock, test } from 'node:test';

let checkRateLimit: typeof import('../lib/rate-limit').checkRateLimit;
const globals = globalThis as typeof globalThis & {
  __slotStalkerRateLimit: Map<string, { count: number; resetAt: number }>;
  __slotStalkerRateLimitLocks: Map<string, Promise<void>>;
};

before(async () => {
  mock.timers.enable({ apis: ['Date', 'setInterval'], now: 0 });
  ({ checkRateLimit } = await import('../lib/rate-limit'));
});

beforeEach(() => {
  globals.__slotStalkerRateLimit.clear();
  globals.__slotStalkerRateLimitLocks.clear();
});

after(() => mock.timers.reset());

test('concurrent requests consume exactly one shared quota', async () => {
  const results = await Promise.all(
    Array.from({ length: 40 }, () => checkRateLimit('alice:poll', 10, 60_000))
  );
  assert.equal(results.filter(result => result.allowed).length, 10);
  assert.deepEqual(results[10], { allowed: false, retryAfterSeconds: 60 });
  assert.equal((await checkRateLimit('bob:poll', 10, 60_000)).allowed, true);
});

test('completed requests release all per-key locks', async () => {
  await Promise.all(
    Array.from({ length: 100 }, (_, i) => checkRateLimit(`user_${i}:poll`, 10, 60_000))
  );
  assert.equal(globals.__slotStalkerRateLimitLocks.size, 0);
});

test('the quota resets at the exact end of its window', async () => {
  await checkRateLimit('alice:book', 1, 1000);
  mock.timers.tick(1000);
  assert.deepEqual(await checkRateLimit('alice:book', 1, 1000), {
    allowed: true,
    retryAfterSeconds: 0,
  });
});

test('expired entries are reclaimed even when their users never return', async () => {
  await Promise.all(
    Array.from({ length: 100 }, (_, i) => checkRateLimit(`inactive_${i}`, 1, 1000))
  );
  await checkRateLimit('still_active', 1, 120_000);
  mock.timers.tick(60_000);
  assert.equal(globals.__slotStalkerRateLimit.size, 1);
  assert.equal((await checkRateLimit('still_active', 1, 120_000)).allowed, false);
});
