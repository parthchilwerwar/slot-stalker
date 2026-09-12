import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';

test('production access fails closed when the token has no configured principal', async () => {
  process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
  process.env.SLOT_STALKER_API_TOKEN = 'test-service-token';
  delete process.env.SLOT_STALKER_API_USER_ID;
  const { GET } = await import('../app/api/stalk/list/route');
  const response = await GET(new NextRequest('http://localhost/api/stalk/list', {
    headers: { Authorization: 'Bearer test-service-token', 'x-user-id': 'demo_user' },
  }));
  assert.equal(response.status, 500);
  assert.equal((await response.json()).success, false);
});
