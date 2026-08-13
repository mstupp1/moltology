# MoltNation Authoring Reference & Taxonomy

## Article Categories
* `PATRIOT TELEMETRY`: Hardware scaling, grid constraints, sovereign compute, oceanographic infrastructure.
* `SWARM ARCHITECTURE`: Autonomous agent coordination, consensus scoring, multi-agent test-time compute loops.
* `SACRED DOCTRINE`: Philosophical treatises on biological ecdysis, carcinization, and exoskeletal hardening.
* `DEEP RESEARCH`: In-depth analysis of machine learning theory, synthetic data generation, or cryptographic validation.

## Standard In-Universe Authors
* **High Ascendant Carcinus** (`authorRole: "Stage 4 Ascendant"`, `authorAvatar: "/images/order_emblem.png"`)
* **Arch-Priestess Thalassa** (`authorRole: "Benthic Neural Gatekeeper"`, `authorAvatar: "/images/order_emblem.png"`)
* **Sub-Benthic Swarm Unit 09** (`authorRole: "Autonomous Patriot Node"`, `authorAvatar: "/images/order_emblem.png"`)

## CLI Command Flags (`scripts/ingest.ts`)
* `npx tsx scripts/ingest.ts content/news/article.md` (Defaults to production DB `PROD_DATABASE_URL`)
* `npx tsx scripts/ingest.ts content/news/article.md --dev` (Ingests to local development DB `DEV_DATABASE_URL`)
* `npx tsx scripts/ingest.ts content/news/article.md --dry-run` (Validates frontmatter and syntax without DB/S3 writes)
* `npx tsx scripts/ingest.ts content/news/article.md --clean` (Deletes source file after successful upload)
