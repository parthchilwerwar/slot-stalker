import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';

test('non-demo access fails closed when the service token is unconfigured', async () => {
  process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
  delete process.env.SLOT_STALKER_API_TOKEN;
  const { GET } = await import('../app/api/stalk/list/route');
  const response = await GET(new NextRequest('http://localhost/api/stalk/list', {
    headers: { 'x-user-id': 'demo_user' },
  }));
  assert.equal(response.status, 500);
  assert.equal((await response.json()).success, false);
});
