# Slot Stalker — Swiggy Dineout MCP Agent

## Tech stack with versions
- Next.js 16.2.6
- React 19.2.x
- TypeScript 5.8.x
- Tailwind CSS 4.1.x
- Groq SDK (Latest)
- Anthropic AI SDK (Latest)

## Getting started
1. Install dependencies with `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in the necessary keys.
3. Run the development server with `npm run dev`

## Project structure
- `app/` - Next.js App Router
- `components/` - React Components
- `lib/` - Utility functions, types, and state management

## Demo mode explanation
To run the app without real Swiggy API, ensure `NEXT_PUBLIC_DEMO_MODE=true` is set in your `.env.local`.

## How to connect real Swiggy Dineout MCP
Provide `SWIGGY_DINEOUT_MCP_URL`, `SWIGGY_CLIENT_ID`, and `SWIGGY_CLIENT_SECRET` in your `.env.local` to connect to the real Swiggy environment. Set `NEXT_PUBLIC_DEMO_MODE=false`.

## Built for Swiggy Builders Club

## MIT License
