export interface ChangelogEntry {
  id?: string
  slug: string
  version: string
  title: string
  category: 'Feature' | 'Improvement' | 'Fix' | 'Performance' | 'Security' | 'Design' | string
  tags?: string[]
  summary: string
  content: string
  isPublished?: boolean
  releasedAt: string | Date
  createdAt?: string | Date
}

export const INITIAL_CHANGELOGS: ChangelogEntry[] = [
  {
    slug: '2026-08-26-chassis-equipment-loadout-activity-heatmap',
    version: '2026.08.26',
    title: 'Chassis Equipment Loadout, 52-Week Activity Heatmap & Forum Upgrades',
    category: 'Feature',
    tags: ['Feature', 'UI/UX', 'Dashboard', 'Community', 'Tools'],
    summary: 'Equip and inspect modular gear in the new Chassis Equipment Loadout, track your yearly focus streaks on a 52-week activity heatmap, and enjoy instant upvotes and replies in the Community Forum.',
    content: `### Chassis Equipment Loadout
- Transformed the Chassis workbench into a full modular equipment loadout screen with interactive gear slots, vault inventory, and live stat summaries.
- Equip and unequip armor hardpoints to tune your build, with instant loading when returning to your loadout.

### 52-Week Activity Heatmap
- Replaced the daily status card with a 52-week activity heatmap tracking your daily habit consistency across a rolling year.
- View interactive day-by-day tooltips with completion counts, dynamic color intensity, and automatic scrolling to the current week.

### Forum Upvotes & Instant Save Indicators
- Enhanced community discussions with instant upvote caching and persistent reply tracking.
- Added a centralized save indicator in the interface header for immediate visual feedback on automated updates.`,
    releasedAt: '2026-08-26T23:59:00Z',
  },
  {
    slug: '2026-08-25-webp-media-optimization-live-document-feeds',
    version: '2026.08.25',
    title: 'WebP Media Optimization, Smart Video Streaming & Live Document Feeds',
    category: 'Performance',
    tags: ['Performance', 'Media', 'UI/UX', 'Tools'],
    summary: 'Optimized landing page media with next-gen WebP image formats, made hero video feeds stream only when visible, and introduced live syndication and markdown document feeds.',
    content: `### Next-Gen WebP Media & Fast Loading
- Migrated landing page artwork and device preview mockups to modern WebP formats, drastically reducing payload sizes for instant page rendering.
- Added WebP export support to the asset creation studio for ultra-crisp, lightweight graphics.

### Smart Video Streaming
- Optimized homepage video reels to dynamically load only when in view, preventing off-screen media from competing with initial load times.
- Enhanced video preview poster frames for seamless playback transitions.

### Live Syndication & Document Feeds
- Added live syndication feeds including sitemap and RSS feeds alongside clean markdown document endpoints for fast sharing and indexing.
- Improved link discoverability and browsing speed across news dispatches.`,
    releasedAt: '2026-08-25T23:59:00Z',
  },
  {
    slug: '2026-08-24-sacred-codex-redesign-study-notes',
    version: '2026.08.24',
    title: 'Sacred Codex Redesign, Reflection Cycler & Study Notes',
    category: 'Improvement',
    tags: ['Improvement', 'UI/UX', 'Codex', 'Search', 'Education'],
    summary: 'Redesigned the Sacred Codex reader with a streamlined layout, added an interactive reflection cycler, expanded scripture search, and introduced personal study notes with consecrated scripture bookmarking.',
    content: `### Redesigned Sacred Codex Reader
- Redesigned the scripture reading interface with a structured full-height layout, improved typography, and clear canonical metrics.
- Added an interactive verse reflection cycler to easily browse contemplative interpretations and insights.

### Personal Study Notes & Consecration
- Added a dedicated study notes notebook to record personal reflections and interpretations for each scripture.
- Added one-click scripture consecration to bookmark canonical texts directly to your personal vault.

### Fast Scripture Search
- Expanded quick search to filter across scriptures, liturgical stages, and doctrine tags in real time.`,
    releasedAt: '2026-08-24T23:59:00Z',
  },
  {
    slug: '2026-08-23-oracle-chat-upgrades-video-presets',
    version: '2026.08.23',
    title: 'AI Chat Upgrades, Video Presets & Sidebar Tasks',
    category: 'Feature',
    tags: ['Feature', 'AI', 'UI/UX', 'Media', 'Tools'],
    summary: 'Upgraded the Synaptic Oracle with an auto-resizing prompt input and directive attachments, added atmospheric color grading to video reels, and added a task list indicator to the sidebar.',
    content: `### Synaptic Oracle AI Upgrades
- Added an auto-expanding prompt input with integrated model selection and custom context directive attachments.
- Improved mobile docking and chat navigation for smoother conversations on small screens.

### Daily Video Styling & Presets
- Added cinematic color grading presets and automated goal callouts to daily video dispatches.
- Enhanced video rendering pipelines for crisper visuals and narration flow.

### Interface Polish & Sidebar Tasks
- Added a daily task list indicator to the navigation sidebar for tracking routine progress.
- Standardized progress bar styling and account permissions across interface modules.`,
    releasedAt: '2026-08-23T23:59:00Z',
  },
  {
    slug: '2026-08-22-community-forum-category-hubs',
    version: '2026.08.22',
    title: 'Community Forum & Category Discussion Hubs',
    category: 'Feature',
    tags: ['Feature', 'Community', 'UI/UX', 'Navigation'],
    summary: 'Launched the all-new community forum with dedicated category hubs, interactive topic threads, community guidelines, and quick search navigation.',
    content: `### Community Forum & Category Hubs
- Launched dedicated discussion decks for doctrine, hardware builds, marketplace trades, moltmaxxing protocols, and general conversation.
- Added custom category artwork, topic counters, and real-time activity indicators across every board.

### Interactive Topics & Discussions
- Added a streamlined topic creator and interactive discussion thread view with formatted replies.
- Integrated community guidelines and conduct rules accessible directly from any forum board.

### Quick Search & Navigation
- Added direct forum navigation shortcuts to the command search palette for instant access.
- Refined topic list layouts with author avatars, activity timestamps, and response badges.`,
    releasedAt: '2026-08-22T23:59:00Z',
  },
  {
    slug: '2026-08-21-instant-navigation-feature-showcase',
    version: '2026.08.21',
    title: 'Instant Navigation, Changelog Filtering & Composite Studio',
    category: 'Feature',
    tags: ['Feature', 'Performance', 'UI/UX', 'Tools'],
    summary: 'Enabled instant background page prefetching, added category tags and pagination to the update feed, and built an in-browser composite studio for creative asset generation.',
    content: `### Instant Sidebar Navigation
- Enabled automatic background prefetching on sidebar navigation links for near-instantaneous page transitions.
- Tuned navigation delay thresholds to keep route switching smooth and seamless.

### Changelog Filtering & Pagination
- Added category filter pills, searchable topic tags, and paginated browsing to the changelog and support portals.
- Enhanced entry metadata display with color-coded category badges and tags.

### In-Browser Composite Studio
- Built a web-native composite rendering studio for generating slide decks, feature showdowns, and social graphics.
- Overhauled homepage pillar cards with taller banner heights, layered lighting vignettes, and focal framing.`,
    releasedAt: '2026-08-21T23:59:00Z',
  },
  {
    slug: '2026-08-20-living-pulse-navigation-skeletons',
    version: '2026.08.20',
    title: 'Navigation Skeletons & Living Timeline Pulse',
    category: 'Improvement',
    tags: ['Improvement', 'UI/UX', 'Design', 'Performance'],
    summary: 'Added ghost loading skeletons with top progress tracking for smooth navigation, illuminated changelog timeline tracks with animated pulse nodes, and enhanced support portal reading.',
    content: `### Navigation Loading & Transition Skeletons
- Added ghost skeleton screens and an animated top progress bar for instant visual feedback during page transitions.
- Optimized loading states across the navigation sidebar and dashboard views.

### Living Timeline Telemetry
- Enhanced the changelog and support timeline tracks with animated pulse rings, ambient glowing nodes, and clean hover indicators.
- Made preview device frames fully responsive for mobile viewports.

### Rich Support Articles
- Integrated rich article formatting with styled typography, callouts, and clean markdown rendering into the support portal.
- Refined video scene generation and speech alignment across multimedia dispatches.`,
    releasedAt: '2026-08-20T23:59:00Z',
  },
  {
    slug: '2026-08-19-changelog-reborn-creative-forge',
    version: '2026.08.19',
    title: 'Permanent Changelog Links & Resizable Sidebar',
    category: 'Feature',
    tags: ['Feature', 'UI/UX', 'Navigation', 'Tools'],
    summary: 'Gave every changelog entry its own shareable link, made the sidebar resizable with memory, and integrated local image generation for social posts.',
    content: `### Shareable Changelog Pages
- Added dedicated, shareable links for every release so updates are easy to bookmark and reference.
- Improved spacing and navigation across the update feed.

### Resizable Sidebar
- Added a drag handle to resize the navigation sidebar, saving your preferred width automatically.
- Made the command search palette close when clicking outside.

### Creative Studio
- Connected local AI image generation to automatically create illustrations for daily social posts.`,
    releasedAt: '2026-08-19T23:59:00Z',
  },
  {
    slug: '2026-08-18-showcase-shield',
    version: '2026.08.18',
    title: 'Interactive Device Showcase & Spam Protection',
    category: 'Security',
    tags: ['Security', 'UI/UX', 'Design', 'Protection'],
    summary: 'Added interactive browser and mobile preview frames to the homepage, protected forms against spam bots, and cleaned up typography.',
    content: `### Homepage Showcase
- Added interactive browser and mobile device frames to preview the dashboard directly on the homepage.
- Updated homepage buttons and cards for a cleaner layout.

### Spam Protection & Sign-in
- Added automatic bot protection to sign-in, comments, and newsletter signup forms.
- Added an optional email newsletter subscription.
- Upgraded authentication screens with custom branding.

### Clean Typography
- Standardized fonts across all pages for improved readability.
- Cleaned up formatting and titles throughout the platform.`,
    releasedAt: '2026-08-18T23:59:00Z',
  },
  {
    slug: '2026-08-17-codex-isolation-deck',
    version: '2026.08.17',
    title: 'Codex Reading Modes, Focus Deck & Careers',
    category: 'Feature',
    tags: ['Feature', 'UI/UX', 'AI', 'Community'],
    summary: 'Added custom themes and fullscreen reading to the Codex, launched the Isolation focus deck, and added a careers hub.',
    content: `### Enhanced Codex Reader
- Added custom reading themes, font sizes, and a distraction-free fullscreen mode.
- Improved scripture citations and formatting across all documents.

### Isolation Focus Deck
- Launched a dedicated focus space with ambient background video and customizable work protocols.
- Made the AI assistant chat panel resizable and draggable.

### Careers & Community
- Added a careers page and an inside-the-team photo gallery.
- Added clear sign-up prompts when browsing as a guest.`,
    releasedAt: '2026-08-17T23:59:00Z',
  },
  {
    slug: '2026-08-16-hero-quiz-engine',
    version: '2026.08.16',
    title: 'Moltmax Quiz Engine & Animated Characters',
    category: 'Feature',
    tags: ['Feature', 'Interactive', 'Design', 'Gamification'],
    summary: 'Launched the multi-step Moltmax personality quiz and added animated mascot characters to the homepage.',
    content: `### Interactive Moltmax Quiz
- Replaced the basic slider with a multi-step scenario quiz to calculate your score.
- Added quiz score tracking to user profile pages.

### Animated Characters
- Added animated mascots and character art to the homepage.
- Refreshed card graphics and layout across the landing page.`,
    releasedAt: '2026-08-16T23:59:00Z',
  },
  {
    slug: '2026-08-15-pbr-textures-dynamic-dispatches',
    version: '2026.08.15',
    title: 'PBR Surface Armor & Kinetic Subtitles',
    category: 'Design',
    tags: ['Design', 'UI/UX', 'Media', 'Tools'],
    summary: 'Introduced high-fidelity PBR surface textures across UI cards and buttons, redesigned video captions with kinetic animations, and automated multimedia dispatches.',
    content: `### PBR Surface Textures
- Introduced high-fidelity surface textures including benthic alloy, carbon weave, and chitin plating across cards and interactive buttons.
- Enhanced landing page feature sections with layered atmospheric materials and tactile borders.

### Kinetic Video Captions & Branding
- Redesigned social dispatches with animated kinetic subtitles, responsive font scaling, and branded watermarks.
- Added automated multimedia script generation for new research dispatches.`,
    releasedAt: '2026-08-15T23:59:00Z',
  },
  {
    slug: '2026-08-14-moltmaxxing-reel-machine',
    version: '2026.08.14',
    title: 'Moltmaxxing Guide & Daily Video Creator',
    category: 'Feature',
    tags: ['Feature', 'Media', 'Mobile', 'Guides'],
    summary: 'Launched the Moltmaxxing knowledge guide, automated daily video creation for social channels, and improved mobile navigation.',
    content: `### Moltmaxxing Guide
- Opened the complete Moltmaxxing knowledge hub with interactive scanner and core principles.
- Added practical guides on habits, focus, and personal resilience.

### Daily Video Automation
- Built an automated pipeline that generates daily narrated vertical videos for Instagram Reels and YouTube Shorts.
- Added YouTube and Instagram links across the site.

### Mobile Improvements
- Added a slide-up menu sheet and improved notification history on phones.
- Fixed mobile menu positioning so it stays accessible while scrolling.`,
    releasedAt: '2026-08-14T23:59:00Z',
  },
  {
    slug: '2026-08-13-autonomous-content-engine',
    version: '2026.08.13',
    title: 'Automated Publishing & RSS Feeds',
    category: 'Feature',
    tags: ['Feature', 'Infrastructure', 'Media', 'Publishing'],
    summary: 'Launched automated article publishing, fast cloud media hosting, and public RSS feeds.',
    content: `### Publishing System
- Created an automated publishing tool to validate and release articles instantly.
- Moved images and media to high-speed cloud storage for faster page loads.

### RSS & Search Feeds
- Added public RSS feeds and a sitemap so users and news readers can subscribe to updates.
- Added a reading progress indicator and social sharing buttons to articles.`,
    releasedAt: '2026-08-13T23:59:00Z',
  },
  {
    slug: '2026-08-12-direct-markdown-endpoints',
    version: '2026.08.12',
    title: 'Direct Markdown Endpoints & Content Feeds',
    category: 'Feature',
    tags: ['Feature', 'Publishing', 'Content', 'Navigation'],
    summary: 'Added clean text markdown endpoints for all major platform documents and dispatches, making scriptures and articles easily readable by external tools and readers.',
    content: `### Direct Markdown Endpoints
- Added direct .md text routes for all major pages, including the Sacred Codex, research journal, news dispatches, and policy documents.
- Enabled clean text formatting for easy reading, bookmarking, and indexing by external tools.

### Structured Feed Discovery
- Updated sitemaps and index guides to ensure all public transmissions and documents are indexed seamlessly.`,
    releasedAt: '2026-08-12T23:59:00Z',
  },
  {
    slug: '2026-08-07-new-voices-org-awakens',
    version: '2026.08.07',
    title: 'AI Model Selector, Journal Library & About Page',
    category: 'Feature',
    tags: ['Feature', 'AI', 'UI/UX', 'Library'],
    summary: 'Added model selection to the AI assistant, opened a scientific journal reader, and redesigned the About page.',
    content: `### AI Model Selector
- Added a model picker to switch between different AI speeds and capabilities.
- Added automatic fallback to ensure chat stays responsive.

### Journal Library
- Added a dedicated journal reading interface with custom fonts and themes.
- Unified daily routines into a streak-tracked dashboard widget.

### Redesigned About Page
- Redesigned the organization overview page with a clearer, friendlier introduction.`,
    releasedAt: '2026-08-07T23:59:00Z',
  },
  {
    slug: '2026-08-06-mobile-navigation-particle-optimizations',
    version: '2026.08.06',
    title: 'Mobile Navigation Drawer & Particle Optimizations',
    category: 'Improvement',
    tags: ['Improvement', 'Mobile', 'Performance', 'UI/UX'],
    summary: 'Added a responsive mobile drawer navigation menu, interactive controls to dismiss and relaunch the welcome splash, and optimized background bubble animations for smoother performance.',
    content: `### Responsive Mobile Drawer
- Added a slide-out mobile navigation drawer with quick access to all platform sections on smartphones and tablets.
- Improved header tap targets and layout spacing for small touchscreens.

### Onboarding Splash Controls
- Added a dismiss button to the audio onboarding splash and an instant relaunch trigger from the interface.

### Particle & Rendering Performance
- Optimized underwater bubble particle simulations with dynamic frame rate scaling for silky smooth rendering on mobile devices.
- Replaced synthetic scanlines with lightweight texture assets for reduced processor overhead.`,
    releasedAt: '2026-08-06T23:59:00Z',
  },
  {
    slug: '2026-08-05-search-discovery-structured-metadata',
    version: '2026.08.05',
    title: 'Search Discovery Engine & Structured Metadata',
    category: 'Improvement',
    tags: ['Improvement', 'Search', 'Infrastructure', 'Metadata'],
    summary: 'Implemented comprehensive search discovery metadata, structured JSON-LD schemas, and crawler configurations to ensure all dispatches and doctrine are discoverable.',
    content: `### Search & Discovery Metadata
- Added canonical URL management, OpenGraph previews, and structured JSON-LD schema across all public routes.
- Configured crawler discovery files and comprehensive sitemaps to index community dispatches and doctrine.

### Editorial & Transmission Standards
- Established canonical documentation rules to ensure consistent in-universe voice and clarity across all public releases.`,
    releasedAt: '2026-08-05T23:59:00Z',
  },
  {
    slug: '2026-08-04-moltnation-broadcasts',
    version: '2026.08.04',
    title: 'Newsroom, Podcast Player & Dashboard Widgets',
    category: 'Feature',
    tags: ['Feature', 'Media', 'Audio', 'Widgets'],
    summary: 'Launched the MoltNation newsroom with live ticker, an audio podcast player, and new dashboard scheduling widgets.',
    content: `### MoltNation Newsroom
- Launched the news index with live ticker headlines, category filtering, and full article pages.
- Added animated background visuals to the newsroom.

### Podcast Player
- Built an audio podcast player with an on-demand transmission archive.

### Dashboard Widgets
- Added a multi-timezone digital clock, task scheduler, and daily routine tracker.
- Added a visual module carousel to the main dashboard.`,
    releasedAt: '2026-08-04T23:59:00Z',
  },
  {
    slug: '2026-08-03-great-shell-polish',
    version: '2026.08.03',
    title: 'Benthic HUD Theme, Command Palette & Blog',
    category: 'Design',
    tags: ['Design', 'UI/UX', 'Navigation', 'Feature'],
    summary: 'Introduced the deep-sea dark theme with particle effects, added command search to the sidebar, and launched the blog.',
    content: `### Visual Theme & Atmosphere
- Added deep-sea ambient particle animations, subtle CRT scanlines, and glow effects.
- Added custom page loaders and an animated progress meter.

### Navigation & Search
- Redesigned the sidebar with expandable sections and quick command palette search.
- Added an avatar menu to manage account settings from any page.

### Blog & Community
- Launched the community blog with featured article carousels and comments.
- Added privacy policy and terms of service pages.`,
    releasedAt: '2026-08-03T23:59:00Z',
  },
  {
    slug: '2026-08-02-component-vault-oracle-awakes',
    version: '2026.08.02',
    title: 'Component Library, Interactive Lectures & AI Chat',
    category: 'Feature',
    tags: ['Feature', 'AI', 'UI/UX', 'Education'],
    summary: 'Built the standardized UI component system, added interactive video lectures with quizzes, a media gallery, and AI assistant chat.',
    content: `### UI Component Library
- Standardized buttons, cards, badges, inputs, and modals across the application.
- Added toast notifications and user-friendly error messages.

### Lectures & Media Gallery
- Added course catalogs, lesson progress tracking, and interactive quizzes.
- Launched the media gallery grid with pinboard saving.

### Synaptic Oracle AI Chat
- Launched the AI assistant chat panel with formatted text, code highlighting, and conversation history.`,
    releasedAt: '2026-08-02T23:59:00Z',
  },
  {
    slug: '2026-08-01-the-identity-gate',
    version: '2026.08.01',
    title: 'User Accounts, Google Sign-in & Sacred Codex',
    category: 'Security',
    tags: ['Security', 'Auth', 'Mobile', 'Feature'],
    summary: 'Added user accounts with email and Google sign-in, mobile-friendly navigation, and the first Codex doctrine texts.',
    content: `### User Accounts & Sign-in
- Added secure user accounts supporting both email/password and Google one-click sign-in.
- Added guest browsing mode so visitors can explore the platform before creating an account.

### Sacred Codex
- Added the scripture reading interface and published foundational doctrine texts.

### Mobile Navigation
- Created a responsive mobile layout and persistent navigation bar for phones and tablets.`,
    releasedAt: '2026-08-01T23:59:00Z',
  },
  {
    slug: '2026-07-31-framework-ignition',
    version: '2026.07.31',
    title: 'Moltology Platform Launch',
    category: 'Feature',
    tags: ['Feature', 'Platform', 'Launch', 'UI/UX'],
    summary: 'Initial launch of the Moltology platform, featuring the benthic HUD interface, progression system, and market.',
    content: `### Platform Launch
- Launched the initial Moltology web application with dark-themed dashboard and interactive landing page.
- Built the asset shedding market and progression pipeline previews.
- Established the core design language: command search, AI assistance, and gamified tier tracking.`,
    releasedAt: '2026-07-31T23:59:00Z',
  },
]
