import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bookSlot, pollStalk } from '../lib/agent';
import { getStalk, saveStalk } from '../lib/state';

test('simultaneous confirmations create only one booking for a stalk', async (t) => {
  // The agent currently uses only the local mock MCP; deterministic random values
  // keep its simulated booking successful without calling any external service.
  t.mock.method(Math, 'random', () => 0.5);
  const stalk = structuredClone(getStalk('stalk_demo_02')!);
  stalk.id = 'concurrent_booking';
  saveStalk(stalk);
  const results = await Promise.all([
    bookSlot(stalk.id, stalk.foundSlot!, stalk.restaurantId),
    bookSlot(stalk.id, stalk.foundSlot!, stalk.restaurantId),
  ]);
  assert.equal(results.filter(result => result.success).length, 1);
  assert.equal(results.find(result => !result.success)?.error, 'Booking already in progress');
  assert.equal(getStalk(stalk.id)?.state, 'BOOKED');
  assert.equal(getStalk(stalk.id)?.bookingId, results.find(result => result.success)?.bookingId);
});

test('a late poll cannot change a stalk after a slot is selected or booked', async (t) => {
  t.mock.method(Math, 'random', () => 0.5);
  for (const state of ['SLOT_FOUND', 'BOOKED'] as const) {
    const stalk = structuredClone(getStalk('stalk_demo_01')!);
    stalk.id = `late_poll_${state}`;
    saveStalk(stalk);
    const pendingPoll = pollStalk(stalk.id);
    stalk.state = state;
    stalk.foundSlot = '7:45 PM';
    stalk.bookingId = state === 'BOOKED' ? 'existing_booking' : null;
    const expected = structuredClone(stalk);
    const result = await pendingPoll;
    assert.equal(result.success, false);
    assert.deepEqual(getStalk(stalk.id), expected);
  }
});

test('an unavailable slot releases the booking guard for a later confirmation', async (t) => {
  const random = t.mock.method(Math, 'random', () => 0.95);
  const stalk = structuredClone(getStalk('stalk_demo_02')!);
  stalk.id = 'retry_booking';
  saveStalk(structuredClone(stalk));
  const failed = await bookSlot(stalk.id, stalk.foundSlot!, stalk.restaurantId);
  assert.equal(failed.success, false);
  assert.equal(getStalk(stalk.id)?.state, 'WATCHING');
  assert.equal(getStalk(stalk.id)?.foundSlot, null);

  random.mock.mockImplementation(() => 0.5);
  saveStalk(stalk);
  const retried = await bookSlot(stalk.id, stalk.foundSlot!, stalk.restaurantId);
  assert.equal(retried.success, true);
  assert.equal(getStalk(stalk.id)?.state, 'BOOKED');
});
