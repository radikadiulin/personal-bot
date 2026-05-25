# Plan: Personal Telegram Agent Bot System

## Vision

A personal Telegram bot that spawns specialized agents based on intent — job scraper, daily planner, weekly planner, monthly summary, and more. Fully serverless, runs on free tiers.

---

## Architecture

```
Telegram message
    ↓ instant webhook
Vercel (Next.js API route)
    ├── Quick: Anthropic API → telegram reply (<5s)
    └── Heavy: GitHub API repository_dispatch
                    ↓
               GitHub Actions
                    ├── scraping / processing
                    ├── Anthropic API
                    └── Supabase (store results)
                    ↓
               Telegram sendMessage

Scheduled cron (GitHub Actions only):
    • Daily planner    → 7am daily
    • Weekly planner   → Monday 8am
    • Monthly summary  → 1st of month 9am
    • Job scraper      → daily 9am (or user-triggered)
```

**Why this split:**
- Vercel handles instant message receipt and simple queries (no GHA minutes burned)
- GHA only runs for heavy/scheduled work → stays well within free tier
- Supabase persists everything: history, jobs, planner items, settings

---

## Infrastructure Roles

| Service | Role | Free limit |
|---|---|---|
| **Vercel** | Telegram webhook receiver, intent router, quick responses | 100k invocations/mo, 10s timeout |
| **GitHub Actions** | Heavy tasks, all scheduled bots | 2,000 min/mo (private repo) |
| **Supabase** | DB (messages, jobs, planner, results) | 500MB storage, 500 req/s |
| **Telegram Bot API** | User interface | Free, unlimited |
| **Anthropic API** | Intelligence layer (Haiku for routing/simple, Sonnet for complex) | Pay-per-use |

---

## Bot Agents

| Agent | Trigger keywords | Schedule | Runtime |
|---|---|---|---|
| `job-scraper` | "scrape jobs", "find jobs", "job search" | Daily 9am OR on-demand | GHA |
| `daily-planner` | "what's my day", "daily plan" | Daily 7am auto | GHA |
| `weekly-planner` | "week ahead", "weekly plan" | Monday 8am auto | GHA |
| `monthly-summary` | "month summary", "review month" | 1st of month 9am auto | GHA |
| `quick-qa` | everything else | On message | Vercel (no GHA) |

---

## Repo Structure

```
telegram-agent-bot/
  app/
    api/
      telegram/
        route.ts        ← Vercel webhook handler
  agents/               ← Python, runs in GitHub Actions
    job_scraper.py
    daily_planner.py
    weekly_planner.py
    monthly_summary.py
    base.py             ← shared Anthropic API wrapper
  lib/
    router.py           ← intent classification
    telegram.py         ← sendMessage wrapper
    supabase_client.py  ← DB helpers
    state.py            ← last_update_id (GitHub Variable, fallback only)
  .github/
    workflows/
      scheduled_bots.yml    ← daily/weekly/monthly crons
      on_demand.yml         ← triggered by repository_dispatch from Vercel
  requirements.txt
  package.json              ← Next.js for Vercel
```

---

## Supabase Schema

```sql
-- Conversation context
messages (id, chat_id, role, content, agent, created_at)

-- Job scraper output
jobs (id, title, company, url, location, description, salary, scraped_at, status)

-- Planner
planner_tasks (id, title, due_date, priority, status, notes, created_at)

-- Bot run history
bot_runs (id, bot_name, triggered_by, started_at, completed_at, summary, full_output)

-- User preferences (single row per user)
settings (chat_id, job_search_criteria, timezone, daily_plan_time, weekly_plan_day)
```

Auto-prune: jobs after 60 days, messages after 90 days (Supabase scheduled functions or a monthly GHA cleanup job).

---

## Free Tier Requirements & Constraints

### GitHub Actions (2,000 min/month private repo)
- ✅ Daily bots: 4 bots × 1 run/day × ~2 min = ~240 min/month
- ✅ On-demand via `repository_dispatch`: user-triggered, sporadic, ~100 runs/month max = ~200 min
- ✅ Total: ~440 min/month — well under 2,000
- ❌ **Do NOT** run a polling cron every 5 min: that's 8,640+ min/month (12×24×30×~1min), instantly blows the free tier
- **Suggestion**: If you want to avoid Vercel, make the repo **public** (secrets stay private, code is visible) — then GHA minutes are unlimited. But Vercel webhook is the cleaner solution.

### Vercel (100k invocations/month, 10s max duration hobby)
- ✅ Webhook receives each Telegram message → ~500-2,000 messages/month = trivial
- ⚠️ 10-second function timeout: webhook handler must ACK Telegram within 10s and offload heavy work to GHA
- **Pattern**: Telegram requires a 200 OK within 5s. Vercel returns 200 immediately, then fires `repository_dispatch` async. This is fine — GHA handles the reply.
- ❌ Don't run scraping/LLM calls synchronously in Vercel if they might take >8s

### Supabase (500MB storage, 50MB per table row limit is per request not table)
- ✅ Text data is tiny — 500MB covers years of conversations and job listings
- **Suggestion**: Add `created_at` index on all tables + a monthly cleanup policy (DELETE WHERE created_at < now() - interval '90 days')
- ✅ 500 req/s is plenty for personal use
- ⚠️ Supabase free tier **pauses projects after 1 week of inactivity** — the daily bot cron prevents this automatically

### Anthropic API (pay-per-use)
- Haiku 4.5: ~$0.80/1M input + $4/1M output tokens
- Estimated usage: 50 messages/day × 500 tokens avg = 25k tokens/day = ~$0.05/day (~$1.50/month)
- Use Haiku for routing + quick-qa, Sonnet only for complex agent work

---

## Implementation Phases

**Phase 1 — Foundation** (Vercel webhook + Supabase + basic routing)
- Vercel webhook handler, Supabase setup, intent router, quick-qa agent
- Test: send any message → get a reply

**Phase 2 — First scheduled bot** (job scraper)
- GHA workflow, job scraper agent, Supabase jobs table
- Test: send "scrape jobs" → GHA triggers → results saved → Telegram reply

**Phase 3 — Planner bots**
- Daily + weekly + monthly, Supabase planner_tasks table
- Test: auto morning messages arrive

**Phase 4 — Polish**
- Settings via Telegram ("set my job search to Python developer in NYC")
- Prompt caching for agent system prompts (Anthropic cache_control)
- Monthly Supabase cleanup job

---

## Open Questions Before Building

1. **Job scraper source**: Which sites? LinkedIn (blocks scrapers), Indeed (has API), Hacker News "Who's hiring" (easy to scrape), Remotive/Wellfound APIs (free)? Suggestion: start with HN "Who's hiring" + Remotive API — both scraper-friendly.
2. **Planner data source**: Does the planner pull from a calendar (Google Calendar API?) or is it purely AI-generated based on tasks stored in Supabase?
3. **Timezone**: What timezone for scheduled bots?
4. **Public vs private repo**: Fine with public (cleaner free tier) or need private?
