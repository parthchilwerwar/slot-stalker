// lib/mock-mcp.ts — Simulates Swiggy Dineout MCP responses
// Replace each function with real MCP tool call when credentials arrive

import type {
  Restaurant,
  RestaurantDetails,
  CartResult,
  BookingResult,
  BookingStatus,
  SavedLocation,
} from './types';

// Seeded pseudo-random — deterministic per restaurantId for stable UI
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

function seededRandomWithSalt(seed: string, salt: string): number {
  return seededRandom(seed + salt);
}

const MOCK_RESTAURANTS: Restaurant[] = [
  { id: 'rest_001', name: 'Punjab Grill', cuisine: 'North Indian', priceRange: 3, rating: 4.5, address: '123 MG Road, Bengaluru' },
  { id: 'rest_002', name: 'Karavalli', cuisine: 'South Indian', priceRange: 4, rating: 4.7, address: '45 Residency Road, Bengaluru' },
  { id: 'rest_003', name: 'Farzi Cafe', cuisine: 'Modern Indian', priceRange: 3, rating: 4.3, address: '78 Brigade Road, Bengaluru' },
  { id: 'rest_004', name: 'Shiro', cuisine: 'Pan-Asian', priceRange: 4, rating: 4.4, address: '12 UB City, Bengaluru' },
  { id: 'rest_005', name: 'Truffles', cuisine: 'American', priceRange: 2, rating: 4.6, address: '56 Koramangala, Bengaluru' },
  { id: 'rest_006', name: 'Chinita', cuisine: 'Mexican', priceRange: 2, rating: 4.2, address: '34 Indiranagar, Bengaluru' },
  { id: 'rest_007', name: 'Toscano', cuisine: 'Italian', priceRange: 3, rating: 4.5, address: '90 UB City, Bengaluru' },
  { id: 'rest_008', name: 'Burma Burma', cuisine: 'Burmese', priceRange: 3, rating: 4.4, address: '22 Church Street, Bengaluru' },
  { id: 'rest_009', name: 'Edo Japanese', cuisine: 'Japanese', priceRange: 4, rating: 4.6, address: '67 ITC Gardenia, Bengaluru' },
  { id: 'rest_010', name: 'The Permit Room', cuisine: 'South Indian', priceRange: 2, rating: 4.3, address: '11 Lavelle Road, Bengaluru' },
  { id: 'rest_011', name: 'Bombay Brasserie', cuisine: 'North Indian', priceRange: 3, rating: 4.4, address: '88 CBD, Bengaluru' },
  { id: 'rest_012', name: 'Olive Beach', cuisine: 'Mediterranean', priceRange: 3, rating: 4.3, address: '16 Ashok Nagar, Bengaluru' },
  { id: 'rest_013', name: 'Bao House', cuisine: 'Chinese', priceRange: 2, rating: 4.1, address: '5 HSR Layout, Bengaluru' },
  { id: 'rest_014', name: 'Masala Library', cuisine: 'Modern Indian', priceRange: 4, rating: 4.8, address: '99 The Leela, Bengaluru' },
  { id: 'rest_015', name: 'Rajdhani Thali', cuisine: 'Rajasthani', priceRange: 2, rating: 4.2, address: '44 Jayanagar, Bengaluru' },
];

const MUMBAI_RESTAURANTS: Restaurant[] = [
  { id: 'rest_m01', name: 'Trishna', cuisine: 'South Indian', priceRange: 3, rating: 4.6, address: '7 Kala Ghoda, Mumbai' },
  { id: 'rest_m02', name: 'Bastian', cuisine: 'Continental', priceRange: 4, rating: 4.5, address: '12 Bandra, Mumbai' },
  { id: 'rest_m03', name: 'Peshawri', cuisine: 'North Indian', priceRange: 4, rating: 4.7, address: 'ITC Maratha, Mumbai' },
  { id: 'rest_m04', name: 'Yauatcha', cuisine: 'Chinese', priceRange: 4, rating: 4.5, address: 'BKC, Mumbai' },
  { id: 'rest_m05', name: 'The Table', cuisine: 'Continental', priceRange: 3, rating: 4.4, address: 'Colaba, Mumbai' },
  { id: 'rest_m06', name: 'Masala Bar', cuisine: 'Modern Indian', priceRange: 3, rating: 4.3, address: 'Lower Parel, Mumbai' },
  { id: 'rest_m07', name: 'Hakkasan', cuisine: 'Chinese', priceRange: 4, rating: 4.6, address: 'Bandra, Mumbai' },
  { id: 'rest_m08', name: 'Café Zoe', cuisine: 'Mediterranean', priceRange: 2, rating: 4.2, address: 'Lower Parel, Mumbai' },
];

const ALL_RESTAURANTS = [...MOCK_RESTAURANTS, ...MUMBAI_RESTAURANTS];

const SLOT_OPTIONS = [
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM',
  '7:00 PM', '7:30 PM', '7:45 PM', '8:00 PM', '8:15 PM',
  '8:30 PM', '8:45 PM', '9:00 PM', '9:15 PM', '9:30 PM', '9:45 PM',
];

export async function mock_search_restaurants_dineout(
  query: string,
  city: string
): Promise<Restaurant[]> {
  await simulateLatency(200, 400);

  const q = query.toLowerCase();
  const c = city?.toLowerCase() || '';

  // Filter by city first
  let pool = ALL_RESTAURANTS;
  if (c.includes('mumbai')) {
    pool = MUMBAI_RESTAURANTS;
  } else if (c.includes('bengaluru') || c.includes('bangalore')) {
    pool = MOCK_RESTAURANTS;
  }

  // Fuzzy match by name or cuisine
  const results = pool.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.cuisine.toLowerCase().includes(q) ||
    q.includes(r.name.toLowerCase().split(' ')[0])
  );

  // If exact match found, put it first then add similar cuisine restaurants
  if (results.length > 0) {
    const remaining = pool.filter(r => !results.includes(r));
    return [...results, ...remaining.slice(0, 7 - results.length)];
  }

  // Fallback: return top 6 from pool
  return pool.slice(0, 6);
}

export async function mock_get_available_slots(
  restaurantId: string,
  date: string,
  guests: number
): Promise<string[]> {
  await simulateLatency(300, 600);

  const rand = seededRandomWithSalt(restaurantId, date + String(guests));

  // 70% fully booked, 20% 1-2 slots, 10% 3+ slots
  if (rand < 0.70) {
    return [];
  } else if (rand < 0.90) {
    const count = Math.floor(seededRandomWithSalt(restaurantId, 'count') * 2) + 1;
    return pickSlots(restaurantId, count);
  } else {
    const count = Math.floor(seededRandomWithSalt(restaurantId, 'count3') * 3) + 3;
    return pickSlots(restaurantId, count);
  }
}

function pickSlots(seed: string, count: number): string[] {
  const slots: string[] = [];
  const used = new Set<number>();

  for (let i = 0; i < count && i < SLOT_OPTIONS.length; i++) {
    let idx = Math.floor(seededRandomWithSalt(seed, `slot_${i}`) * SLOT_OPTIONS.length);
    while (used.has(idx)) {
      idx = (idx + 1) % SLOT_OPTIONS.length;
    }
    used.add(idx);
    slots.push(SLOT_OPTIONS[idx]);
  }

  return slots.sort();
}

export async function mock_get_restaurant_details(
  restaurantId: string
): Promise<RestaurantDetails | null> {
  await simulateLatency(100, 300);

  const r = ALL_RESTAURANTS.find(x => x.id === restaurantId);
  if (!r) return null;

  return {
    ...r,
    imageUrl: `https://source.unsplash.com/400x300/?restaurant,${r.cuisine.toLowerCase()}`,
    openingHours: '12:00 PM – 11:00 PM',
    features: ['AC Dining', 'Valet Parking', 'Live Music', 'Outdoor Seating'].slice(
      0,
      Math.floor(seededRandom(restaurantId + 'feat') * 3) + 2
    ),
  };
}

export async function mock_create_cart(
  restaurantId: string,
  slot: string,
  guests: number,
  date: string
): Promise<CartResult> {
  await simulateLatency(200, 500);
  const cartNum = Math.floor(Math.random() * 9000) + 1000;
  return { cartId: `CART-${cartNum}` };
}

export async function mock_book_table(
  cartId: string
): Promise<BookingResult> {
  await simulateLatency(500, 1000);

  // 90% success rate
  if (Math.random() < 0.90) {
    const bookingNum = Math.floor(Math.random() * 9000) + 1000;
    return {
      bookingId: `BKG-${bookingNum}`,
      status: 'CONFIRMED',
    };
  }
  return { error: 'Slot no longer available' };
}

export async function mock_get_booking_status(
  bookingId: string,
  restaurantName: string,
  date: string,
  time: string,
  guests: number
): Promise<BookingStatus> {
  await simulateLatency(100, 200);
  return {
    bookingId,
    status: 'CONFIRMED',
    restaurantName,
    date,
    time,
    guests,
  };
}

export async function mock_get_saved_locations(
  userId: string
): Promise<SavedLocation[]> {
  await simulateLatency(50, 100);
  return [
    { id: '1', city: 'Bengaluru', isPrimary: true },
    { id: '2', city: 'Mumbai', isPrimary: false },
  ];
}

function simulateLatency(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  return new Promise(resolve => setTimeout(resolve, ms));
}
