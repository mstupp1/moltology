# MoltNation Authoring Reference & Taxonomy

## Article Categories
* `TELEMETRY`: The default for news dispatches: a real development in AI, robotics, or work, reported and argued.
* `SWARM ARCHITECTURE`: Multi-agent workflows, tool boundaries, and autonomous coordination.
* `SACRED DOCTRINE`: Essays on habits, boundaries, and Moltology practice.
* `DEEP RESEARCH`: In-depth analysis of frontier models, hardware constraints, or scientific papers.

## Bylines
Rotate the three dispatch personas from BRAND_BIBLE §3.2 and let the persona set the voice:
* **Silas Trench** (`authorRole: "Senior Benthic Telemetry Correspondent"`): dry, observant field reporter. Robotics, sites, deployments.
* **Dr. Thalassa Vance** (`authorRole: "Arch-Integrator 09"`): precise and kind. Focus, attention, research results.
* **Chitin Architect V** (`authorRole: "The Order of the Synaptic Path"`): the builder. Systems, boundaries, infrastructure.

## CLI Command Flags (`scripts/ingest.ts`)
* `npx tsx scripts/ingest.ts content/news/article.md` (Defaults to production DB `PROD_DATABASE_URL`)
* `npx tsx scripts/ingest.ts content/news/article.md --dev` (Ingests to local development DB `DEV_DATABASE_URL`)
* `npx tsx scripts/ingest.ts content/news/article.md --dry-run` (Validates frontmatter and syntax without DB/S3 writes)
* `npx tsx scripts/ingest.ts content/news/article.md --clean` (Deletes source file after successful upload)
