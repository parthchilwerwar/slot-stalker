TECHNICAL DESIGN REQUIREMENTS DOCUMENT
Project: Slot Stalker — Swiggy Dineout MCP Agent
Author: Parth Chilwerwar
Version: 1.0
Date: May 2026
Stack: Next.js 14 · Groq API · Claude Sonnet 4.6 · Mock MCP Layer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. TECH STACK DECISIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPONENT          TECHNOLOGY               REASON
─────────────────────────────────────────────────────
Language           TypeScript 5.4           Type safety for MCP shapes
Framework          Next.js 14 App Router    API routes + UI in one repo
LLM (intent)       Groq — llama-3.3-70b     Free tier, fast, good at
                   -versatile               structured JSON extraction
LLM (agent)        Claude Sonnet 4.6        Best tool-use reliability
                   Anthropic SDK            when live MCP is wired up
State store        In-memory Map (demo)     No Redis needed for demo
                   → Redis (production)
Scheduling         setInterval (demo)       Simulates polling loop
                   → BullMQ (production)    without infrastructure
Notifications      Console log (demo)       Replace with Twilio later
                   → Twilio WhatsApp (prod)
Styling            Tailwind CSS             Utility-first, fast
UI components      shadcn/ui                Accessible, unstyled base
Deployment         Vercel                   Free tier, Next.js native

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. REPOSITORY STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

slot-stalker/
├── app/
│   ├── page.tsx                  # Dashboard — all active stalks
│   ├── stalk/
│   │   └── new/page.tsx          # Create new stalk form
│   ├── api/
│   │   ├── stalk/
│   │   │   ├── create/route.ts   # POST — create new stalk
│   │   │   ├── list/route.ts     # GET — all stalks for user
│   │   │   └── [id]/route.ts     # GET/PATCH — single stalk
│   │   ├── poll/route.ts         # POST — manually trigger poll (demo)
│   │   └── book/route.ts         # POST — confirm booking
├── lib/
│   ├── agent.ts                  # Core agent orchestration
│   ├── groq.ts                   # Groq client + intent parsing
│   ├── mock-mcp.ts               # Mock Dineout MCP responses
│   ├── scoring.ts                # Alternative scoring algorithm
│   ├── state.ts                  # In-memory stalk state store
│   └── types.ts                  # All shared TypeScript types
├── components/
│   ├── StalkCard.tsx             # Single stalk display card
│   ├── StalkDashboard.tsx        # All stalks grid
│   ├── CreateStalkForm.tsx       # NL input + confirmation
│   ├── AlternativesList.tsx      # 3 scored alternatives
│   ├── PollTimeline.tsx          # Poll history + countdown
│   └── BookingConfirm.tsx        # SLOT_FOUND confirmation UI
├── .env.local                    # API keys
└── README.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. TYPESCRIPT TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// lib/types.ts

type StalkState =
  | 'WATCHING'
  | 'SLOT_FOUND'
  | 'BOOKED'
  | 'EXPIRED'

interface StalkRequest {
  restaurantName: string
  city: string
  date: string           // "2026-06-14"
  guests: number
  preferredFrom: string  // "20:00"
  preferredTo: string    // "21:30"
}

interface Alternative {
  id: string
  name: string
  cuisine: string
  priceRange: number     // 1-4 (₹ tiers)
  rating: number
  bestAvailableSlot: string | null
  matchScore: number     // 0-100
}

interface PollRecord {
  polledAt: number       // Unix ms
  slotsFound: string[]   // e.g. ["7:45 PM", "9:00 PM"] or []
  newSlotDetected: boolean
}

interface StalkRecord {
  id: string
  userId: string
  request: StalkRequest
  restaurantId: string
  state: StalkState
  pollCount: number
  polls: PollRecord[]
  createdAt: number
  lastPolledAt: number | null
  slotFoundAt: number | null
  foundSlot: string | null
  bookingId: string | null
  alternates: Alternative[]
  expiresAt: number      // createdAt + 7 days in ms
}

interface ParsedIntent {
  restaurantName: string
  city: string
  date: string
  guests: number
  preferredFrom: string
  preferredTo: string
  confidence: number     // 0-1
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. GROQ INTEGRATION — INTENT PARSING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// lib/groq.ts
// Uses Groq free tier — llama-3.3-70b-versatile
// Parses natural language into structured stalk request

SYSTEM PROMPT FOR GROQ:
"""
You are an intent parser for a restaurant reservation agent.
Extract structured data from the user's natural language request.
Return ONLY valid JSON. No explanation. No markdown. Pure JSON.

Output format:
{
  "restaurantName": string,
  "city": string,
  "date": string (YYYY-MM-DD format),
  "guests": number,
  "preferredFrom": string (HH:MM 24hr format),
  "preferredTo": string (HH:MM 24hr format),
  "confidence": number (0 to 1)
}

Today's date for reference: [inject current date]

Rules:
- If date is relative ("this Saturday", "next Friday"), resolve to exact date
- If only one time is mentioned, set preferredFrom = that time,
  preferredTo = preferredFrom + 1.5 hours
- If guests not mentioned, default to 2
- If city not mentioned, set city to null
- confidence = how sure you are the extraction is correct (0-1)
"""

USER MESSAGE: [the user's raw text]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. MOCK MCP LAYER — demo data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// lib/mock-mcp.ts
// Simulates Swiggy Dineout MCP responses
// Replace each function with real MCP tool call when credentials arrive

MOCK FUNCTIONS TO IMPLEMENT:

mock_search_restaurants_dineout(query, city)
  → Returns array of restaurant objects:
    { id, name, cuisine, priceRange, rating, address }
  → Return 5-8 results with realistic Indian restaurant names

mock_get_available_slots(restaurantId, date, guests)
  → Behaviour: 70% chance returns [] (fully booked)
              20% chance returns 1-2 slots
              10% chance returns 3+ slots
  → Slots are strings like "7:30 PM", "8:00 PM", "9:15 PM"
  → Make it deterministic per restaurantId so the UI is stable
    (use restaurantId as seed for the random behaviour)

mock_get_restaurant_details(restaurantId)
  → Returns: { id, name, address, cuisine, rating, priceRange,
               imageUrl, openingHours, features }

mock_create_cart(restaurantId, slot, guests, date)
  → Always succeeds in demo
  → Returns: { cartId: "CART-" + random 4 digits }

mock_book_table(cartId)
  → 90% success rate
  → Returns on success: { bookingId: "BKG-" + random 4 digits,
                          status: "CONFIRMED" }
  → Returns on failure: { error: "Slot no longer available" }

mock_get_booking_status(bookingId)
  → Returns: { bookingId, status: "CONFIRMED",
               restaurantName, date, time, guests }

mock_get_saved_locations(userId)
  → Returns array of saved cities:
    [{ id: "1", city: "Bengaluru", isPrimary: true },
     { id: "2", city: "Mumbai", isPrimary: false }]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. SCORING ALGORITHM IMPLEMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// lib/scoring.ts

function scoreAlternate(candidate, target, preferredFrom):
  
  CUISINE_FAMILIES = {
    "Indian": ["North Indian", "South Indian", "Mughlai",
               "Modern Indian", "Punjabi", "Rajasthani"],
    "Asian": ["Chinese", "Japanese", "Thai", "Korean", "Pan-Asian"],
    "Western": ["Italian", "Continental", "American", "Mediterranean"],
    "Middle Eastern": ["Lebanese", "Persian", "Arabian"]
  }

  cuisineScore:
    if candidate.cuisine === target.cuisine → 100
    if same family in CUISINE_FAMILIES → 70
    if adjacent family → 40
    else → 10

  priceScore:
    delta = abs(candidate.priceRange - target.priceRange)
    0 → 100 | 1 → 60 | 2+ → 20

  slotScore:
    if candidate.bestAvailableSlot is null → 0
    diff = abs(minutesSinceMidnight(candidate.bestAvailableSlot)
             - minutesSinceMidnight(preferredFrom))
    ≤30 → 100 | ≤60 → 70 | ≤120 → 40 | >120 → 10

  ratingScore:
    delta = target.rating - candidate.rating
    ≤0 → 100 | ≤0.3 → 70 | >0.3 → 30

  return round(cuisineScore*0.35 + priceScore*0.25
             + slotScore*0.25 + ratingScore*0.15)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. STATE MACHINE — TRANSITION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Valid transitions only:

IDLE → WATCHING           [trigger: user creates stalk]
WATCHING → WATCHING       [trigger: poll returns 0 slots — re-queue]
WATCHING → SLOT_FOUND     [trigger: poll returns new slot]
WATCHING → EXPIRED        [trigger: 7 days elapsed]
SLOT_FOUND → BOOKED       [trigger: user confirms booking]
SLOT_FOUND → WATCHING     [trigger: 15-min window expires without confirm]
                       OR [trigger: book_table fails — slot taken]

In demo: all transitions happen immediately via API calls.
In production: WATCHING → WATCHING is driven by BullMQ job queue.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. API ROUTES SPEC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POST /api/stalk/create
Body: { rawText: string, userId: string }
Flow:
  1. Send rawText to Groq → ParsedIntent
  2. If confidence < 0.7 → return clarification request
  3. Call mock_search_restaurants_dineout
  4. Call mock_get_available_slots for target (× 1)
  5. Call mock_search_restaurants_dineout for 5 alternatives
  6. Call mock_get_available_slots for each alternative (× 5)
  7. Score top 3 alternatives via scoring algorithm
  8. Save StalkRecord to state store (state: WATCHING)
  9. Return: { stalk: StalkRecord }

POST /api/poll  (demo: manually trigger one poll cycle)
Body: { stalkId: string }
Flow:
  1. Load stalk from state store
  2. Guard: stalk.state must be WATCHING
  3. Call mock_get_available_slots
  4. Diff against stalk.polls[last].slotsFound
  5. If new slot detected: transition to SLOT_FOUND
  6. Else: increment pollCount, re-save, schedule next poll
  7. Return: { stalk: updated StalkRecord }

POST /api/book
Body: { stalkId: string, slot: string, restaurantId: string }
Flow:
  1. Guard: stalk.state must be SLOT_FOUND
  2. Call mock_create_cart
  3. Call mock_book_table
  4. If success: call mock_get_booking_status
     → transition to BOOKED, save bookingId
  5. If failure (race condition):
     → transition back to WATCHING, return error
  6. Return: { success: boolean, bookingId?: string, stalk: StalkRecord }

GET /api/stalk/list
Query: { userId: string }
Return: { stalks: StalkRecord[] }

GET /api/stalk/[id]
Return: { stalk: StalkRecord }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. ENVIRONMENT VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# .env.local

# Groq (free tier — get from console.groq.com)
GROQ_API_KEY=gsk_...

# Anthropic (for when live MCP is wired)
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true

# Future — leave blank until MCP access granted
SWIGGY_DINEOUT_MCP_URL=
SWIGGY_CLIENT_ID=
SWIGGY_CLIENT_SECRET=

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. DEMO MODE vs PRODUCTION MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEMO_MODE=true (current build):
  - All MCP calls → mock-mcp.ts functions
  - Polling: triggered manually by "Simulate Poll" button
  - State: in-memory Map (resets on server restart)
  - Pre-loaded: 5 mock stalks covering all states
  - LLM: Groq for intent parsing (real API call)
  - No auth required

PRODUCTION (after MCP access):
  - Swap mock-mcp.ts → real Anthropic MCP client calls
  - Polling: BullMQ + Redis scheduled jobs
  - State: Redis hashes with TTL
  - Notifications: Twilio WhatsApp
  - Auth: NextAuth.js with Swiggy OAuth