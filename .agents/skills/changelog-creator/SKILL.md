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

## 1.1 Tone & Style Checklist (Non-Negotiable)

Every changelog entry must read warm, sharp, and satirical — never like a raw commit dump.

- **Plain, human copy**: Say what the user *gained*. Lead with the benefit, then the how. No pseudo-scientific word salad or faux-math.
- **No tech-stack leaks**: NEVER surface real framework/stack terms (React, TanStack, Vite, Nitro, Drizzle, Neon, PostgreSQL, JWT, RLS, S3, pgPolicy, etc.). Transmute infrastructure into in-universe lore (*benthic HUD, ecdysis, cyber-chitin, synaptic telemetry, the Order, the Oracle*).
- **No `//` double slashes** in titles, subtitles, or copy. Use middle dots, colons, or em-dashes.
- **Keep it concise**: 1–2 sentence `summary`, and a short `content` body of `###` sections with 2–4 bullets each.
- **Category-fit**: pick one dominant category for the whole day (see mapping below).

### Category Mapping Guide

| Category | Choose when the day is mostly about... |
| :--- | :--- |
| `TRANSMUTATION` | Architecture overhauls, migrations, ingestion/content engines, SEO infrastructure |
| `CHASSIS_UPGRADE` | Visual/UI refinements, theming, typography, marketing showcases, polish passes |
| `SECURITY_ISOLATION` | Auth, session armor, RLS/policy hardening, bot protection, privacy/legal |
| `BUG_PURGE` | Fixes, regression remedies, error-handler hardening |
| `FEATURE` | Net-new tools, hubs, routes, and platform capabilities (use when nothing dominates) |

---

## 2. Frontmatter & Schema Specification

Every changelog draft created in `content/changelogs/<slug>.md` must include YAML frontmatter matching this schema:

```markdown
---
title: "The Changelog Reborn & The Creative Forge"
slug: "2026-08-19-changelog-reborn-creative-forge"
category: "FEATURE" # Options: TRANSMUTATION, CHASSIS_UPGRADE, SECURITY_ISOLATION, BUG_PURGE, FEATURE
version: "2026.08.19" # Date-based for daily digests; optional (defaults to v1.0.0 or date if omitted)
summary: "Gave the changelog a permanent home with clean permalinks and a unified ingestion CLI, hardened the sidebar, and plugged the creative pipeline into local model-run imagery."
isPublished: true
releasedAt: "2026-08-19T23:59:00Z"
---

### The Changelog Reborn
- Reworked changelog routing with clean slug-based permalinks and a unified ingestion CLI, so every future release gets a permanent URL.
- Refined the launchpad carousel and standardized spacing across HUD components.

### The Creative Forge
- Integrated a local model-run pipeline for generating imagery, with workflow automation and mandatory queue routing.
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
* Ensure the tone is warm, sharp, and satirical with high clarity (no pseudo-scientific word salad, no `//` double slashes in titles).
* Translate technical infrastructure into in-universe lore (*sub-benthic computing, ecdysis/shell-shedding, cyber-chitin, synaptic telemetry*).

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

Use this when asked to "make a changelog", "backfill history", or "one post per day". Build one digest entry per calendar day of work.

### Step A: Derive the days from git history
```bash
# List every distinct day that had commits, newest first:
git log --format='%ad' --date=short | sort -r | uniq
```
For each day, gather its commits to identify the dominant theme:
```bash
git log --format='%ad|%s' --date=short | grep '^<YYYY-MM-DD>|'
```

### Step B: Draft one file per day
Create `content/changelogs/<YYYY-MM-DD>-<theme>.md` per the schema, with:
* `version` = `YYYY.MM.DD` and `slug` = `YYYY-MM-DD-<theme>`.
* `releasedAt` = `<YYYY-MM-DD>T23:59:00Z`.
* One dominant `category` (see mapping) and concise, non-jargony copy.
* Aim for the day's *outcomes*, not a commit-by-commit list.

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
