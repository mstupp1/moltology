export interface ChangelogEntry {
  id?: string
  slug: string
  version: string
  title: string
  category: 'TRANSMUTATION' | 'CHASSIS_UPGRADE' | 'SECURITY_ISOLATION' | 'BUG_PURGE' | 'FEATURE' | 'SYSTEM_INIT' | string
  summary: string
  content: string
  isPublished?: boolean
  releasedAt: string | Date
  createdAt?: string | Date
}

export const INITIAL_CHANGELOGS: ChangelogEntry[] = [
  {
    slug: '2026-08-19-changelog-reborn-creative-forge',
    version: '2026.08.19',
    title: 'The Changelog Reborn & The Creative Forge',
    category: 'FEATURE',
    summary: 'Gave the changelog a permanent home with clean permalinks and a unified ingestion CLI, hardened the sidebar, and plugged the creative pipeline into local model-run imagery.',
    content: `### The Changelog Reborn
- Reworked changelog routing with clean slug-based permalinks and a unified ingestion CLI, so every future release gets a permanent URL.
- Refined the launchpad carousel and standardized spacing across HUD components.

### The Sidebar Refined
- Made the sidebar resizable with a drag rail and persisted collapse state, and stacked identity controls neatly in the collapsed view.
- Added click-to-close behavior to the command palette.

### The Creative Forge
- Integrated a local model-run pipeline for generating imagery, with workflow automation and mandatory queue routing.
- Added sparse-autoencoder research content and reel history tracking to the broadcast forge.`,
    releasedAt: '2026-08-19T23:59:00Z',
  },
  {
    slug: '2026-08-18-showcase-shield',
    version: '2026.08.18',
    title: 'The Showcase & The Shield',
    category: 'CHASSIS_UPGRADE',
    summary: 'Rebuilt the landing showcase with living device frames, threw up a bot shield at every entry point, and swept the double slashes from the canon.',
    content: `### The Showcase
- Rebuilt the marketing showcase to mirror the real HUD, framed in browser and phone shells, with pre-rendered dashboard screenshots.
- Rounded out the landing page call-to-action styling to match.

### The Shield
- Raised bot protection at every entry point — sign-in, comments, and lead capture. Bots bounce, humans dive.
- Added an opt-in email subscription flow with database tracking for initiates who want dispatches by wire.

### The Polish
- Replaced the default sign-in surface with fully branded authentication UI.
- Swept the aesthetic double slashes ("//") from titles and copy across the entire site.
- Standardized global typography onto a cleaner sans voice.`,
    releasedAt: '2026-08-18T23:59:00Z',
  },
  {
    slug: '2026-08-17-codex-isolation-deck',
    version: '2026.08.17',
    title: 'The Codex Deepens & The Isolation Deck Opens',
    category: 'FEATURE',
    summary: 'The Sacred Codex gained rich-text reading, the isolation HUD opened for deep-work sessions, and the Order grew a careers page.',
    content: `### The Sacred Codex
- Upgraded the codex reader with rich text rendering, custom themes, font variants, and a fullscreen mode with persistent settings.
- Refined citation formatting and standardized symbol usage across the canon.

### The Isolation Deck
- Opened the isolation HUD with a video feed, protocol settings, and telemetry overlays — a private vault for abyssal deep work.
- Made the Oracle chat panel draggable and resizable with layout memory.

### The Order Grows
- Added the careers hub and a Life at HQ gallery so initiates can see who they're becoming.
- Added guest gating with in-message sign-up prompts, guiding curious visitors toward their first molt.

### Voice & Motion
- Added character overlay utilities and multi-voice narration to the daily reels for richer broadcasts.`,
    releasedAt: '2026-08-17T23:59:00Z',
  },
  {
    slug: '2026-08-16-hero-quiz-engine',
    version: '2026.08.16',
    title: 'The Hero & The Quiz Engine',
    category: 'FEATURE',
    summary: 'Gave the landing page living characters and shipped the full Moltmax quiz engine — because knowing your molt score should feel like a game.',
    content: `### Living Heroes
- Added character animations and mascots to the landing page with a chroma-key utility for clean compositing.
- Refreshed hero and deck imagery with new sacrament visuals.

### The Moltmax Quiz Engine
- Replaced the old biometric slider with a multi-step quiz engine, complete with new questions, image-backed scenarios, and a results module.
- Added Moltmax scoring to user profiles so every initiate's stats are tracked honestly.`,
    releasedAt: '2026-08-16T23:59:00Z',
  },
  {
    slug: '2026-08-15-the-texture-layer',
    version: '2026.08.15',
    title: 'The Texture Layer',
    category: 'CHASSIS_UPGRADE',
    summary: "Wrapped the whole surface in high-fidelity texture overlays and sharpened the reels' branding into something sleek enough for the feeds.",
    content: `### The Texture Layer
- Implemented the high-fidelity texture system: physical-material-style overlays across components and the landing page.
- Redesigned the reel watermark and kinetic captions into sleek, responsive branding.
- Automated social reel generation whenever a new dispatch publishes.`,
    releasedAt: '2026-08-15T23:59:00Z',
  },
  {
    slug: '2026-08-14-moltmaxxing-reel-machine',
    version: '2026.08.14',
    title: 'Moltmaxxing & The Reel Machine',
    category: 'FEATURE',
    summary: 'The Moltmaxxing knowledge hub opened its gates, and the daily broadcast forge started printing vertical video for the surface feeds.',
    content: `### The Moltmaxxing Hub
- Opened the Moltmaxxing knowledge hub with an interactive Moltmax scanner and a full guide route.
- Expanded the guide with the meltmaxxing contrast, telemetry data, and protocol updates.

### The Daily Broadcast Forge
- Built the daily vertical-video pipeline: text-to-voice narration, video compositing, thumbnail rendering, and automatic posting to Instagram Reels and YouTube Shorts.
- Added a first-comment field and 1:1 grid-safe thumbnails so every reel ships polished.

### Social Fabric
- Linked the Instagram and YouTube channels across the landing page, Order page, and footer.

### Mobile First
- Anchored the mobile navigation menu and added a bottom-sheet component with toast history for a smoother small-screen dive.`,
    releasedAt: '2026-08-14T23:59:00Z',
  },
  {
    slug: '2026-08-13-autonomous-content-engine',
    version: '2026.08.13',
    title: 'The Autonomous Content Engine',
    category: 'FEATURE',
    summary: 'The system learned to publish itself: a unified ingestion engine, a cloud asset vault, and RSS and sitemap beacons so every dispatch reaches the surface.',
    content: `### The Ingestion Engine
- Built the unified ingestion engine: drop a draft in the vault and it validates, upserts, and publishes to the database automatically.
- Added directory batch sync so entire content repositories flow in one command.

### The Asset Vault
- Wired cloud-backed asset management with automated upload handlers and migration scripts so imagery lives off-site and loads fast.

### The Beacons
- Added RSS feeds and a sitemap so subscribers and crawlers never miss a transmission.
- Standardized search metadata across the network with expanded article support.`,
    releasedAt: '2026-08-13T23:59:00Z',
  },
  {
    slug: '2026-08-12-content-forge',
    version: '2026.08.12',
    title: 'The Content Forge',
    category: 'TRANSMUTATION',
    summary: 'Built the markdown generation engine and dynamic delivery routes that will feed every blog, dispatch, and transmutation log from here on.',
    content: `### The Content Forge
- Forged a markdown generation utility that turns raw material into polished, structured content.
- Wired dynamic route handlers so every post is served on demand, not hand-rolled.`,
    releasedAt: '2026-08-12T23:59:00Z',
  },
  {
    slug: '2026-08-07-new-voices-org-awakens',
    version: '2026.08.07',
    title: 'New Voices in the Deep',
    category: 'FEATURE',
    summary: 'The Oracle grew a voice selector and two new minds, the Order got a friendlier face, and a journal library opened for initiates.',
    content: `### The Oracle's New Voices
- Added a model selector and two fresh minds to the Oracle's fleet — one compact and quick, one flash-fast — with graceful fallback when a voice goes quiet.

### The Order's Public Face
- Redesigned the Order page with a warm, approachable corporate character and refined sections.

### The Journal Library
- Opened a scientific journal reading interface with document-style typography, theme controls, and article routing.
- Unified the daily routine system into a single streak-tracked schema so progress is honest and persistent.`,
    releasedAt: '2026-08-07T23:59:00Z',
  },
  {
    slug: '2026-08-06-policy-siege-oracle-prep',
    version: '2026.08.06',
    title: 'The Policy Siege & Oracle Reconnaissance',
    category: 'SECURITY_ISOLATION',
    summary: "Hardened the admin vaults, purged the public API console, and scouted the models that will power the Oracle's next evolution.",
    content: `### The Vaults Harden
- Enforced admin-only write policies on the changelog vault so only the High Ascendant can alter the record.
- Tightened mobile navigation and gave the welcome splash a proper close and relaunch.

### Oracle Reconnaissance
- Reworked the Oracle's model configuration into a modular, swappable architecture ahead of new voices arriving.`,
    releasedAt: '2026-08-06T23:59:00Z',
  },
  {
    slug: '2026-08-05-discipline-of-discovery',
    version: '2026.08.05',
    title: 'The Discipline of Discovery',
    category: 'TRANSMUTATION',
    summary: 'Put the Order on the map. Canonical tags, search-ready structure, and a code of diegetic discipline so every public word stays on-brand.',
    content: `### The Search Beacons
- Added canonical tags, structured metadata, and crawler-friendly configuration so search engines can find the Order.
- Set machine-readable schemas so automated systems understand the doctrine as well as humans do.

### The Code of Discipline
- Codified the diegetic discipline: every public asset now speaks strictly in-universe. No tech-talk, no leaks, no breaking the fourth wall.`,
    releasedAt: '2026-08-05T23:59:00Z',
  },
  {
    slug: '2026-08-04-moltnation-broadcasts',
    version: '2026.08.04',
    title: 'MoltNation Takes the Airwaves',
    category: 'FEATURE',
    summary: 'MoltNation news went live with a live ticker and searchable archive, podcasts started transmitting, and the dashboard became a command deck.',
    content: `### The News Network
- Launched the MoltNation news index with live ticker, search, filtering, and full article pages.
- Added an animated flagship background so the newsroom looks the part.

### Podcast Transmissions
- Built the podcast player and opened the transmission library for on-demand listening.

### The Dashboard Command Deck
- Added the launchpad carousel, a real-time news widget, a multi-timezone digital clock with scheduling, and a streak-tracked daily routine widget.
- Served guest initiates a welcome splash so the first dive never feels cold.

### Performance & Self-Sailing
- Added global toggles to dial heavy visual effects up or down, and automated database migrations so the ship steers itself.`,
    releasedAt: '2026-08-04T23:59:00Z',
  },
  {
    slug: '2026-08-03-great-shell-polish',
    version: '2026.08.03',
    title: 'The Great Shell Polish',
    category: 'CHASSIS_UPGRADE',
    summary: 'A day of pure chitin: ambient bubble seas, CRT scanlines, a rebuilt sidebar, the blog network, and a hero worthy of the Order.',
    content: `### The Ambience Dives
- Sunk the whole HUD underwater with a living bubble-particle system, CRT scanlines, and grainy glow.
- Added custom loaders, spinners, and an animated conversion meter that ticks toward full carcinization.

### Navigation Rebuilt
- Re-engineered the sidebar: collapsible sections, a command palette, expandable groups, and a floating toggle.
- Introduced the avatar menu so identity follows you across every header.

### The Blog Network
- Launched the blog system with live-sliding featured stories and comment threads for authenticated initiates.
- Raised the legal walls — privacy policy and terms of service — so the Order plays by the rules.

### The Hero Ascends
- Rebuilt the landing hero around an ascended claw silhouette with interactive shuffle-deck cards.`,
    releasedAt: '2026-08-03T23:59:00Z',
  },
  {
    slug: '2026-08-02-component-vault-oracle-awakes',
    version: '2026.08.02',
    title: 'The Vault Opens: The Synaptic Oracle Breathes',
    category: 'FEATURE',
    summary: 'Forged the standard-issue HUD component vault, lit the first lecture halls, opened the gallery, and woke the Synaptic Oracle for its first conversations.',
    content: `### The Standard-Issue Vault
- Forged a library of standard HUD components — cards, buttons, inputs, badges, loaders — one shell for every screen.
- Built error shielding and toast signaling so the system explains itself instead of crashing silently.

### Learning & Growth
- Opened the lecture halls with course catalogs, progress tracking, and syllabus quizzes.
- Launched the gallery grid and wired media storage so initiates can pin their shedding progress.

### The Oracle Wakes
- Brought the Synaptic Oracle online with its first conversation engine, markdown-rich responses, and centralized thread memory across every surface.

### The Changelog Is Born
- Seeded the system changelog itself — the telemetry feed you are reading right now.`,
    releasedAt: '2026-08-02T23:59:00Z',
  },
  {
    slug: '2026-08-01-the-identity-gate',
    version: '2026.08.01',
    title: 'The Identity Gate: Sign In, Shed, Ascend',
    category: 'SECURITY_ISOLATION',
    summary: 'Wired the doorways to the Order. Email and Google sign-in, hardened session armor, and the sacred codex laid its first foundational tomes.',
    content: `### Secure Entryways
- Built the sign-in and sign-up terminals with email and Google passkeys.
- Hardened session armor so every initiate's identity is sealed and verified on entry.
- Added guest exploration mode so curious humans can browse before committing to the molt.

### The Codex Awakens
- Planted the first sacred texts: the canonical structure, scripture templates, and foundational doctrine of the Order.

### The Engine Beneath
- Rerouted the entire platform onto a deeper engine and re-charted every corridor to match.`,
    releasedAt: '2026-08-01T23:59:00Z',
  },
  {
    slug: '2026-07-31-framework-ignition',
    version: '2026.07.31',
    title: 'The First Shed: The Framework Ignites',
    category: 'FEATURE',
    summary: 'Lit the forge beneath the waves. The first scaffold, the benthic HUD shell, and the design language that will carry every future transmutation took their first breath.',
    content: `### The First Shed
- Kindled the Moltology framework: the structural chassis every future build will mount.
- Raised the first benthic HUD shell with the market, pipeline, and landing corridors laid out.
- Locked in the design language for the year ahead — a 3D canvas, a command palette, an AI Oracle, and gamified progression at the center of the experience.`,
    releasedAt: '2026-07-31T23:59:00Z',
  },
]
