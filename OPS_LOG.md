# Moltology Operations Log

A living record of our active discussions, decisions, and open threads for the Moltology project.

---

## Current Focus
* **Topic**: Extensible Content Ingestion Script Suite (`scripts/ingest.ts`)
* **Status**: Completed! Implemented clean CLI runner, YAML frontmatter/JSON parser, payload normalizers, and Drizzle ORM upsert handlers for `blog_posts`, `changelogs`, and `podcasts`. Verified with unit tests, dry-run mode, and dev database upsert validation.

---

## Key Decisions Made
* **Collaboration Framework**: Established a shared workflow covering Product, Content, and Marketing Operations.
* **Progress Tracking**: Using this `OPS_LOG.md` file and repository git history as the single source of truth for ongoing context across sessions.
* **Pacing Rule**: Daily syncs resume strictly from the last open thread rather than proposing unprompted big ideas.
* **Ingestion Direction**: Built a unified, extensible CLI script (`scripts/ingest.ts` / `npm run db:ingest`) that reads markdown files with frontmatter or JSON payloads and upserts directly into Neon PostgreSQL via Drizzle ORM.
* **Content Vault**: Standardized `content/` folder structure (`content/news/`, `content/changelogs/`, `content/podcasts/`) with templates and documentation.

---

## Where We Left Off / Open Questions
* **Next Action**: Content creation pipelines are fully enabled for requesting agents and human contributors. Agents can compose in `content/` and execute `npm run db:ingest -- content/news/my-dispatch.md`.
* **Testing**: Verified in local database and browser testing.

---

## Backlog / Future Threads
* **Super Admin Portal**: Building an in-app HUD editor on `moltology.org` for manual adjustments.
* **Monetization Architecture**: Subscription tiers (Clearance levels), Molt Credits / Chitin Gems virtual economy, physical merch integration.
* **Marketing & CRM Automation**: Onboarding email journeys, stage progression notifications, social teaser drops.
* **Lead Magnets**: Interactive "Carcinization Stage / Shell Hardness Calculator" viral widget.
