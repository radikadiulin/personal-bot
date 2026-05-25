# PRD: Job Searcher Bot

## Problem Statement

As a product manager actively looking for mid/senior roles, I have to manually check multiple job boards across different geographies every day. This is repetitive, easy to miss, and produces a lot of noise. I want relevant PM job listings delivered to me automatically in Telegram, filtered to my criteria, without seeing the same posting twice.

---

## Solution

A Telegram bot feature that runs on a configurable schedule, searches multiple job board APIs for PM roles matching saved criteria, deduplicates results across runs, and delivers fresh listings as Telegram messages. Fully configurable via Telegram slash commands. Runs on free infra (Vercel + GitHub Actions + Supabase). No manual checking required.

---

## User Stories

1. As a job seeker, I want to trigger a manual job search with `/jobs`, so that I can get results immediately without waiting for the scheduled run.
2. As a job seeker, I want to configure my search keywords via `/jobs_setup`, so that only PM-relevant roles are returned.
3. As a job seeker, I want to set target countries in `/jobs_setup`, so that I only see roles in locations I can actually work in.
4. As a job seeker, I want to toggle remote preference in `/jobs_setup`, so that I can filter for remote-only, on-site, or both.
5. As a job seeker, I want to configure seniority level in `/jobs_setup`, so that I don't see junior or executive roles I'm not targeting.
6. As a job seeker, I want to set job freshness in `/jobs_setup` (e.g. posted within 7 days), so that I'm not sent stale listings.
7. As a job seeker, I want to set a maximum batch size in `/jobs_setup`, so that I'm not overwhelmed with notifications on large result days.
8. As a job seeker, I want to choose between per-job and digest notification styles in `/jobs_setup`, so that I can control how noisy the bot is.
9. As a job seeker, I want to set the search schedule with `/jobs_schedule` (daily, every N days, weekly), so that the bot runs at my preferred cadence.
10. As a job seeker, I want to pause scheduled runs with `/jobs_pause`, so that I can take a break from job searching without losing my settings.
11. As a job seeker, I want to resume scheduled runs with `/jobs_resume`, so that I can restart searching after a pause.
12. As a job seeker, I want to check current settings and last run time with `/jobs_status`, so that I can confirm the bot is configured correctly and running.
13. As a job seeker, I want to add a specific company to my watchlist with `/jobs_watch <Company>`, so that I never miss a PM opening at a company I care about.
14. As a job seeker, I want to remove a company from my watchlist with `/jobs_unwatch <Company>`, so that I stop tracking companies I'm no longer interested in.
15. As a job seeker, I want to see my full watchlist with `/jobs_watchlist`, so that I know which companies are being monitored.
16. As a job seeker, I want each job notification to show the role title, company, location, source, salary (if available), and how recently it was posted, so that I can decide whether to click through without opening the link.
17. As a job seeker, I want each notification to include a direct link to the job posting, so that I can apply immediately.
18. As a job seeker, I want a summary message after each batch run (e.g. "8 new jobs sent, 47 skipped"), so that I understand how many results were found and filtered.
19. As a job seeker, I want the bot to never send me the same job twice across multiple runs, so that I'm not reviewing duplicates.
20. As a job seeker, I want the bot to search Adzuna for full-text PM role results across my configured countries, so that I get broad geographic coverage.
21. As a job seeker, I want the bot to search Remotive, RemoteOK, and Jobicy when remote is enabled, so that specialist remote boards are covered.
22. As a job seeker, I want the bot to query Greenhouse and Lever for companies on my watchlist, so that I get ATS-direct listings for target employers.
23. As a job seeker, I want the watchlist search to fall back to full-text search if no results are found, so that a quiet watchlist doesn't mean an empty run.
24. As a job seeker, I want all my search preferences persisted in a database, so that they survive bot restarts and I don't have to re-enter them.
25. As a job seeker, I want secrets (API keys, tokens) to never be committed to the repo, so that credentials stay private.

---

## Implementation Decisions

### Infra & runtime
- Vercel (Next.js): Telegram webhook receiver and command handler
- GitHub Actions: Daily cron at 9am UTC running the Python scraper script
- Supabase (PostgreSQL): Persistent settings, deduplication log, watchlist
- Local dev uses `.env` file; production uses GitHub Actions secrets — never committed

### Scheduling mechanism
GitHub Actions triggers daily. The scraper script checks `last_run_at` in Supabase and exits early if `now - last_run_at < schedule_interval_days`. This supports any interval without changing the cron expression.

### Deduplication
Keyed by `(source, job_id)` with a unique constraint in Supabase. Source-native IDs used (not URLs, which can change). Once a job is marked seen, it is never re-sent regardless of which run found it.

### Job sources (phased)

**Phase 1 — Full-text search**
- Adzuna: RESTful API, free tier (2,500 req/month), supports keyword + country + freshness filters. Requires free API key.

**Phase 2 — Remote boards**
- Remotive, RemoteOK, Jobicy: No-auth public APIs. Only activated when `remote = true` in settings.

**Phase 3 — Company watchlist**
- Greenhouse: `GET /v1/boards/{slug}/jobs` — no auth required for reads
- Lever: `GET /v0/postings/{slug}` — no auth required
- Client-side keyword filtering (title/description match) since ATS APIs don't support full-text search across all companies

### Notification format

**Per-job:**
```
🔎 Senior PM — Stripe

Senior Product Manager, Growth
📍 Remote (US) | Adzuna
💰 $160k–$200k (if listed)
📅 Posted 2 days ago

[View Job →](url)
```

**After batch:**
```
✅ 8 new jobs sent. 47 skipped (already seen).
```

**Digest mode**: All jobs combined into one message. Controlled by `notification_style` setting.

### Data schema

**`job_search_settings`** (single row):
keywords, countries (array), remote (bool), seniority (array), freshness_days, batch_size, notification_style, schedule_interval_days, schedule_paused, last_run_at

**`jobs_seen`**:
source, job_id, seen_at — with UNIQUE(source, job_id)

**`job_watchlist`** (Phase 3):
company_name, greenhouse_slug (nullable), lever_slug (nullable)

### Module boundaries

| Module | Interface | Notes |
|--------|-----------|-------|
| Telegram command router | Receives webhook POST, dispatches to handler by command | Stateless, Vercel edge function |
| Settings manager | `get_settings()`, `update_settings(patch)` | Thin Supabase wrapper |
| Scheduler gate | `should_run(settings, now) → bool` | Pure function, no I/O |
| Source adapters | `search(params) → List[Job]` | One class per source, shared `Job` dataclass |
| Dedup engine | `filter_unseen(jobs) → List[Job]`, `mark_seen(jobs)` | Wraps Supabase `jobs_seen` table |
| Notification formatter | `format_job(job, style) → str` | Pure function |
| Scraper orchestrator | Wires all modules, called by GHA entrypoint | No business logic itself |
| Watchlist manager (Phase 3) | `add(company)`, `remove(company)`, `list()` | Supabase CRUD |

---

## Testing Decisions

**What makes a good test**: Test external behavior, not implementation. For adapters: given a mocked HTTP response, assert the correct `List[Job]` is returned. For pure functions: assert output given input. Never test internal state or private methods.

**Modules to test:**

- **Source adapters** — mock HTTP responses (using `responses` or `httpretty`), assert correct `Job` fields extracted. One test per source, covering happy path + missing fields (e.g. no salary).
- **Dedup engine** — seed `jobs_seen` with known IDs, assert filter removes them; assert new jobs are inserted after `mark_seen`. Use a real Supabase test DB or a local Postgres container.
- **Scheduler gate** — pure function, table-driven tests: paused=true → false, interval not elapsed → false, no prior run → true, interval elapsed → true.
- **Notification formatter** — assert message string contains expected fields for per-job and digest modes. Assert graceful handling of missing salary/location.

---

## Out of Scope

- LinkedIn and Indeed (no public job search APIs)
- Multi-user support (single user only)
- Staging environment (local → main only)
- Conversational/natural-language command parsing
- Job application tracking or status management
- Google Calendar or planner integration (separate bot feature)
- Email delivery (Telegram only)
- Web dashboard or admin UI

---

## Further Notes

- **API rate limits**: Adzuna free tier caps at 2,500 req/month (~83/day). With daily runs across multiple countries, stay within this — each country query = 1 request. Keep country list ≤ 5 for safety.
- **Attribution requirements**: RemoteOK and Jobicy require attribution back to their sites in any display. Notification format must include source name and link to original listing.
- **Repo visibility**: GitHub Actions free tier gives unlimited minutes for public repos, 2,000 min/month for private. Choose accordingly — all secrets are in GHA secrets, not the code, so public is safe.
- **Phase rollout**: Ship Phase 1 (Adzuna + all commands + scheduling) as the usable MVP. Phases 2 and 3 add sources but don't change the core architecture.
