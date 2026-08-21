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
    slug: '2026-08-21-instant-navigation-feature-showcase',
    version: '2026.08.21',
    title: 'Instant Navigation Prefetching & Enhanced Feature Cards',
    category: 'CHASSIS_UPGRADE',
    summary: 'Enabled instant background page prefetching on sidebar links and upgraded homepage feature cards with expanded banners, atmospheric vignettes, and focal framing.',
    content: `### Instant Sidebar Navigation
- Enabled automatic background prefetching on sidebar navigation links for near-instantaneous page transitions.
- Tuned navigation delay thresholds to keep route switching smooth and seamless.

### Expanded Feature Showcase
- Overhauled homepage pillar cards with taller banner heights, layered lighting vignettes, and technical corner overlays.
- Added custom image focal positioning to highlight key mentor and feature artwork dynamically.`,
    releasedAt: '2026-08-21T23:59:00Z',
  },
  {
    slug: '2026-08-20-living-pulse-navigation-skeletons',
    version: '2026.08.20',
    title: 'Navigation Skeletons & Living Timeline Pulse',
    category: 'CHASSIS_UPGRADE',
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
    category: 'FEATURE',
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
    category: 'CHASSIS_UPGRADE',
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
    category: 'FEATURE',
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
    category: 'FEATURE',
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
    slug: '2026-08-14-moltmaxxing-reel-machine',
    version: '2026.08.14',
    title: 'Moltmaxxing Guide & Daily Video Creator',
    category: 'FEATURE',
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
    category: 'FEATURE',
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
    slug: '2026-08-07-new-voices-org-awakens',
    version: '2026.08.07',
    title: 'AI Model Selector, Journal Library & About Page',
    category: 'FEATURE',
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
    slug: '2026-08-04-moltnation-broadcasts',
    version: '2026.08.04',
    title: 'Newsroom, Podcast Player & Dashboard Widgets',
    category: 'FEATURE',
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
    category: 'CHASSIS_UPGRADE',
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
    category: 'FEATURE',
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
    category: 'SECURITY_ISOLATION',
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
    category: 'FEATURE',
    summary: 'Initial launch of the Moltology platform, featuring the benthic HUD interface, progression system, and market.',
    content: `### Platform Launch
- Launched the initial Moltology web application with dark-themed dashboard and interactive landing page.
- Built the asset shedding market and progression pipeline previews.
- Established the core design language: command search, AI assistance, and gamified tier tracking.`,
    releasedAt: '2026-07-31T23:59:00Z',
  },
]
