# Decision: Split bot runtime between Vercel (webhook) and GHA (heavy work)

**Date:** 2026-05-26

## Decision
Vercel handles the Telegram webhook (lightweight command dispatch); GitHub Actions handles all heavy/long-running work (scraping, future agents).

## Context
Telegram commands need a persistent HTTP endpoint to receive webhook calls. Scraping takes too long for serverless — Vercel kills functions before the scraper finishes.

## Alternatives considered
- **Full GHA polling** — works but ~1–2 min command latency; poor UX for interactive commands
- **Persistent server (Railway/Fly.io)** — better latency, but costs money and adds ops overhead

## Reasoning
Vercel handles lightweight command dispatch instantly for free. GHA handles all heavy work. `/jobs` triggers `workflow_dispatch` via the GitHub API; results arrive as a separate Telegram message when the run finishes. Every new agent type = a new GHA workflow, triggered the same way.

## Trade-offs accepted
- `/jobs` result is async — user gets "started" confirmation, then results later. Acceptable for a personal bot.
- Vercel and GHA secrets are managed separately.

## Supersedes
—
