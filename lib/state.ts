// lib/state.ts — In-memory stalk state store with 5 demo stalks

import type { StalkRecord } from './types';

const store = new Map<string, StalkRecord>();

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// CRUD operations
export function getStalk(id: string): StalkRecord | undefined {
  return store.get(id);
}

export function saveStalk(stalk: StalkRecord): void {
  store.set(stalk.id, stalk);
}

export function getAllStalks(userId?: string): StalkRecord[] {
  const all = Array.from(store.values());
  if (userId) return all.filter(s => s.userId === userId);
  return all;
}

export function deleteStalk(id: string): boolean {
  return store.delete(id);
}

// Seed 5 demo stalks covering all states
function seedDemoData() {
  const now = Date.now();

  const demos: StalkRecord[] = [
    {
      id: 'stalk_demo_01',
      userId: 'demo_user',
      request: {
        restaurantName: 'Punjab Grill',
        city: 'Bengaluru',
        date: '2026-06-14',
        guests: 4,
        preferredFrom: '20:00',
        preferredTo: '21:30',
      },
      restaurantId: 'rest_001',
      state: 'WATCHING',
      pollCount: 3,
      polls: [
        { polledAt: now - 3600000, slotsFound: [], newSlotDetected: false },
        { polledAt: now - 1800000, slotsFound: [], newSlotDetected: false },
        { polledAt: now - 600000, slotsFound: [], newSlotDetected: false },
      ],
      createdAt: now - 86400000,
      lastPolledAt: now - 600000,
      slotFoundAt: null,
      foundSlot: null,
      bookingId: null,
      alternates: [
        { id: 'rest_011', name: 'Bombay Brasserie', cuisine: 'North Indian', priceRange: 3, rating: 4.4, bestAvailableSlot: '8:30 PM', matchScore: 82 },
        { id: 'rest_003', name: 'Farzi Cafe', cuisine: 'Modern Indian', priceRange: 3, rating: 4.3, bestAvailableSlot: '9:00 PM', matchScore: 68 },
        { id: 'rest_015', name: 'Rajdhani Thali', cuisine: 'Rajasthani', priceRange: 2, rating: 4.2, bestAvailableSlot: null, matchScore: 45 },
      ],
      expiresAt: now + SEVEN_DAYS - 86400000,
    },
    {
      id: 'stalk_demo_02',
      userId: 'demo_user',
      request: {
        restaurantName: 'Karavalli',
        city: 'Bengaluru',
        date: '2026-06-15',
        guests: 2,
        preferredFrom: '19:30',
        preferredTo: '21:00',
      },
      restaurantId: 'rest_002',
      state: 'SLOT_FOUND',
      pollCount: 7,
      polls: [
        { polledAt: now - 7200000, slotsFound: [], newSlotDetected: false },
        { polledAt: now - 5400000, slotsFound: [], newSlotDetected: false },
        { polledAt: now - 3600000, slotsFound: [], newSlotDetected: false },
        { polledAt: now - 1800000, slotsFound: [], newSlotDetected: false },
        { polledAt: now - 1200000, slotsFound: [], newSlotDetected: false },
        { polledAt: now - 600000, slotsFound: [], newSlotDetected: false },
        { polledAt: now - 120000, slotsFound: ['7:45 PM', '8:30 PM'], newSlotDetected: true },
      ],
      createdAt: now - 172800000,
      lastPolledAt: now - 120000,
      slotFoundAt: now - 120000,
      foundSlot: '7:45 PM',
      bookingId: null,
      alternates: [
        { id: 'rest_010', name: 'The Permit Room', cuisine: 'South Indian', priceRange: 2, rating: 4.3, bestAvailableSlot: '8:00 PM', matchScore: 75 },
        { id: 'rest_014', name: 'Masala Library', cuisine: 'Modern Indian', priceRange: 4, rating: 4.8, bestAvailableSlot: '7:30 PM', matchScore: 58 },
      ],
      expiresAt: now + SEVEN_DAYS - 172800000,
    },
    {
      id: 'stalk_demo_03',
      userId: 'demo_user',
      request: {
        restaurantName: 'Toscano',
        city: 'Bengaluru',
        date: '2026-06-10',
        guests: 6,
        preferredFrom: '13:00',
        preferredTo: '14:30',
      },
      restaurantId: 'rest_007',
      state: 'BOOKED',
      pollCount: 5,
      polls: [
        { polledAt: now - 259200000, slotsFound: [], newSlotDetected: false },
        { polledAt: now - 172800000, slotsFound: [], newSlotDetected: false },
        { polledAt: now - 86400000, slotsFound: ['1:00 PM'], newSlotDetected: true },
      ],
      createdAt: now - 345600000,
      lastPolledAt: now - 86400000,
      slotFoundAt: now - 86400000,
      foundSlot: '1:00 PM',
      bookingId: 'BKG-4821',
      alternates: [],
      expiresAt: now + SEVEN_DAYS - 345600000,
    },
    {
      id: 'stalk_demo_04',
      userId: 'demo_user',
      request: {
        restaurantName: 'Shiro',
        city: 'Bengaluru',
        date: '2026-05-28',
        guests: 2,
        preferredFrom: '20:00',
        preferredTo: '21:30',
      },
      restaurantId: 'rest_004',
      state: 'EXPIRED',
      pollCount: 42,
      polls: [
        { polledAt: now - 604800000, slotsFound: [], newSlotDetected: false },
      ],
      createdAt: now - 604800000 - 86400000,
      lastPolledAt: now - 604800000,
      slotFoundAt: null,
      foundSlot: null,
      bookingId: null,
      alternates: [
        { id: 'rest_009', name: 'Edo Japanese', cuisine: 'Japanese', priceRange: 4, rating: 4.6, bestAvailableSlot: null, matchScore: 62 },
      ],
      expiresAt: now - 86400000,
    },
    {
      id: 'stalk_demo_05',
      userId: 'demo_user',
      request: {
        restaurantName: 'Trishna',
        city: 'Mumbai',
        date: '2026-06-20',
        guests: 3,
        preferredFrom: '19:00',
        preferredTo: '20:30',
      },
      restaurantId: 'rest_m01',
      state: 'WATCHING',
      pollCount: 1,
      polls: [
        { polledAt: now - 300000, slotsFound: [], newSlotDetected: false },
      ],
      createdAt: now - 7200000,
      lastPolledAt: now - 300000,
      slotFoundAt: null,
      foundSlot: null,
      bookingId: null,
      alternates: [
        { id: 'rest_m03', name: 'Peshawri', cuisine: 'North Indian', priceRange: 4, rating: 4.7, bestAvailableSlot: '7:30 PM', matchScore: 55 },
        { id: 'rest_m05', name: 'The Table', cuisine: 'Continental', priceRange: 3, rating: 4.4, bestAvailableSlot: '8:00 PM', matchScore: 42 },
      ],
      expiresAt: now + SEVEN_DAYS - 7200000,
    },
  ];

  demos.forEach(d => store.set(d.id, d));
}

// Auto-seed on import
seedDemoData();
