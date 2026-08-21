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

Two distinct jobs exist. Pick based on the request:

| Request type | Use section |
| :--- | :--- |
| Add one new release/update now | **§3 Production Workflow** |
| Backfill history / "make a changelog from git history" / "one post per day" | **§3.5 Daily Digest Backfill** |
| Clean junk/test entries out of the DB | **§3.6 Cleanup** |

---

## 1. Overview & Architecture

* **Database Target**: `scripts/ingest.ts` connects directly to Neon PostgreSQL (`changelogs` table). Defaults to the production database unless `--dev` is passed.
* **Slug-Based Permalinks**: Each changelog entry generates a clean, URL-safe slug, served dynamically at `https://moltology.org/changelog/<slug>`.
* **Flexible Versioning**: Strict SemVer is not required. Version tags can be custom (e.g. `v1.6.0`), date-based (e.g. `2026.08.20`), or auto-defaulted for daily updates. **For daily digests use date-based versions** (e.g. `2026.08.20`).
* **Draft & Clean Workflow**: Drafts are authored temporarily in `content/changelogs/<slug>.md`, ingested via `scripts/ingest.ts --clean`, and automatically purged upon successful database commit.
* **One Post Per Day**: Keep the timeline clean — **at most one entry per calendar day**. Group all of a day's work into a single digest entry.
* **Idempotent Upsert**: The ingestion CLI upserts on `slug`, so re-running is safe and drafts double as the durable source of truth.

---

## 1.1 Tone, Style & Significance Checklist (Non-Negotiable)

Every changelog entry must be a **high-level, plain explanation** of what was changed and what users gain.

- **Only create entries for significant changes**: If a day or update is just minor tweaks, small styling fixes, internal developer scripts, or backend plumbing, **do not create an entry**. Only create entries for meaningful feature releases, major UI overhauls, or significant platform additions.
- **High-level, plain English**: Explain what the user gained in clear, simple language. Lead with the tangible benefit.
- **No heavy jargon or pseudo-science word salad**: Avoid dense techno-babble or over-complicated lore terms (e.g. avoid *"benthic telemetry"*, *"ingestion CLI"*, *"session armor"*, *"policy siege"*, *"sub-surface scanline textures"*, *"diegetic discipline"*).
- **No tech-stack leaks**: NEVER surface real-world framework/library names (React, TanStack, Vite, Nitro, Drizzle, Neon, PostgreSQL, JWT, RLS, S3, pgPolicy, etc.).
- **No `//` double slashes** in titles, subtitles, or copy. Use middle dots (`·`), colons (`:`), or em-dashes (`—`).
- **Keep it concise**: 1–2 sentence `summary`, and a short `content` body with 2–3 clear sections and 2–3 plain bullets each.
- **Category-fit**: pick one dominant category for the release.

### Category Mapping Guide

| Category | Choose when the update is mostly about... |
| :--- | :--- |
| `FEATURE` | Net-new tools, interactive hubs, quizzes, or major platform capabilities |
| `CHASSIS_UPGRADE` | Visual/UI redesigns, theming, device frames, or responsive layouts |
| `SECURITY_ISOLATION` | User accounts, authentication options, bot protection, or privacy features |
| `TRANSMUTATION` | Publishing engines, RSS feeds, or media storage upgrades |
| `BUG_PURGE` | Major bug fixes, error handling improvements, or stability upgrades |

---

## 2. Frontmatter & Schema Specification

Every changelog draft created in `content/changelogs/<slug>.md` must include YAML frontmatter matching this schema:

```markdown
---
title: "Permanent Changelog Links & Resizable Sidebar"
slug: "2026-08-19-permanent-changelog-links-resizable-sidebar"
category: "FEATURE" # Options: FEATURE, CHASSIS_UPGRADE, SECURITY_ISOLATION, TRANSMUTATION, BUG_PURGE
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

### Supported Categories:
* `TRANSMUTATION`: Architectural overhauls, database migrations, and telemetry upgrades.
* `CHASSIS_UPGRADE`: UI improvements, component enhancements, and visual refinements.
* `SECURITY_ISOLATION`: Auth, RLS policies, Turnstile protections, and privacy shielding.
* `BUG_PURGE`: Fixes, regression remedies, and error handler hardening.
* `FEATURE`: Net-new tools, hubs, and interactive platform capabilities.

---

## 3. Production Workflow (4 Steps)

### Step 1: Draft Temporary Markdown File

Create `content/changelogs/<slug>.md` using the schema above.
* **Significance Check**: Verify that the release contains meaningful user-facing features or major UI additions before authoring. Do not create entries for minor tweaks.
* **Plain English**: Use plain, high-level explanations of what the user gained (no pseudo-scientific word salad, no heavy techno-babble, no `//` double slashes in titles).
* **Benefit-First**: Lead with what is now possible or improved for the user, followed by how it works.

### Step 2: Validate Frontmatter (Dry-Run)

Validate the markdown frontmatter and schema without writing to the database:
```bash
npx tsx scripts/ingest.ts content/changelogs/<slug>.md --dry-run
```

### Step 3: Ingest to Neon Database & Clean Draft

Run the ingestion CLI with the `--clean` flag to upsert into Neon PostgreSQL and automatically delete the temporary draft file:

```bash
# Ingest to production database:
npx tsx scripts/ingest.ts content/changelogs/<slug>.md --clean

# Or target development database:
npx tsx scripts/ingest.ts content/changelogs/<slug>.md --dev --clean
```

### Step 4: Verify Publication

Verify that the entry is accessible:
* Public index: `https://moltology.org/changelog`
* Permalinks: `https://moltology.org/changelog/<slug>`
* HUD Support Portal: `/_hud/support`

**Verify the database record directly** (confirms count, ordering, and no junk):
```bash
# Point DATABASE_URL at the target branch, then:
npx tsx -e "import { neon } from '@neondatabase/serverless'; const sql=neon(process.env.DATABASE_URL!); const r=await sql\`SELECT version,title FROM changelogs ORDER BY \"releasedAt\" DESC\`; console.log('count:',r.length, r.map(x=>x.version).join(','))"
```

---

## 3.5 Daily Digest Backfill (Historical)

Use this when asked to "make a changelog", "backfill history", or "one post per day". Build one digest entry per significant calendar day of work.

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
