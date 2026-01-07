# Seira

AI-powered platform for planning and coordinating event-first trips. Find concerts, games, and shows, then build your trip around them.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js Web   │────▶│   FastAPI API   │────▶│    Supabase     │
│   (Vercel)      │     │   (Railway)     │     │   (Auth + DB)   │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │  Claude  │ │  Gemini  │ │Ticketmaster│
              │ (Chat)   │ │(Research)│ │ (Events) │
              └──────────┘ └──────────┘ └──────────┘
```

## Repo Structure

```
seira/
├── web/                    # Next.js frontend (TypeScript + Tailwind)
│   ├── src/app/           # App Router pages
│   ├── src/components/    # React components
│   ├── src/hooks/         # Custom hooks
│   ├── src/lib/           # API clients, Supabase
│   └── src/stores/        # Zustand state
│
├── api/                    # FastAPI backend (Python)
│   ├── app/
│   │   ├── ai/            # AI orchestration
│   │   │   ├── clients/   # Claude, Gemini clients
│   │   │   ├── tools/     # Tool definitions & handlers
│   │   │   └── prompts.py # System prompts
│   │   ├── api/v1/        # REST endpoints
│   │   ├── integrations/  # Ticketmaster, etc.
│   │   └── services/      # Business logic
│   └── requirements.txt
```

## AI System

### Claude (Primary Chat)
- Model: `claude-haiku-4-5-20251001`
- Handles conversation, trip planning, recommendations
- Has access to tools: `search_events`, `search_flights`, `research_web`, `save_trip`

### Gemini with Search Grounding (Web Research)

Real-time web research using Google's Gemini API with Search Grounding for current information not available in structured APIs.

#### When Gemini is Used

1. **Rescue Pattern**: Ticketmaster returns 0 results → Gemini searches web for alternatives
2. **Direct Research**: Claude calls `research_web` tool for venue info, restaurants, hotels, etc.

#### Search Types

| Type | Keywords | Use Case |
|------|----------|----------|
| `venue_info` | arena, parking, bag policy | Venue policies, tips |
| `restaurant` | restaurant, dinner, food | Dining near venues |
| `event_details` | setlist, opener, schedule | Show information |
| `tickets` | tickets, prices, buy | Ticket pricing |
| `travel_tips` | airport, transit, weather | Getting there |
| `accommodation` | hotel, stay, airbnb | Where to sleep |
| `nightlife` | bar, club, jazz | Nightlife options |

#### How It Works

```python
# Auto-detects search type from query
result = await researcher.search("jazz clubs in New Orleans")
# → SearchType.NIGHTLIFE detected
# → Query enhanced: "jazz clubs in New Orleans best reviews 2026"
# → Returns answer + source citations with official badges
```

#### Source Quality Detection

Official sources (green badge in UI):
- Ticketing: Ticketmaster, StubHub, SeatGeek, AXS
- Venues: MSG, NBA/NFL/MLB/NHL sites
- Booking: OpenTable, Resy, Booking.com, Marriott
- Travel: TripAdvisor, Lonely Planet, Timeout

#### Error Handling

- 10 second timeout on all Gemini calls
- Graceful fallback messages (no crashes)
- Metrics tracking: success rate, search type distribution

#### Metrics Endpoint

```bash
curl https://your-api.railway.app/metrics/ai
```

Returns:
```json
{
  "gemini_rescue": {
    "total_triggers": 15,
    "successful_rescues": 12,
    "success_rate_pct": 80.0,
    "triggers_by_reason": {
      "no_ticketmaster_results": 14,
      "ticketmaster_api_failed": 1
    }
  },
  "research_web": {
    "total_calls": 25,
    "search_type_distribution": {
      "venue_info": 8,
      "restaurant": 10,
      "nightlife": 7
    }
  }
}
```

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase project

### Environment Variables

```bash
# web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# api/.env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SUPABASE_JWT_SECRET=your_jwt_secret
ANTHROPIC_API_KEY=your_claude_key
GEMINI_API_KEY=your_gemini_key
TICKETMASTER_API_KEY=your_ticketmaster_key
```

### Run Locally

```bash
# Terminal 1: API
cd api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2: Web
cd web
npm install
npm run dev
```

## Deployment

- **Frontend**: Vercel (auto-deploys from `main`)
- **API**: Railway (auto-deploys from `main`)
- **Database**: Supabase (hosted)

## Key Files

| File | Purpose |
|------|---------|
| `api/app/ai/clients/gemini.py` | Gemini Search Grounding client |
| `api/app/ai/tools/handlers.py` | Tool execution (search_events, research_web) |
| `api/app/ai/tools/registry.py` | Tool definitions for Claude |
| `api/app/ai/prompts.py` | System prompts and guidelines |
| `api/app/ai/metrics.py` | AI metrics tracking |
| `web/src/components/chat/tool-results/web-research-card.tsx` | Web research UI |

## Notes

- Do **not** commit secrets. Use `.env.local` or platform env vars.
- Metrics reset on API redeploy (in-memory). Use Redis for persistence.
- Gemini Search Grounding requires `google-genai` package.
