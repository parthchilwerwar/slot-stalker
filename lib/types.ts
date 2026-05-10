// lib/types.ts — All shared TypeScript types for Slot Stalker

export type StalkState = 'WATCHING' | 'SLOT_FOUND' | 'BOOKED' | 'EXPIRED';

export interface StalkRequest {
  restaurantName: string;
  city: string;
  date: string;           // "2026-06-14"
  guests: number;
  preferredFrom: string;  // "20:00"
  preferredTo: string;    // "21:30"
}

export interface Alternative {
  id: string;
  name: string;
  cuisine: string;
  priceRange: number;     // 1-4 (₹ tiers)
  rating: number;
  bestAvailableSlot: string | null;
  matchScore: number;     // 0-100
}

export interface PollRecord {
  polledAt: number;       // Unix ms
  slotsFound: string[];   // e.g. ["7:45 PM", "9:00 PM"] or []
  newSlotDetected: boolean;
}

export interface StalkRecord {
  id: string;
  userId: string;
  request: StalkRequest;
  restaurantId: string;
  state: StalkState;
  pollCount: number;
  polls: PollRecord[];
  createdAt: number;
  lastPolledAt: number | null;
  slotFoundAt: number | null;
  foundSlot: string | null;
  bookingId: string | null;
  alternates: Alternative[];
  expiresAt: number;      // createdAt + 7 days in ms
}

export interface ParsedIntent {
  restaurantName: string;
  city: string;
  date: string;
  guests: number;
  preferredFrom: string;
  preferredTo: string;
  confidence: number;     // 0-1
}

// MCP response shapes
export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  priceRange: number;
  rating: number;
  address: string;
}

export interface RestaurantDetails extends Restaurant {
  imageUrl: string;
  openingHours: string;
  features: string[];
}

export interface CartResult {
  cartId: string;
}

export interface BookingResult {
  bookingId?: string;
  status?: string;
  error?: string;
}

export interface BookingStatus {
  bookingId: string;
  status: string;
  restaurantName: string;
  date: string;
  time: string;
  guests: number;
}

export interface SavedLocation {
  id: string;
  city: string;
  isPrimary: boolean;
}
