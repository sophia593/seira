# Seira

AI-powered platform for planning and coordinating event-first trips.

## Repo structure
- `web/` — Next.js app (TypeScript + Tailwind, App Router)
- `api/` — FastAPI service scaffold

## Local setup
1) Copy env template:
   - `cp .env.example web/.env.local` (then fill in values)
   - (Optional) `cp .env.example api/.env` (if you want separate env handling later)

2) Run web:
   - `cd web`
   - `npm install`
   - `npm run dev`

## Notes
- Do **not** commit real secrets. Keep keys in `.env.local` or platform env vars (Vercel/Railway).
