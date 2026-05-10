# Slot Stalker — Swiggy Dineout MCP Agent

Slot Stalker is an AI-powered conversational web agent designed to help users effortlessly find, track, and manage restaurant reservations. Built for the **Swiggy Builders Club**, it leverages LLMs and the Swiggy Dineout MCP (Model Context Protocol) to parse natural language queries, automatically execute booking workflows, and continuously monitor unavailable slots until a table opens up.

## How It Works
1. **Natural Language Intent Parsing**: Uses the Groq API (Llama 3) to extract structured booking requests (e.g., *"Book Indian Accent for 2 this Saturday at 8pm"* → `JSON`).
2. **Continuous Polling (Stalking)**: Enters a `WATCHING` state to constantly monitor restaurant availability.
3. **Smart Alternatives**: If the desired slot isn't available, it scores and suggests the top 3 alternatives based on Cuisine, Price Range, Time Proximity, and Ratings.
4. **Seamless Booking**: Transitions to `SLOT_FOUND` and eventually `BOOKED` upon user confirmation using Swiggy's Dineout API.

## Tech Stack
- **Framework**: Next.js 16.2.6 (App Router)
- **UI**: React 19.2.x, Tailwind CSS 4.1.x, shadcn/ui
- **Language**: TypeScript 5.8.x
- **AI/LLMs**: Groq SDK (Intent Parsing), Anthropic SDK (MCP Orchestration)
- **Architecture**: Stateful polling agent mechanism

## Getting Started

### Prerequisites
- Node.js 22.x or higher
- Groq API Key (for intent parsing)

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment variables file and fill in your keys:
   ```bash
   cp .env.local.example .env.local
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Demo Mode vs. Production

By default, the application runs in **Demo Mode**:
- Set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local`.
- Uses simulated Swiggy MCP responses (`lib/mock-mcp.ts`), in-memory state, and mock restaurant data to prevent live API hits.
- Perfect for UI testing and evaluating the agent logic and scoring algorithms.

To connect to the **Real Swiggy Dineout MCP**:
- Set `NEXT_PUBLIC_DEMO_MODE=false`.
- Provide `SWIGGY_DINEOUT_MCP_URL`, `SWIGGY_CLIENT_ID`, and `SWIGGY_CLIENT_SECRET` in `.env.local`.

## Project Structure
- `app/` - Next.js App Router UI and Backend API Routes (`/api/stalk/*`, `/api/poll/*`, `/api/book/*`).
- `components/` - React components including Dashboard, Stalk Cards, and Alternatives list.
- `lib/` - Core logic: `agent.ts` (orchestration), `groq.ts` (LLM intent), `scoring.ts` (alternatives algorithm), `state.ts` (in-memory store), and `mock-mcp.ts`.

## License
MIT License
