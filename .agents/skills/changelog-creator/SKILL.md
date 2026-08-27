---
name: changelog-creator
description: >-
  Automated end-to-end pipeline for drafting, validating, and ingesting Moltology system changelog
  entries and transmutation logs directly to Neon PostgreSQL using the ingestion CLI. Use whenever
  the user asks to create, draft, add, update, or publish a changelog entry or release notes.
---

# Moltology Changelog Creation & Ingestion Pipeline

This skill guides the creation, validation, and automated ingestion of system changelog entries and transmutation telemetry directly into Neon PostgreSQL via the unified ingestion CLI (`scripts/ingest.ts`).

---

## 0. Choosing the Right Workflow

Select the workflow matching the request:

| Request type | Workflow | Description |
| :--- | :--- | :--- |
| Regular update / "update changelog" / "backfill missing entries" | **§3 Incremental Update & Recent Backfill (Default)** | Checks the latest recorded release date, identifies any recent missed days with significant work, and drafts/ingests only the new entries. |
| Full historical rebuild / initial setup | **§3.5 Full Historical Backfill** | Rebuilds the entire history from initial launch day. Used only for complete migrations or initial project setups. |
| Clean junk/test entries | **§3.6 Cleanup** | Deletes test or invalid entries by slug or version. |

---

## 1. Overview & Architecture

* **Database Target**: `scripts/ingest.ts` connects directly to Neon PostgreSQL (`changelogs` table). Defaults to the production database unless `--dev` is passed.
* **Slug-Based Permalinks**: Each changelog entry generates a clean, URL-safe slug, served dynamically at `https://moltology.org/changelog/<slug>`.
* **Flexible Versioning**: Strict SemVer is not required. Version tags can be custom (e.g. `v1.6.0`), date-based (e.g. `2026.08.20`), or auto-defaulted for daily updates. **For daily digests use date-based versions** (e.g. `2026.08.20`).
* **Draft & Clean Workflow**: Drafts are authored temporarily in `content/changelogs/<slug>.md`, ingested via `scripts/ingest.ts --clean`, and automatically purged upon successful database commit.
* **One Post Per Day**: Keep the timeline clean — **at most one entry per calendar day**. Group all of a day's work into a single digest entry.
* **Incremental Ingestion (No Full Re-verification Needed)**: Regular runs only need to validate and ingest the newly drafted entries. Do NOT wipe or batch re-verify the entire historical database for normal daily additions.
* **Idempotent Upsert**: The ingestion CLI upserts on `slug`, so re-running is safe and drafts double as the durable source of truth.

---

## 1.1 Tone, Style & Significance Checklist (Non-Negotiable)

Every changelog entry must be a **high-level, plain explanation** of what was changed and what users gain.

- **Only create entries for significant changes**: If a day or update is just minor tweaks, small styling fixes, internal developer scripts, or backend plumbing, **do not create an entry**. Only create entries for meaningful feature releases, major UI overhauls, or significant platform additions.
- **High-level, plain English**: Explain what the user gained in clear, simple language. Lead with the tangible benefit.
- **No heavy jargon or pseudo-science word salad**: Avoid dense techno-babble or over-complicated lore terms (e.g. avoid *"benthic telemetry"*, *"ingestion CLI"*, *"session armor"*, *"policy siege"*, *"sub-surface scanline textures"*, *"diegetic discipline"*).
- **No tech-stack leaks**: NEVER surface real-world framework/library names (React, TanStack, Vite, Nitro, Drizzle, Neon, PostgreSQL, JWT, RLS, S3, pgPolicy, etc.).
- **No slash-pair titles** (STYLE_GUIDE BAN 1). Use a period, a colon, or a middle dot (`·`).
- **Keep it concise**: 1–2 sentence `summary`, and a short `content` body with 2–3 clear sections and 2–3 plain bullets each.
- **Category & Tags**: Pick one standard primary category, and add overlapping tags to describe all areas touched by the release.

### Standard Categories & Tags Guide

| Category | Description |
| :--- | :--- |
| `Feature` | Net-new tools, interactive hubs, quizzes, or major platform capabilities |
| `Improvement` | Visual polish, UX refinements, component updates, or workflow enhancements |
| `Performance` | Speed improvements, prefetching, load time reductions, or resource efficiency |
| `Security` | User accounts, authentication options, bot protection, or privacy shielding |
| `Fix` | Bug fixes, regression remedies, error handling, or stability upgrades |
| `Design` | Theming, layout overhauls, typography refinements, or animations |

**Common Overlapping Tags**: `Feature`, `Improvement`, `UI/UX`, `Performance`, `Navigation`, `Security`, `AI`, `Media`, `Mobile`, `Database`, `Tools`, `Design`, `Guides`, `Fix`

---

## 2. Frontmatter & Schema Specification

Every changelog draft created in `content/changelogs/<slug>.md` must include YAML frontmatter matching this schema:

```markdown
---
title: "Permanent Changelog Links & Resizable Sidebar"
slug: "2026-08-19-permanent-changelog-links-resizable-sidebar"
category: "Feature" # Standard: Feature, Improvement, Security, Performance, Fix, Design
tags: ["Feature", "UI/UX", "Navigation", "Tools"] # Overlapping topic tags
version: "2026.08.19" # Date-based for daily digests
summary: "Gave every changelog entry its own shareable link, made the sidebar resizable with memory, and integrated local image generation for social posts."
isPublished: true
releasedAt: "2026-08-19T23:59:00Z"
---

### Shareable Changelog Pages
- Added dedicated, shareable links for every release so updates are easy to bookmark and reference.
- Improved spacing and navigation across the update feed.

### Resizable Sidebar
- Added a drag handle to resize the navigation sidebar, saving your preferred width automatically.
- Made the command search palette close when clicking outside.

### Creative Studio
- Connected local AI image generation to automatically create illustrations for daily social posts.
```

### Slug & Date Conventions

- **Daily digest slug**: `YYYY-MM-DD-<short-theme>.md` (e.g. `2026-08-19-changelog-reborn-creative-forge.md`).
- **Version**: mirror the date as `YYYY.MM.DD` (e.g. `2026.08.19`).
- **releasedAt**: set to end-of-day (`YYYY-MM-DDT23:59:00Z`) so ordering by `releasedAt DESC` is deterministic within a day.
- **One entry per day**: if multiple features ship on one day, merge them into a single digest under the dominant category.

---

## 3. Incremental Update & Recent Backfill Workflow (Standard)

Use this default workflow whenever adding today's entry or ensuring recent runs haven't missed any days. You do **not** need to wipe or re-verify the whole historical changelog.

### Step 1: Check Latest Date & Identify Missed Recent Days

1. Check the latest release version in `src/lib/changelogs-data.ts` (or query the DB for the newest `version`).
2. List recent git commit dates since that release:
```bash
git log --format='%ad' --date=short --since="<YYYY-MM-DD>" | sort -r | uniq
```
3. For any day between the latest recorded release and today that has significant feature or UI commits, gather commits:
```bash
git log --format='%ad|%s' --date=short | grep '^<YYYY-MM-DD>|'
```

### Step 2: Draft Temporary Markdown File(s)

Create `content/changelogs/<slug>.md` only for the new / missed days.
* **Significance Check**: Verify that each day contains meaningful user-facing features or major UI additions before authoring. Do not create entries for minor tweaks.
* **Plain English**: Use plain, high-level explanations of what the user gained (no pseudo-scientific word salad, no heavy techno-babble, no slash-pair titles).
* **Benefit-First**: Lead with what is now possible or improved for the user, followed by how it works.

### Step 3: Validate Frontmatter (Dry-Run)

Validate only the newly drafted markdown files without writing to the database:
```bash
npx tsx scripts/ingest.ts content/changelogs/<new-slug>.md --dry-run
```

### Step 4: Ingest to Neon Database & Prepend Seed

1. Ingest only the new entries to development and production:
```bash
# Ingest to DEV database:
npx tsx scripts/ingest.ts content/changelogs/<new-slug>.md --dev

# Ingest to PROD database:
npx tsx scripts/ingest.ts content/changelogs/<new-slug>.md
```
*(Optionally add `--clean` if you want the temporary draft file automatically deleted after ingestion).*

2. Prepend the new entry/entries to `INITIAL_CHANGELOGS` in `src/lib/changelogs-data.ts` to keep the SSR fallback and seed data in sync.

### Step 5: Verify Publication

Verify that the new entry is accessible:
* Public index: `https://moltology.org/changelog`
* Permalinks: `https://moltology.org/changelog/<slug>`
* HUD Support Portal: `/_hud/support`

Verify the latest records directly in Neon DB:
```bash
npx tsx -e "require('dotenv').config(); const { neon } = require('@neondatabase/serverless'); const sql = neon(process.env.PROD_DATABASE_URL || process.env.DATABASE_URL); sql\`SELECT slug, version, title, \"releasedAt\" FROM changelogs ORDER BY \"releasedAt\" DESC LIMIT 5\`.then(r => console.log(r));"
```

---

## 3.5 Full Historical Backfill (Full Rebuild Only)

Use this **only** for complete migrations, initial repository setups, or full timeline resets. Do **not** use this for routine daily updates.

### Step A: Derive the days from git history
```bash
# List every distinct day that had commits, newest first:
git log --format='%ad' --date=short | sort -r | uniq
```
For each day, gather its commits to identify if it had significant changes:
```bash
git log --format='%ad|%s' --date=short | grep '^<YYYY-MM-DD>|'
```
* **Filter out insignificant days**: If a day only had minor styling adjustments, internal scripts, or backend maintenance, skip it.

### Step B: Draft one file per significant day
Create `content/changelogs/<YYYY-MM-DD>-<theme>.md` per the schema, with:
* `version` = `YYYY.MM.DD` and `slug` = `YYYY-MM-DD-<theme>`.
* `releasedAt` = `<YYYY-MM-DD>T23:59:00Z`.
* One dominant `category` (see mapping) and plain, high-level, benefit-focused copy.
* Aim for high-level user outcomes, not a commit-by-commit list.

### Step C: Validate all drafts
```bash
npx tsx scripts/ingest.ts --dir content/changelogs/ --dry-run
```

### Step D: Stage in dev, then ship to prod
1. Wipe the dev changelogs, ingest there, and visually verify `/changelog` (via local dev server):
```bash
npx tsx -e "import { neon } from '@neondatabase/serverless'; const sql=neon(process.env.DEV_DATABASE_URL!); await sql\`DELETE FROM changelogs\`"
npx tsx scripts/ingest.ts --dir content/changelogs/ --dev
```
2. After confirming dev looks right, wipe prod and ingest:
```bash
npx tsx -e "import { neon } from '@neondatabase/serverless'; const sql=neon(process.env.PROD_DATABASE_URL!); await sql\`DELETE FROM changelogs\`"
npx tsx scripts/ingest.ts --dir content/changelogs/
```

### Step E: Sync the fallback seed
`src/lib/changelogs-data.ts` (`INITIAL_CHANGELOGS`) is used as the loader fallback and for `db:seed`. Mirror the new timeline there so dev seed and the empty-DB fallback match production.

---

## 3.6 Cleanup (Remove Junk / Test Entries)

Test submissions (e.g. "wrty", "fghfghfg", "hooray now Automated System Test Entry") pollute the timeline. Remove them before or alongside a rebuild:

```bash
# Remove junk by known slug/version (point URL at the target branch):
npx tsx -e "import { neon } from '@neondatabase/serverless'; const sql=neon(process.env.PROD_DATABASE_URL!); await sql\`DELETE FROM changelogs WHERE slug IN ('wrty','ghffghfgh','v1-5-1-test') OR version IN ('wrty','ghffghfgh','v1-5-1-test')\`"
```
Then confirm none remain:
```bash
npx tsx -e "import { neon } from '@neondatabase/serverless'; const sql=neon(process.env.PROD_DATABASE_URL!); console.log((await sql\`SELECT count(*)::int c FROM changelogs WHERE slug IN ('wrty','ghffghfgh','v1-5-1-test')\`)[0].c)"
```

---

## 4. Command Quick Reference

| Command | Action |
| :--- | :--- |
| `npx tsx scripts/ingest.ts content/changelogs/<file>.md --dry-run` | Validates changelog markdown frontmatter without modifying the database. |
| `npx tsx scripts/ingest.ts content/changelogs/<file>.md --clean` | Ingests changelog to production Neon DB and deletes local draft upon success. |
| `npx tsx scripts/ingest.ts content/changelogs/<file>.md --dev --clean` | Ingests changelog to dev Neon DB and deletes local draft upon success. |
| `npx tsx scripts/ingest.ts --dir content/changelogs/` | Batch ingests all markdown files in `content/changelogs/`. |
| `npx tsx scripts/ingest.ts --dir content/changelogs/ --dev` | Batch ingest to dev branch. |
| `npx tsx scripts/ingest.ts --dir content/changelogs/ --dry-run` | Batch validate all drafts without writing. |
| `git log --format='%ad' --date=short | sort -r | uniq` | List distinct work days for a backfill. |

> **Keep seed in sync**: whenever the timeline changes, update `INITIAL_CHANGELOGS` in `src/lib/changelogs-data.ts` so dev `db:seed` and the empty-DB fallback stay consistent with production.
