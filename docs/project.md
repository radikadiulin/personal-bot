# Personal Bot

A personal Telegram bot with modular features — job search, planning, and more. Runs entirely on free infrastructure.

## Infrastructure

| Layer | Service | Role |
|-------|---------|------|
| Webhook | Vercel (Next.js) | Receives Telegram commands, routes to handlers |
| Scheduler | GitHub Actions | Daily cron runs, manual triggers |
| Database | Supabase (PostgreSQL) | Settings, dedup log, watchlist |
| Notifications | Telegram Bot API | Delivers results to user |

**Cost**: $0/month (all free tiers). Single-user only.

**Secrets**: `.env` locally, GitHub Actions secrets in CI. Never committed.

## Features

### Job Searcher

Searches multiple job board APIs on a configurable schedule and delivers fresh PM role listings to Telegram. Deduplicates across runs — same job is never sent twice.

**Status**: Phase 1 complete and working.

#### Commands

| Command | Description |
|---------|-------------|
| `/jobs` | Trigger a manual search run |
| `/jobs_setup keywords <value>` | Set search keywords |
| `/jobs_setup countries <US,DE,GB>` | Set target countries |
| `/jobs_setup remote <true\|false>` | Filter by remote |
| `/jobs_setup seniority <mid,senior>` | Set seniority levels |
| `/jobs_setup freshness <N>` | Only show jobs posted within N days |
| `/jobs_setup batch <N>` | Max jobs per run |
| `/jobs_setup style <per_job\|digest>` | Notification style |
| `/jobs_schedule <daily\|weekly\|every N>` | Set run cadence |
| `/jobs_pause` | Pause scheduled runs |
| `/jobs_resume` | Resume scheduled runs |
| `/jobs_status` | Show current settings and last run time |

#### Job Sources

| Source | Type | Auth | Phase |
|--------|------|------|-------|
| Adzuna | Full-text search (US, CA, GB, DE, FR, NL, AU) | API key | ✅ Done |
| Remotive | Remote jobs | None | Phase 2 |
| RemoteOK | Remote jobs | None | Phase 2 |
| Jobicy | Remote jobs | None | Phase 2 |
| Greenhouse | Company watchlist (ATS) | None | Phase 3 |
| Lever | Company watchlist (ATS) | None | Phase 3 |

#### Scheduling

GitHub Actions runs `agents/job-scraper.ts` daily at 9am UTC. The script checks `last_run_at` in Supabase and skips if the configured interval hasn't elapsed — supports any cadence (daily, every N days, weekly) without changing the cron expression.

#### Deduplication

Jobs are keyed by `(source, job_id)` in the `jobs_seen` Supabase table. A job that appeared in a previous run is never re-sent, regardless of which source returned it.

#### Notification format

```
*Senior Product Manager* — Stripe

📍 Remote (US) | Adzuna
💰 $160,000–$200,000
📅 Posted 2 days ago

[View Job →](url)
```

Followed by a summary: `✅ 8 new jobs sent. 47 skipped (already seen).`

## Supabase Schema

**`job_search_settings`** — single row (id=1), stores all user preferences.

**`jobs_seen`** — deduplication log, unique on `(source, job_id)`.

Run `supabase/schema.sql` in the Supabase SQL Editor to initialize.

## Local Development

```bash
cp .env.example .env
# fill in .env with real values

npm install
npm run scrape       # run job scraper locally
npm run dev          # run Next.js webhook locally
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_CHAT_ID` | Your personal chat ID |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key |
| `ADZUNA_APP_ID` | Adzuna API app ID |
| `ADZUNA_APP_KEY` | Adzuna API app key |

## Roadmap

- **Phase 2**: Add Remotive, RemoteOK, Jobicy (remote job boards)
- **Phase 3**: Company watchlist via Greenhouse + Lever APIs
- **Later**: Daily planner, weekly planner, monthly summary agents
