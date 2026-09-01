# Content Ingestion System

This directory houses structured Markdown and JSON content source files for Moltology. Files in these directories can be programmatically published and updated in Neon PostgreSQL using the `scripts/ingest.ts` CLI tool.

---

## Automated Blog Creation Process (Agent SOP)

Follow [`.agents/skills/blog-creator/SKILL.md`](../.agents/skills/blog-creator/SKILL.md). **Do not ideate a topic from scratch.**

When an agent is asked to **"run blog creation process"**, it follows this loop:

1. **Pull from Google Drive** (`Projects/Moltology/news/ready/`):
   - Sibling folders: `drafts/` (do not publish) and `shipped/` (already ingested).
   - If one or more ingest-ready markdown files exist (frontmatter matching `content/news`), pick the **oldest** and use that body as the article.
   - If `ready/` is empty, **STOP**. Skip the day. Do not write a fallback article. End the run.
2. **Generate Cover & Inline Images** (only after a ready file is selected):
   - Call `generate_image` with cinematic 16:9 prompts drawn from the selected article.
   - Generate a main cover image AND 1-3 inline supporting diagrams/figures.
3. **Stage the Ready Article with Inline Figures**:
   - Copy the ready markdown to `content/news/<slug>.md`. Keep that prose. Point frontmatter and figure slots at the generated images:
     ```markdown
     ---
     title: "Article Title: The Supporting Subtitle"
     category: "SWARM ARCHITECTURE" # or SACRED DOCTRINE, DEEP RESEARCH, TELEMETRY
     tags: ["Sub-Benthic", "Agentic Systems", "AI Hardware"]
     authorName: "High Ascendant Carcinus"
     authorRole: "Stage 4 Ascendant"
     coverImageUrl: "path/to/generated_cover.png"
     ---

     ### Executive Summary
     Article body...

     ![Sub-Benthic Compute Pod Telemetry Frame](path/to/generated_inline_figure_1.png)

     ### Deep Abyssal Analysis
     Article body...

     ![Hydrothermal Power Coupling Matrix](path/to/generated_inline_figure_2.png)
     ```
4. **Ingest to Live Database**:
   - Execute: `npx tsx scripts/ingest.ts content/news/<slug>.md`
   - *(The CLI automatically uploads the cover image AND all inline body images to Neon S3 `moltology-public-assets`, replaces local paths with public HTTPS URLs in the Markdown body, and upserts the post into production PostgreSQL).*
   - After a successful ingest, move the Drive file to `Projects/Moltology/news/shipped/`. Do not leave it in `ready/`.
5. **Verify Live Output**:
   - Confirm article and rendered HUD figures are live on `https://moltology.org/news/<slug>`.

---

## Directory Structure

```
content/
├── news/               # Blog posts / MoltNation news dispatches (upserts to blog_posts)
│   ├── template.md     # Reference template for blog posts
│   └── *.md
├── changelogs/         # System changelogs & version releases (upserts to changelogs)
│   ├── template.md     # Reference template for changelogs
│   └── *.md
└── podcasts/           # Audio transmissions & podcast episodes (upserts to podcasts)
    ├── template.md     # Reference template for podcasts
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

### 3. Podcasts (`content/podcasts/*.md`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | string | **Yes** | Episode title |
| `audioUrl` | string | **Yes** | Direct URL to audio file (MP3 / AAC) |
| `slug` | string | No | URL slug (auto-generated from title if omitted) |
| `subtitle` | string | No | Subtitle or tagline |
| `description` | string | No | Episode summary |
| `durationSeconds`| number | No | Audio duration in seconds |
| `category` | string | No | Default: `TRANSMISSION` |
| `tags` | string[] | No | Tags for categorization |
| `isPublished` | boolean | No | Default: `true` |
