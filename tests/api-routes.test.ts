import assert from 'node:assert/strict';
import { before, beforeEach, test } from 'node:test';
import { NextRequest } from 'next/server';
import type { StalkRecord } from '../lib/types';

let single: typeof import('../app/api/stalk/[id]/route');
let list: typeof import('../app/api/stalk/list/route');
let create: typeof import('../app/api/stalk/create/route');
let poll: typeof import('../app/api/poll/route');
let book: typeof import('../app/api/book/route');
let state: typeof import('../lib/state');

before(async () => {
  process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
  process.env.SLOT_STALKER_API_TOKEN = 'test-service-token';
  process.env.SLOT_STALKER_API_USER_ID = 'alice';
  delete process.env.GROQ_API_KEY;
  [single, list, create, poll, book, state] = await Promise.all([
    import('../app/api/stalk/[id]/route'),
    import('../app/api/stalk/list/route'),
    import('../app/api/stalk/create/route'),
    import('../app/api/poll/route'),
    import('../app/api/book/route'),
    import('../lib/state'),
  ]);
});

const fixture: StalkRecord = {
  id: 'test_stalk', userId: 'alice', restaurantId: 'rest_002', state: 'WATCHING',
  request: {
    restaurantName: 'Karavalli', city: 'Bengaluru', date: '2026-12-15',
    guests: 2, preferredFrom: '19:30', preferredTo: '21:00',
  },
  pollCount: 0, polls: [], createdAt: 1, lastPolledAt: null, slotFoundAt: null,
  foundSlot: null, bookingId: null, alternates: [], expiresAt: Date.now() + 86_400_000,
};
const params = { params: Promise.resolve({ id: fixture.id }) };

function request(path: string, method = 'GET', body?: unknown, userId = 'alice') {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-service-token',
      'x-user-id': userId,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  state.saveStalk(structuredClone(fixture));
  (globalThis as typeof globalThis & {
    __slotStalkerRateLimit?: Map<string, unknown>;
  }).__slotStalkerRateLimit?.clear();
});

test('all protected operations reject another asserted user without mutating the stalk', async () => {
  const responses = await Promise.all([
    single.GET(request('/api/stalk/test_stalk', 'GET', undefined, 'bob'), params),
    single.PATCH(request('/api/stalk/test_stalk', 'PATCH', { request: { guests: 4 } }, 'bob'), params),
    poll.POST(request('/api/poll', 'POST', { stalkId: fixture.id }, 'bob')),
    book.POST(request('/api/book', 'POST', {
      stalkId: fixture.id, restaurantId: fixture.restaurantId, slot: '7:45 PM',
    }, 'bob')),
  ]);
  assert.deepEqual(responses.map(response => response.status), [403, 403, 403, 403]);
  assert.deepEqual(state.getStalk(fixture.id), fixture);
  const response = await list.GET(request('/api/stalk/list', 'GET', undefined, 'bob'));
  assert.equal(response.status, 403);
});

test('production requests require a valid service credential', async () => {
  for (const token of [null, 'Bearer wrong-token']) {
    const req = request('/api/stalk/list');
    if (token) req.headers.set('Authorization', token);
    else req.headers.delete('Authorization');
    assert.equal((await list.GET(req)).status, 401);
  }
  const req = request('/api/stalk/list');
  req.headers.delete('Authorization');
  req.headers.set('X-API-Key', 'test-service-token');
  assert.equal((await list.GET(req)).status, 200);
});

test('production identity cannot fall back to query or create-body fields', async () => {
  const listRequest = request('/api/stalk/list?userId=alice');
  listRequest.headers.delete('x-user-id');
  assert.equal((await list.GET(listRequest)).status, 400);
  const createRequest = request('/api/stalk/create', 'POST', { rawText: 'Karavalli', userId: 'alice' });
  createRequest.headers.delete('x-user-id');
  assert.equal((await create.POST(createRequest)).status, 400);
});

test('PATCH updates preferences while keeping protected record fields unchanged', async () => {
  const response = await single.PATCH(request('/api/stalk/test_stalk', 'PATCH', {
    userId: 'bob', state: 'BOOKED', bookingId: 'forged',
    request: { guests: 4, restaurantName: 'Forged', date: '2027-01-01' },
  }), params);
  assert.equal(response.status, 200);
  assert.deepEqual(state.getStalk(fixture.id), {
    ...fixture, request: { ...fixture.request, guests: 4 },
  });
});

test('PATCH rejects invalid time ranges without changing state', async () => {
  const response = await single.PATCH(request('/api/stalk/test_stalk', 'PATCH', {
    request: { preferredFrom: '22:00' },
  }), params);
  assert.equal(response.status, 400);
  assert.deepEqual(state.getStalk(fixture.id), fixture);
});

test('PATCH cannot change the party or time for a selected or completed booking', async () => {
  for (const status of ['SLOT_FOUND', 'BOOKED', 'EXPIRED'] as const) {
    const stalk = { ...structuredClone(fixture), state: status, foundSlot: '7:45 PM', slotFoundAt: 2 };
    state.saveStalk(stalk);
    const response = await single.PATCH(request('/api/stalk/test_stalk', 'PATCH', {
      request: { guests: 4, preferredFrom: '20:00' },
    }), params);
    assert.equal(response.status, 409, status);
    assert.deepEqual(state.getStalk(fixture.id), stalk);
  }
});

test('booking rejects a different restaurant or slot before any booking operation', async () => {
  const stalk = { ...structuredClone(fixture), state: 'SLOT_FOUND' as const, foundSlot: '7:45 PM' };
  state.saveStalk(stalk);
  for (const input of [
    { restaurantId: 'rest_003', slot: '7:45 PM' },
    { restaurantId: 'rest_002', slot: '8:30 PM' },
  ]) {
    const response = await book.POST(request('/api/book', 'POST', { stalkId: fixture.id, ...input }));
    assert.equal(response.status, 400);
    assert.deepEqual(state.getStalk(fixture.id), stalk);
  }
});

test('malformed JSON is rejected consistently by mutation routes', async () => {
  for (const [path, handler] of [
    ['/api/stalk/create', create.POST], ['/api/poll', poll.POST], ['/api/book', book.POST],
  ] as const) {
    const req = new NextRequest(`http://localhost${path}`, {
      method: 'POST', body: '{', headers: request(path).headers,
    });
    assert.equal((await handler(req)).status, 400);
  }
});

test('exhausted route quota returns a retry header', async () => {
  const responses = await Promise.all(Array.from({ length: 31 }, () => list.GET(request('/api/stalk/list'))));
  assert.equal(responses.filter(response => response.status === 200).length, 30);
  assert.equal(responses[30].status, 429);
  assert.equal(responses[30].headers.get('Retry-After'), '60');
});
