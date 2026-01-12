# Seira Codebase Documentation

> **Last Updated:** January 11, 2026
> **Status:** Pre-launch (MVP)
> **Critical Blocker:** Flight search is completely mocked

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Backend (API)](#3-backend-api)
4. [Frontend (Web)](#4-frontend-web)
5. [Database Schema](#5-database-schema)
6. [AI/LLM Integration](#6-aillm-integration)
7. [External APIs](#7-external-apis)
8. [Known Issues & Technical Debt](#8-known-issues--technical-debt)
9. [Environment Variables](#9-environment-variables)
10. [Deployment](#10-deployment)
11. [Recommended Improvements](#11-recommended-improvements)

---

## 1. Overview

**Seira** is an AI-powered travel planning assistant for event-first trips. Users describe an event they want to attend (concerts, sports, theater), and the AI helps find tickets, flights, and hotels.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Zustand |
| Backend | FastAPI (Python), Uvicorn |
| Database | Supabase (PostgreSQL + Auth) |
| Cache | Upstash Redis (optional, graceful degradation) |
| AI | Claude API (chat), Gemini API (web research) |
| Integrations | Ticketmaster Discovery API |
| Deployment | Vercel (frontend), Railway (backend) |

### What Works

- ✅ User authentication (Supabase Auth + JWT)
- ✅ Chat with Claude (streaming SSE)
- ✅ Event search (Ticketmaster + Gemini fallback)
- ✅ Web research (Gemini Search Grounding)
- ✅ Trip saving and management
- ✅ User preferences (home airport, cabin class, etc.)
- ✅ Dark/light theme toggle
- ✅ Responsive design (mobile + desktop)

### What Doesn't Work

- ❌ **Flight search is completely mocked** — returns fake data
- ❌ Hotel search not implemented
- ❌ Account deletion (frontend placeholder only)
- ❌ No real booking capability (links to external sites)

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Vercel (Frontend)                       │
│  Next.js 16 + React 19 + Zustand + Tailwind                  │
│  Routes: /, /login, /signup, /chat, /trips, /settings        │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS (fetch + SSE streams)
                        ▼
┌───────────────────────────────────────────────────────────────┐
│                    Railway (Backend API)                       │
│  FastAPI + Python 3.11                                         │
│  Endpoints: /chat, /conversations, /trips, /users, /metrics    │
└───────────┬───────────────┬───────────────┬──────────────────┘
            │               │               │
            ▼               ▼               ▼
      ┌─────────┐     ┌─────────┐     ┌─────────────┐
      │ Supabase│     │  Redis  │     │ External    │
      │ (Auth+DB)│    │ (Cache) │     │ APIs        │
      └─────────┘     └─────────┘     │ - Claude    │
                                      │ - Gemini    │
                                      │ - Ticketmaster│
                                      │ - (Duffel)  │
                                      └─────────────┘
```

### Request Flow (Chat)

```
1. User sends message → POST /api/v1/chat (SSE stream)
2. Backend loads conversation history from Supabase
3. Claude receives: system prompt + history + user message
4. Claude may call tools:
   - search_events → Ticketmaster API (+ Gemini fallback)
   - search_flights → MOCKED (returns fake data)
   - research_web → Gemini Search Grounding
   - save_trip → Supabase insert
5. Tool results fed back to Claude
6. Response streamed to frontend via SSE
7. Messages saved to Supabase
```

---

## 3. Backend (API)

**Location:** `/api`

### Directory Structure

```
api/
├── app/
│   ├── main.py                 # FastAPI app, CORS, health check
│   ├── ai/
│   │   ├── orchestrator.py     # CORE: Agentic loop (502 lines)
│   │   ├── client.py           # Claude streaming client
│   │   ├── prompts.py          # System prompt templates
│   │   ├── tokens.py           # Token counting & truncation
│   │   ├── metrics.py          # AI metrics (in-memory)
│   │   ├── sse.py              # SSE event formatting
│   │   ├── clients/
│   │   │   └── gemini.py       # Gemini Search Grounding
│   │   └── tools/
│   │       ├── registry.py     # Tool definitions
│   │       └── handlers.py     # Tool implementations
│   ├── api/v1/
│   │   ├── chat.py             # POST /chat (SSE stream)
│   │   ├── conversations.py    # Conversation CRUD
│   │   ├── messages.py         # Message operations
│   │   ├── trips.py            # Trip CRUD
│   │   ├── users.py            # User profile + preferences
│   │   └── metrics.py          # GET /metrics
│   ├── integrations/
│   │   └── ticketmaster.py     # Ticketmaster API client
│   ├── services/
│   │   ├── conversation.py     # Conversation business logic
│   │   ├── message.py          # Message operations
│   │   ├── trip.py             # Trip operations
│   │   └── user.py             # User operations
│   └── core/
│       ├── config.py           # Environment config
│       ├── auth.py             # JWT validation
│       ├── database.py         # Supabase client
│       └── redis.py            # Redis cache wrapper
└── requirements.txt
```

### Key Files

#### `app/ai/orchestrator.py` — The Core (502 lines)

The agentic loop that manages Claude tool execution.

**What it does:**
- Streams Claude responses via SSE
- Executes tool calls (max 6 rounds to prevent infinite loops)
- Truncates context when approaching 180,000 tokens
- Yields events: `text`, `tool_start`, `tool_input`, `tool_result`, `done`, `error`

**Issues:**
- Token estimation uses rough approximation (may overflow)
- Large tool results truncated to 50,000 chars (may lose data)
- No retry logic for transient failures
- Error messages truncated to 100 chars

#### `app/ai/tools/handlers.py` — Tool Implementations

| Tool | Status | Description |
|------|--------|-------------|
| `search_events` | ✅ Working | Ticketmaster API with Gemini fallback |
| `search_flights` | ❌ **MOCKED** | Returns hardcoded fake flights |
| `research_web` | ✅ Working | Gemini Search Grounding |
| `save_trip` | ✅ Working | Saves to Supabase |

**Critical Issue:** `search_flights` is completely stubbed:
```python
# handlers.py line ~150
# TODO: Integrate with real flight APIs (Duffel, Amadeus, etc.)
return {
    "flights": [
        {"price": 289, "carrier": "United", ...},  # FAKE DATA
        {"price": 312, "carrier": "Delta", ...},   # FAKE DATA
    ]
}
```

#### `app/integrations/ticketmaster.py` — Event Search (428 lines)

- Searches Ticketmaster Discovery API
- 15-minute cache TTL (Redis)
- Normalizes event data (venue, pricing, purchase URL)
- Falls back to Gemini if 0 results

**Issues:**
- No rate limiting on API calls
- MD5 cache key may have collisions
- Returns mock results if API key missing (should fail instead)

#### `app/api/v1/chat.py` — Chat Endpoint (382 lines)

- `POST /api/v1/chat` — Streams SSE response
- Auto-generates conversation titles
- Saves messages to database during stream

**Issues:**
- If error occurs mid-stream, database may be inconsistent
- Title generation has edge cases (empty strings, all punctuation)
- Error handling too broad (catches all exceptions)

#### `app/core/database.py` — Database Access

**Security Issue:** Uses `SERVICE_ROLE_KEY` which bypasses Row Level Security:
```python
supabase = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key  # ⚠️ Bypasses RLS
)
```

**Risk:** Any backend vulnerability could expose all user data.

---

## 4. Frontend (Web)

**Location:** `/web`

### Directory Structure

```
web/src/
├── app/
│   ├── layout.tsx              # Root layout + ThemeProvider
│   ├── page.tsx                # Landing page (/)
│   ├── error.tsx               # Global error boundary
│   ├── not-found.tsx           # 404 page
│   ├── (app)/                  # Protected routes (auth required)
│   │   ├── layout.tsx          # Sidebar layout
│   │   ├── error.tsx           # App error boundary
│   │   ├── loading.tsx         # Loading state
│   │   ├── chat/page.tsx       # /chat
│   │   ├── chat/[id]/page.tsx  # /chat/:id
│   │   ├── trips/page.tsx      # /trips
│   │   ├── trips/[id]/page.tsx # /trips/:id
│   │   └── settings/page.tsx   # /settings
│   ├── (auth)/                 # Auth routes (no auth required)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── callback/route.ts   # OAuth callback
│   │   └── forgot-password/page.tsx
│   └── (static)/               # Static pages
│       ├── privacy/page.tsx
│       └── terms/page.tsx
├── components/
│   ├── chat/                   # Chat UI components
│   ├── trips/                  # Trip management
│   ├── layout/                 # Sidebar, nav, user menu
│   └── ui/                     # Radix UI + Tailwind primitives
├── lib/
│   ├── api/client.ts           # API client (402 lines)
│   └── supabase/               # Supabase clients
├── stores/
│   ├── conversation-store.ts   # Chat state (Zustand)
│   └── user-store.ts           # User state (Zustand)
└── hooks/                      # Custom React hooks
```

### Key Files

#### `lib/api/client.ts` — API Client (402 lines)

Type-safe API client with SSE streaming support.

**Issues:**
- No request timeout configured (can hang indefinitely)
- 401 handling doesn't trigger logout (stale auth possible)
- HTTP 204 returns `undefined as T` (type casting hack)

```typescript
// Should add timeout:
const response = await fetch(url, {
  ...options,
  signal: AbortSignal.timeout(30000), // Missing!
});
```

#### `stores/conversation-store.ts` — Chat State (348 lines)

Zustand store for conversation state.

**Issues:**
- No localStorage persistence (state lost on refresh)
- Message ID uses `msg-${Date.now()}` (collision possible)
- Streaming message kept in memory (could be large)

#### `middleware.ts` — Route Protection

- Refreshes Supabase auth session
- Redirects based on auth state
- Protects `/chat`, `/trips`, `/settings`

#### `app/(app)/settings/page.tsx` — Settings

**Incomplete:**
```typescript
function handleDeleteAccount() {
  // TODO: Implement actual account deletion when backend supports it
  toast.info('contact support to delete your account')
}
```

---

## 5. Database Schema

**Provider:** Supabase (PostgreSQL)

### Tables

#### `conversations`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to auth.users |
| title | TEXT | Auto-generated from first message |
| context | JSONB | Conversation state (selected event, etc.) |
| message_count | INT | Number of messages |
| is_archived | BOOLEAN | Soft delete flag |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `messages`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | FK to conversations |
| role | TEXT | user, assistant, system, tool |
| content | TEXT | Message content |
| tool_calls | JSONB[] | Tool call definitions |
| tool_call_id | TEXT | For tool result messages |
| tokens_used | INT | Token count |
| created_at | TIMESTAMP | |

#### `trips`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to auth.users |
| title | TEXT | Trip name |
| status | TEXT | draft, quoted, booked, completed, cancelled |
| event_* | Various | Event details (name, date, venue, etc.) |
| flight_* | Various | Flight details (origin, destination, price) |
| hotel_* | Various | Hotel details (name, dates, price) |
| estimated_total | DECIMAL | Total cost estimate |
| created_at | TIMESTAMP | |

#### `users` (profile extension)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | FK to auth.users |
| name | TEXT | Display name |
| avatar_url | TEXT | Profile picture |

#### `user_preferences`
| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | Primary key |
| home_airport | TEXT | 3-letter code (LAX, JFK) |
| cabin_class | TEXT | economy, business, first |
| seat_preference | TEXT | window, aisle, middle |
| budget_default | DECIMAL | Default trip budget |

### Security

**Issue:** Backend uses `SERVICE_ROLE_KEY` which bypasses RLS policies. Any vulnerability exposes all data.

**Recommendation:** Use anon key with proper RLS policies instead.

---

## 6. AI/LLM Integration

### Claude (Primary Chat)

**Model:** `claude-haiku-4-5-20251101`
**Role:** Conversational AI, trip planning
**Max Tokens:** 4096 per response
**Context Limit:** 180,000 tokens (truncated automatically)

**System Prompt Includes:**
- User preferences (home airport, cabin class)
- Current date for temporal queries
- Tool usage instructions
- Response formatting guidelines

**Issues:**
- No prompt injection protection
- No per-user rate limiting
- Token estimation is approximate

### Gemini (Web Research)

**Model:** `gemini-3-flash-preview`
**Role:** Real-time web search via Search Grounding
**Timeout:** 10 seconds (may be too short)
**Cache:** 5-minute TTL

**Search Types:**
- `venue_info` — Parking, policies, accessibility
- `restaurant` — Dining recommendations
- `event_details` — Setlists, show info
- `tickets` — Pricing, availability
- `travel_tips` — Transportation, weather
- `accommodation` — Hotels, Airbnb
- `nightlife` — Bars, clubs
- `general` — Fallback

**Issues:**
- 10-second timeout too aggressive for complex queries
- No circuit breaker for repeated failures
- Metrics stored in-memory (lost on redeploy)

---

## 7. External APIs

### Ticketmaster Discovery API ✅

- Event search by keyword, city, date, genre
- Venue information
- Ticket purchase URLs
- 15-minute cache

### Duffel/Amadeus/Kiwi (Flights) ❌

**NOT IMPLEMENTED**

The `search_flights` tool returns hardcoded fake data:
```python
return {
    "flights": [
        {"price": 289, "carrier": "United", "origin": "LAX", ...},
        {"price": 312, "carrier": "Delta", "origin": "LAX", ...},
    ]
}
```

Users cannot search for or book real flights.

### Google Gemini ✅

- Search Grounding for real-time info
- Source citations included
- Fallback for Ticketmaster gaps

---

## 8. Known Issues & Technical Debt

### Critical (🔴 Blocking)

| Issue | Location | Impact |
|-------|----------|--------|
| Flight search mocked | `api/app/ai/tools/handlers.py` | Users get fake flight data |
| SERVICE_ROLE_KEY bypasses RLS | `api/app/core/database.py` | Security vulnerability |

### High (🟠 Should Fix)

| Issue | Location | Impact |
|-------|----------|--------|
| No request timeout | `web/src/lib/api/client.ts` | Requests can hang forever |
| 401 doesn't logout | `web/src/lib/api/client.ts` | Stale auth state |
| Tool results unbounded | `api/app/ai/orchestrator.py` | Context overflow possible |
| Stream error → inconsistent DB | `api/app/api/v1/chat.py` | Partial message saves |

### Medium (🟡 Should Address)

| Issue | Location | Impact |
|-------|----------|--------|
| No conversation persistence | `web/src/stores/conversation-store.ts` | State lost on refresh |
| Gemini 10s timeout | `api/app/core/config.py` | Timeouts on complex queries |
| Message ID collisions | `web/src/stores/conversation-store.ts` | Duplicate keys possible |
| In-memory metrics | `api/app/ai/metrics.py` | Lost on redeploy |
| Title generation edge cases | `api/app/api/v1/chat.py` | Rare UI issues |

### Low (🟢 Nice to Have)

| Issue | Location | Impact |
|-------|----------|--------|
| Account deletion not implemented | `web/src/app/(app)/settings/page.tsx` | Feature incomplete |
| MD5 cache key collisions | `api/app/integrations/ticketmaster.py` | Rare cache issues |
| No test coverage | Entire codebase | Quality risk |

---

## 9. Environment Variables

### Backend (`api/.env`)

```bash
# Required
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # ⚠️ Admin access
SUPABASE_JWT_SECRET=xxx               # For token validation
ANTHROPIC_API_KEY=sk-ant-xxx
GEMINI_API_KEY=xxx
TICKETMASTER_API_KEY=xxx

# Optional
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
CLAUDE_MODEL=claude-haiku-4-5-20251101
CLAUDE_MAX_TOKENS=4096
MAX_TOOL_ROUNDS=6
MAX_CONTEXT_TOKENS=180000
CORS_ORIGINS=http://localhost:3000,https://seira-e1iv.vercel.app
ENV=development
```

### Frontend (`web/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 10. Deployment

### Frontend (Vercel)

- **URL:** https://seira-e1iv.vercel.app
- **Branch:** main (auto-deploy)
- **Build:** `npm run build`
- **Framework:** Next.js 16

### Backend (Railway)

- **Branch:** main (auto-deploy)
- **Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Python:** 3.11+

### Database (Supabase)

- **Region:** (check Supabase dashboard)
- **Auth:** Email/password + Google OAuth
- **Storage:** Not used yet

### Local Development

```bash
# Frontend
cd web
npm install
npm run dev              # http://localhost:3000

# Backend
cd api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # http://localhost:8000
```

---

## 11. Recommended Improvements

### Priority 1 — Blocking Launch

- [ ] **Implement real flight search** (Duffel, Amadeus, or Kiwi API)
- [ ] Switch from SERVICE_ROLE_KEY to anon key with RLS policies
- [ ] Add request timeout to API client (30-60 seconds)

### Priority 2 — Important

- [ ] Add localStorage persistence to conversation store
- [ ] Implement 401 logout handler
- [ ] Increase Gemini timeout to 20-30 seconds
- [ ] Add circuit breaker for external API failures
- [ ] Use UUID for message IDs instead of timestamp

### Priority 3 — Nice to Have

- [ ] Implement account deletion
- [ ] Move metrics to Redis persistence
- [ ] Add comprehensive test suite
- [ ] Generate OpenAPI documentation
- [ ] Add database migration system
- [ ] Implement request rate limiting
- [ ] Add audit logging

---

## Summary

| Component | Status | Blocking Issues |
|-----------|--------|-----------------|
| Chat | ✅ Working | None |
| Events | ✅ Working | None |
| Flights | ❌ Mocked | **CRITICAL: No real data** |
| Hotels | ❌ Not implemented | Not blocking (manual search) |
| Auth | ✅ Working | None |
| Trips | ✅ Working | None |
| Settings | ⚠️ Partial | Account deletion missing |

**Bottom Line:** The app is functional for event discovery and trip planning, but users cannot search for real flights. This should be clearly communicated or the feature should be hidden until implemented.

---

*Generated by Claude Code — January 11, 2026*
