# Content workflows and ingestion

Read the shared prerequisites and matching skill before any content pipeline, including supporting artwork, reference ingestion, research, drafts, and chained skills.

## Shared prerequisites

- Read [BRAND_BIBLE.md](../BRAND_BIBLE.md) and [STYLE_GUIDE.md](../STYLE_GUIDE.md) before user-facing copy. Every writing skill uses the [writing playbook](writing-playbook.md) for voice, loudness, hooks, and the boredom check.
- Follow [content worktree hygiene](../docs/content-worktree-hygiene.md): record starting Git state, commit all intentional run-owned changes (including ledgers and skill updates), and verify final status. A clean start must finish clean. Preserve and report unrelated or concurrent work. This applies to drafts, chained skills, and partial failures too.
- Read the [annual content calendar](annual-content-calendar.md) before choosing topics, copy, or artwork. Use the intended publication date and channel timezone; follow seasonal lead-in and expiry. News and release claims still require actual sources and shipped work. Supporting asset skills inherit the campaign brief without changing canonical identities or factual screenshots.
- Follow [asset workflows](../docs/assets-and-media.md) and the [social archive procedure](../docs/social-archive.md). Archive finished social files in Google Drive before queueing; website/blog media, character sources, and reusable templates stay on Neon S3. Preserve final files after failures.
- Queue and publish through repo CLI scripts only, never Zernio MCP tools. [Publishing storage](../docs/social-publishing-storage.md) explains Zernio uploads and retries.

## Choose the matching skill

| Task | Required skill / source |
| --- | --- |
| Codex scriptures | [codex-sync](../.agents/skills/codex-sync/SKILL.md); sources in [codex/](../codex/README.md) |
| Academy courses and tracks | [academy-course-creator](../.agents/skills/academy-course-creator/SKILL.md); Markdown in [academy/](academy/README.md), ingested with `npm run academy:ingest` |
| Single Instagram posts | [instagram-post-creator](../.agents/skills/instagram-post-creator/SKILL.md) |
| Instagram carousels | [instagram-carousel-creator](../.agents/skills/instagram-carousel-creator/SKILL.md) |
| Loud, format-led carousels | [benthic-swipe-lab](../.agents/skills/benthic-swipe-lab/SKILL.md) |
| Reels and Shorts | [reels-and-shorts-creator](../.agents/skills/reels-and-shorts-creator/SKILL.md) |
| Blog dispatches | [blog-creator](../.agents/skills/blog-creator/SKILL.md) |
| Long-form YouTube topic validation | [youtube-research](../.agents/skills/youtube-research/SKILL.md) |
| Composite layouts from references | [composite-reference-library](../.agents/skills/composite-reference-library/SKILL.md), `npm run refs`; JSON specs in [composite-layouts/](composite-layouts/README.md) |

Composites render through `scripts/lib/composite-renderer.ts` using `npm run composite:render`.

## Automated Blog Creation Process (Agent SOP)

Use [blog-creator](../.agents/skills/blog-creator/SKILL.md) for research, drafting, illustration, ingestion, and companion social handoffs. It owns the current workflow, including autonomous topic scouting by default and Google Drive input when explicitly requested. Do not maintain a second production SOP here.

## Ingestion reference

Structured Markdown and JSON sources are published to Neon PostgreSQL with `scripts/ingest.ts`. The commands and frontmatter below document ingestion; follow the matching skill for production.

## Directory Structure

```
content/
├── news/               # Blog posts / MoltNation news dispatches (upserts to blog_posts)
│   ├── template.md     # Reference template for blog posts
│   └── *.md
└── changelogs/         # System changelogs & version releases (upserts to changelogs)
    ├── template.md     # Reference template for changelogs
    └── *.md
```

---

## CLI Usage Guide

### Single File Ingestion
```bash
# Ingest a single news article (defaults to PRODUCTION database)
npx tsx scripts/ingest.ts content/news/my-article.md

# Target DEVELOPMENT / local branch database
npx tsx scripts/ingest.ts content/news/my-article.md --dev

# Or via package.json script
npm run db:ingest -- content/news/my-article.md
```

### Batch Directory Ingestion
```bash
# Ingest all articles in content/news/ (Production)
npx tsx scripts/ingest.ts --dir content/news/

# Ingest all content across all subfolders (Development)
npx tsx scripts/ingest.ts content/ --dev
```

### Dry Run (Validation Mode)
Validate frontmatter and schema without writing to the database:
```bash
npx tsx scripts/ingest.ts content/news/my-article.md --dry-run
```

### Database Environment Resolution
- **Default (Production)**: Reads `PROD_DATABASE_URL` or `DATABASE_URL_PROD` or `DATABASE_URL`.
- **Development (`--dev`)**: Reads `DEV_DATABASE_URL` or `DATABASE_URL`.
- **Explicit Connection (`--db <url>`)**: Connects to the provided Postgres connection string directly.
```bash
# Ingest directly into custom database URL
npx tsx scripts/ingest.ts content/news/my-article.md --db "postgresql://user:pass@ep-custom.neon.tech/neondb?sslmode=require"
```

---

## Frontmatter Field Reference

### 1. Blog / News (`content/news/*.md`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | string | **Yes** | `Title: Subtitle` (colon). The news HUD splits at the first colon. No separate subtitle field. |
| `slug` | string | No | URL slug (auto-generated from title if omitted) |
| `summary` | string | No | Brief excerpt (auto-extracted from body if omitted) |
| `category` | string | No | Default: `SACRED DOCTRINE` |
| `tags` | string[] | No | Array of tags, e.g. `['AI Learning', 'Telemetry']` |
| `authorName` | string | No | Default: `High Ascendant Carcinus` |
| `authorRole` | string | No | Default: `Stage 4 Ascendant` |
| `authorAvatar` | string | No | Default: `/images/order_emblem.png` |
| `coverImageUrl`| string | No | URL / path to cover image |
| `readTimeMinutes` | number | No | Estimated read time (auto-calculated if omitted) |
| `isFeatured` | boolean | No | Default: `false` |
| `isPublished` | boolean | No | Default: `true` |
| `publishedAt` | ISO date | No | Defaults to current timestamp |

### 2. Changelogs (`content/changelogs/*.md`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `version` | string | **Yes** | Semantic version string, e.g. `v1.5.0` |
| `title` | string | **Yes** | Release title |
| `category` | string | No | `FEATURE`, `TRANSMUTATION`, `CHASSIS_UPGRADE`, `SECURITY_ISOLATION`, `BUG_PURGE` |
| `summary` | string | No | Excerpt of the release highlights |
| `isPublished` | boolean | No | Default: `true` |
| `releasedAt` | ISO date | No | Release timestamp |
