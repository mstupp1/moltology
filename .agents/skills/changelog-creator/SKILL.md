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

## 1. Overview & Architecture

* **Database Target**: `scripts/ingest.ts` connects directly to Neon PostgreSQL (`changelogs` table). Defaults to the production database unless `--dev` is passed.
* **Slug-Based Permalinks**: Each changelog entry generates a clean, URL-safe slug, served dynamically at `https://moltology.org/changelog/<slug>`.
* **Flexible Versioning**: Strict SemVer is not required. Version tags can be custom (e.g. `v1.6.0`), date-based (e.g. `2026.08.20`), or auto-defaulted for daily updates.
* **Draft & Clean Workflow**: Drafts are authored temporarily in `content/changelogs/<slug>.md`, ingested via `scripts/ingest.ts --clean`, and automatically purged upon successful database commit.

---

## 2. Frontmatter & Schema Specification

Every changelog draft created in `content/changelogs/<slug>.md` must include YAML frontmatter matching this schema:

```markdown
---
title: "Autonomous Content Ingestion Engine & Content Vault"
slug: "autonomous-content-ingestion-engine-content-vault"
category: "FEATURE" # Options: TRANSMUTATION, CHASSIS_UPGRADE, SECURITY_ISOLATION, BUG_PURGE, FEATURE
version: "v1.6.0" # Optional (defaults to v1.0.0 or date if omitted)
summary: "Integrated unified CLI ingestion script and standardized content repository enabling programmatic article and changelog publication directly to Neon PostgreSQL."
isPublished: true
releasedAt: "2026-08-19T20:00:00Z"
---

### 🚀 Release Highlights

- **Unified CLI Ingestion Tool**: Added `scripts/ingest.ts` supporting Markdown with YAML frontmatter and JSON files.
- **Drizzle Upsert Integration**: Automated conflict resolution and metadata computation across `blog_posts`, `changelogs`, and `podcasts`.
- **Directory Ingestion**: Batch synchronization from the `content/` repository.

### 🛡️ Carapace & System Hardening

- Hardened database connection pooling and optimized SSR route loaders.
```

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

---

## 4. Command Quick Reference

| Command | Action |
| :--- | :--- |
| `npx tsx scripts/ingest.ts content/changelogs/<file>.md --dry-run` | Validates changelog markdown frontmatter without modifying the database. |
| `npx tsx scripts/ingest.ts content/changelogs/<file>.md --clean` | Ingests changelog to production Neon DB and deletes local draft upon success. |
| `npx tsx scripts/ingest.ts content/changelogs/<file>.md --dev --clean` | Ingests changelog to dev Neon DB and deletes local draft upon success. |
| `npx tsx scripts/ingest.ts --dir content/changelogs/` | Batch ingests all markdown files in `content/changelogs/`. |
