import { INITIAL_BLOG_POSTS } from './blog-data'
import { INITIAL_FORUM_CATEGORIES } from './forum-seed-data'

export const COMMAND_CATEGORIES = ['Navigation', 'Rituals', 'System', 'Boards', 'News'] as const
export type CommandCategory = (typeof COMMAND_CATEGORIES)[number]

export type CommandIconId =
  | 'dashboard'
  | 'codex'
  | 'lectures'
  | 'market'
  | 'subterranean'
  | 'pipeline'
  | 'journal'
  | 'forum'
  | 'landing'
  | 'support'
  | 'purge'
  | 'scan'
  | 'oracle'
  | 'connections'
  | 'chassis'
  | 'isolation'
  | 'podcasts'
  | 'news'
  | 'settings'
  | 'profile'

export type CommandNavTo =
  | '/dashboard'
  | '/codex'
  | '/lectures'
  | '/market'
  | '/subterranean'
  | '/pipeline'
  | '/journal'
  | '/forum'
  | '/forum/$categorySlug'
  | '/landing'
  | '/support'
  | '/oracle'
  | '/connections'
  | '/chassis'
  | '/isolation'
  | '/podcasts'
  | '/news'
  | '/news/$slug'
  | '/settings'
  | '/profile'

export type CommandCatalogItem = {
  id: string
  label: string
  category: CommandCategory
  icon: CommandIconId
  shortcut?: string
  to?: CommandNavTo
  params?: Record<string, string>
  keywords?: string[]
  toast?: {
    id: string
    title: string
    message: string
  }
}

export type SearchTab = 'people' | 'pages'

/** First-class HUD chambers plus the existing rites. Overlay and /search Pages share this. */
export const COMMAND_CATALOG: CommandCatalogItem[] = [
  {
    id: 'nav-hub',
    label: 'Open Portal Command Hub (Mainpage)',
    category: 'Navigation',
    icon: 'dashboard',
    shortcut: 'G H',
    to: '/dashboard',
  },
  {
    id: 'nav-oracle',
    label: 'Consult the Synaptic Oracle',
    category: 'Navigation',
    icon: 'oracle',
    to: '/oracle',
    keywords: ['oracle', 'synaptic', 'consultation'],
  },
  {
    id: 'nav-codex',
    label: 'Open Sacred Codex & Canonical Scriptures',
    category: 'Navigation',
    icon: 'codex',
    shortcut: 'G C',
    to: '/codex',
  },
  {
    id: 'nav-lectures',
    label: 'Open Molt Academy & Neural Courses',
    category: 'Navigation',
    icon: 'lectures',
    shortcut: 'G L',
    to: '/lectures',
  },
  {
    id: 'nav-podcasts',
    label: 'Open Benthic Podcasts',
    category: 'Navigation',
    icon: 'podcasts',
    to: '/podcasts',
    keywords: ['podcasts', 'audio', 'broadcast'],
  },
  {
    id: 'nav-market',
    label: 'Open Benthic Market & Transmutation Artifacts',
    category: 'Navigation',
    icon: 'market',
    shortcut: 'G M',
    to: '/market',
  },
  {
    id: 'nav-chassis',
    label: 'Open Chassis Configurator',
    category: 'Navigation',
    icon: 'chassis',
    to: '/chassis',
    keywords: ['chassis', 'loadout', 'gear'],
  },
  {
    id: 'nav-isolation',
    label: 'Engage Isolation Protocols',
    category: 'Navigation',
    icon: 'isolation',
    to: '/isolation',
    keywords: ['isolation', 'dome', 'focus'],
  },
  {
    id: 'nav-subterranean',
    label: 'Open Subterranean Vats & Level -7 Bio-Vault',
    category: 'Navigation',
    icon: 'subterranean',
    shortcut: 'G S',
    to: '/subterranean',
  },
  {
    id: 'nav-pipeline',
    label: 'Inspect Transmutation Pipeline & Stages',
    category: 'Navigation',
    icon: 'pipeline',
    shortcut: 'G P',
    to: '/pipeline',
  },
  {
    id: 'nav-journal',
    label: 'Open The Benthic Compendium Science Journal',
    category: 'Navigation',
    icon: 'journal',
    shortcut: 'G J',
    to: '/journal',
  },
  {
    id: 'nav-forum',
    label: 'Open Community Forums & Discussions',
    category: 'Navigation',
    icon: 'forum',
    shortcut: 'G F',
    to: '/forum',
  },
  {
    id: 'nav-connections',
    label: 'Open Connections & Fellow Shells',
    category: 'Navigation',
    icon: 'connections',
    to: '/connections',
    keywords: ['connections', 'fellows', 'friends'],
  },
  {
    id: 'nav-news',
    label: 'Open MoltNation News',
    category: 'Navigation',
    icon: 'news',
    to: '/news',
    keywords: ['news', 'dispatch', 'moltnation'],
  },
  {
    id: 'nav-landing',
    label: 'View Order Landing Portal',
    category: 'Navigation',
    icon: 'landing',
    shortcut: 'G L',
    to: '/landing',
  },
  {
    id: 'nav-support',
    label: 'Open Benthic Support Portal & System Changelog',
    category: 'Navigation',
    icon: 'support',
    shortcut: 'G S',
    to: '/support',
  },
  {
    id: 'nav-settings',
    label: 'Open Operative Settings',
    category: 'Navigation',
    icon: 'settings',
    to: '/settings',
    keywords: ['settings', 'account'],
  },
  {
    id: 'nav-profile',
    label: 'Open Your Profile Dossier',
    category: 'Navigation',
    icon: 'profile',
    to: '/profile',
    keywords: ['profile', 'dossier'],
  },
  {
    id: 'ritual-purge',
    label: 'Initiate Purge Protocol (Clear Neural Cache)',
    category: 'Rituals',
    icon: 'purge',
    shortcut: 'ALT P',
    toast: {
      id: 'command-palette-purge',
      title: 'Purge Complete',
      message: 'Cache cleared successfully.',
    },
  },
  {
    id: 'system-scan',
    label: 'Execute System Diagnostic Scan',
    category: 'System',
    icon: 'scan',
    shortcut: 'CTRL S',
    toast: {
      id: 'command-palette-diagnostic',
      title: 'Diagnostic Complete',
      message: 'All systems operational.',
    },
  },
]

export const PAGES_NEWS_LIMIT = 20

export function boardPagesFromCategories(
  boards: Array<{ slug: string; name: string; description?: string }>,
): CommandCatalogItem[] {
  return boards.map((board) => ({
    id: `board-${board.slug}`,
    label: `Open Forum Board: ${board.name}`,
    category: 'Boards',
    icon: 'forum',
    to: '/forum/$categorySlug',
    params: { categorySlug: board.slug },
    keywords: ['forum', 'board', board.name, board.description ?? ''],
  }))
}

export function newsPagesFromPosts(
  posts: Array<{ slug: string; title: string; publishedAt?: string }>,
): CommandCatalogItem[] {
  return [...posts]
    .sort((a, b) => Date.parse(b.publishedAt ?? '') - Date.parse(a.publishedAt ?? ''))
    .slice(0, PAGES_NEWS_LIMIT)
    .map((post) => ({
      id: `news-${post.slug}`,
      label: `Read Dispatch: ${post.title}`,
      category: 'News',
      icon: 'news',
      to: '/news/$slug',
      params: { slug: post.slug },
      keywords: ['news', 'dispatch', post.title],
    }))
}

/**
 * Pages result source for overlay + /search?type=pages.
 * HUD chambers from COMMAND_CATALOG, plus seed Forum boards and recent News titles
 * already used by existing loaders (no schema, no migrate.yml).
 */
export function buildPagesCatalog(options?: {
  boards?: Array<{ slug: string; name: string; description?: string }>
  news?: Array<{ slug: string; title: string; publishedAt?: string }>
}): CommandCatalogItem[] {
  return [
    ...COMMAND_CATALOG,
    ...boardPagesFromCategories(options?.boards ?? INITIAL_FORUM_CATEGORIES),
    ...newsPagesFromPosts(options?.news ?? INITIAL_BLOG_POSTS),
  ]
}

export const PAGES_CATALOG: CommandCatalogItem[] = buildPagesCatalog()

function catalogHaystack(cmd: CommandCatalogItem): string {
  const pathWords = (cmd.to ?? '')
    .split('/')
    .filter((part) => part.length > 0 && !part.startsWith('$'))
    .join(' ')
  return [cmd.label, cmd.category, pathWords, ...(cmd.keywords ?? [])]
    .join(' ')
    .toLowerCase()
}

export function filterCommandCatalog(
  query: string,
  items: CommandCatalogItem[] = PAGES_CATALOG,
): CommandCatalogItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter((cmd) => catalogHaystack(cmd).includes(q))
}

export function catalogNavigateArgs(
  command: CommandCatalogItem,
): { to: CommandNavTo; params?: Record<string, string> } | null {
  if (!command.to) return null
  return command.params ? { to: command.to, params: command.params } : { to: command.to }
}

export function parseSearchTab(value: unknown): SearchTab {
  return value === 'pages' ? 'pages' : 'people'
}

export function searchPageLocation(
  query: string,
  type?: SearchTab,
): { to: '/search'; search: { q: string; type: SearchTab } } {
  return {
    to: '/search',
    search: {
      q: query.trim(),
      type: type ?? 'pages',
    },
  }
}
