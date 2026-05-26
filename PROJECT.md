# personal-bot

Personal Telegram bot for job searching and future automation. Single-user, free infra only.

## Stack
- **Bot runtime:** Next.js (Vercel) — Telegram webhook handler
- **Scheduled jobs:** GitHub Actions — scraper runs on cron + manual dispatch
- **Database:** Supabase — settings and dedup state
- **Language:** TypeScript throughout

## Key Features

| Feature | Status |
|---------|--------|
| Adzuna job search | ✅ Live |
| Dedup engine | ✅ Live |
| Telegram commands (`/jobs`, `/jobs_status`, `/jobs_setup`, etc.) | ✅ Live |
| Scheduler gate (interval + pause flag) | ✅ Live |
| Force-run via `/jobs` (bypasses interval) | ✅ Live |
| Flat Telegram command menu | ✅ Live |
| Local dev polling mode | ✅ Live |
| Remotive / RemoteOK / Jobicy sources | 🔲 Phase 2 |
| Greenhouse + Lever watchlist | 🔲 Phase 3 |

## Current State
Bot is fully deployed and operational. Vercel serves the webhook; GitHub Actions runs the scraper on a daily cron at 09:00 UTC and on manual `/jobs` dispatch.

## Local Development
1. `npm run webhook:delete` — remove Vercel webhook so Telegram delivers to local polling
2. `npm run dev:bot` — start local bot (reads `.env.local`, polls getUpdates)
3. Test in Telegram
4. `npm run webhook:set` — restore production webhook when done

Requires `VERCEL_URL` in `.env.local`.

## Architecture
- `lib/bot/handler.ts` — all command logic; shared by webhook and local polling script
- `app/api/telegram/route.ts` — thin Vercel webhook wrapper
- `agents/job-scraper.ts` — scraper orchestrator, runs in GHA
- `lib/jobs/sources/adzuna.ts` — Adzuna adapter (Phase 2 stubs exist for Remotive, RemoteOK, Jobicy)
- `scripts/` — one-off and dev utilities

## History
- **2026-05-26** — Deployed to Vercel, wired Telegram webhook, fixed `/jobs` to trigger GHA `workflow_dispatch` instead of running inline (solved serverless timeout). Added local dev polling mode. Commits: `512bba4`→`914ef68`

<!-- wrap-session:last-commit=914ef68 -->
