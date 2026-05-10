// lib/agent.ts — Core agent orchestration: createStalk, pollStalk, bookSlot

import { v4 as uuidv4 } from 'uuid';
import { parseIntent } from './groq';
import {
  mock_search_restaurants_dineout,
  mock_get_available_slots,
  mock_create_cart,
  mock_book_table,
  mock_get_booking_status,
} from './mock-mcp';
import { scoreAlternate } from './scoring';
import { getStalk, saveStalk } from './state';
import type { StalkRecord, Alternative } from './types';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export async function createStalk(rawText: string, userId: string) {
  // 1. Parse intent
  const intent = await parseIntent(rawText);

  if (intent.confidence < 0.7) {
    return {
      success: false,
      needsClarification: true,
      intent,
      error: 'Low confidence — please rephrase your request with restaurant name, date, and time.',
    };
  }

  // 2. Search for target restaurant
  const searchResults = await mock_search_restaurants_dineout(
    intent.restaurantName,
    intent.city
  );

  if (searchResults.length === 0) {
    return {
      success: false,
      error: `No restaurants found matching "${intent.restaurantName}" in ${intent.city}`,
    };
  }

  const target = searchResults[0];

  // 3. Check slots for target
  const targetSlots = await mock_get_available_slots(target.id, intent.date, intent.guests);

  // 4. Get alternatives (remaining search results)
  const altCandidates = searchResults.slice(1, 6);

  // 5. Check slots for each alternative in parallel
  const altSlotResults = await Promise.all(
    altCandidates.map(alt =>
      mock_get_available_slots(alt.id, intent.date, intent.guests)
    )
  );

  // 6. Score and rank top 3 alternatives
  const scoredAlts: Alternative[] = altCandidates.map((alt, i) => {
    const slots = altSlotResults[i];
    const bestSlot = slots.length > 0 ? slots[0] : null;

    return {
      id: alt.id,
      name: alt.name,
      cuisine: alt.cuisine,
      priceRange: alt.priceRange,
      rating: alt.rating,
      bestAvailableSlot: bestSlot,
      matchScore: scoreAlternate(
        { cuisine: alt.cuisine, priceRange: alt.priceRange, rating: alt.rating, bestAvailableSlot: bestSlot },
        { cuisine: target.cuisine, priceRange: target.priceRange, rating: target.rating },
        intent.preferredFrom
      ),
    };
  });

  scoredAlts.sort((a, b) => b.matchScore - a.matchScore);
  const topAlts = scoredAlts.slice(0, 3);

  // 7. Build stalk record
  const now = Date.now();
  const stalk: StalkRecord = {
    id: uuidv4(),
    userId,
    request: {
      restaurantName: target.name,
      city: intent.city,
      date: intent.date,
      guests: intent.guests,
      preferredFrom: intent.preferredFrom,
      preferredTo: intent.preferredTo,
    },
    restaurantId: target.id,
    state: targetSlots.length > 0 ? 'SLOT_FOUND' : 'WATCHING',
    pollCount: 1,
    polls: [{
      polledAt: now,
      slotsFound: targetSlots,
      newSlotDetected: targetSlots.length > 0,
    }],
    createdAt: now,
    lastPolledAt: now,
    slotFoundAt: targetSlots.length > 0 ? now : null,
    foundSlot: targetSlots.length > 0 ? targetSlots[0] : null,
    bookingId: null,
    alternates: topAlts,
    expiresAt: now + SEVEN_DAYS,
  };

  saveStalk(stalk);

  return { success: true, stalk, intent };
}

export async function pollStalk(stalkId: string) {
  const stalk = getStalk(stalkId);
  if (!stalk) return { success: false, error: 'Stalk not found' };

  // Guard: must be WATCHING
  if (stalk.state !== 'WATCHING') {
    return { success: false, error: `Cannot poll stalk in state ${stalk.state}` };
  }

  // Check expiry
  if (Date.now() > stalk.expiresAt) {
    stalk.state = 'EXPIRED';
    saveStalk(stalk);
    return { success: true, stalk, expired: true };
  }

  const slots = await mock_get_available_slots(stalk.restaurantId, stalk.request.date, stalk.request.guests);
  const lastPoll = stalk.polls[stalk.polls.length - 1];
  const previousSlots = new Set(lastPoll?.slotsFound || []);
  const newSlots = slots.filter(s => !previousSlots.has(s));
  const newSlotDetected = newSlots.length > 0;

  const now = Date.now();
  const pollRecord = { polledAt: now, slotsFound: slots, newSlotDetected };

  stalk.polls.push(pollRecord);
  stalk.pollCount += 1;
  stalk.lastPolledAt = now;

  if (newSlotDetected) {
    stalk.state = 'SLOT_FOUND';
    stalk.slotFoundAt = now;
    stalk.foundSlot = newSlots[0];
  }

  saveStalk(stalk);
  return { success: true, stalk, newSlotDetected, availableSlots: slots };
}

export async function bookSlot(stalkId: string, slot: string, restaurantId: string) {
  const stalk = getStalk(stalkId);
  if (!stalk) return { success: false, error: 'Stalk not found' };

  // Guard: must be SLOT_FOUND
  if (stalk.state !== 'SLOT_FOUND') {
    return { success: false, error: `Cannot book in state ${stalk.state}` };
  }

  // 1. Create cart
  const cart = await mock_create_cart(restaurantId, slot, stalk.request.guests, stalk.request.date);

  // 2. Book table
  const bookResult = await mock_book_table(cart.cartId);

  if (bookResult.error) {
    // Race condition — slot taken, go back to WATCHING
    stalk.state = 'WATCHING';
    stalk.slotFoundAt = null;
    stalk.foundSlot = null;
    saveStalk(stalk);
    return { success: false, error: bookResult.error, stalk };
  }

  // 3. Verify booking
  const status = await mock_get_booking_status(
    bookResult.bookingId!,
    stalk.request.restaurantName,
    stalk.request.date,
    slot,
    stalk.request.guests
  );

  stalk.state = 'BOOKED';
  stalk.bookingId = status.bookingId;
  saveStalk(stalk);

  return { success: true, bookingId: status.bookingId, bookingStatus: status, stalk };
}
