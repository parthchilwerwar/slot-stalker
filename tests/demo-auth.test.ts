import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';

test('the local demo works without a service token and retains demo identity fallbacks', async () => {
  process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
  delete process.env.SLOT_STALKER_API_TOKEN;
  const { GET } = await import('../app/api/stalk/list/route');
  const { requireUser } = await import('../lib/api-guards');
  const req = new NextRequest('http://localhost/api/stalk/list');
  const response = await GET(req);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.stalks.length, 5);
  assert.ok(body.stalks.every((stalk: { userId: string }) => stalk.userId === 'demo_user'));
  assert.deepEqual(requireUser(req, { fallbackUserId: 'demo_alice' }), {
    userId: 'demo_alice', demoMode: true,
  });
  assert.deepEqual(requireUser(new NextRequest('http://localhost/api/stalk/list?userId=demo_bob'), {
    allowQuery: true,
  }), { userId: 'demo_bob', demoMode: true });
});
