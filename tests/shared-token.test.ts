import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';

test('a valid service token cannot impersonate another user through x-user-id', async () => {
  process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
  process.env.SLOT_STALKER_API_TOKEN = 'local-review-token';
  process.env.SLOT_STALKER_API_USER_ID = 'other_user';
  const { GET } = await import('../app/api/stalk/[id]/route');
  const { requireUser } = await import('../lib/api-guards');
  const params = { params: Promise.resolve({ id: 'stalk_demo_01' }) };
  const headers = { Authorization: 'Bearer local-review-token', 'x-user-id': 'other_user' };
  const ownRequest = new NextRequest('http://localhost/api/stalk/stalk_demo_01', { headers });
  assert.deepEqual(requireUser(ownRequest), { userId: 'other_user', demoMode: false });
  assert.equal((await GET(ownRequest, params)).status, 404);

  headers['x-user-id'] = 'demo_user';
  const impersonated = await GET(new NextRequest('http://localhost/api/stalk/stalk_demo_01', { headers }), params);
  assert.equal(impersonated.status, 403);
  assert.deepEqual(await impersonated.json(), { success: false, error: 'User identity does not match the service principal' });
});
