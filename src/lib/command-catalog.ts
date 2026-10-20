import { INITIAL_BLOG_POSTS } from './blog-data'
import { CANONICAL_SCRIPTURES } from './codexData'
import {
  isolationProtocolsSlug,
  scriptureSlugFromId,
} from './codex-links'
import { INITIAL_FORUM_CATEGORIES } from './forum-seed-data'
import { isAdminOnlyPath } from './admin-access'
import { isHiddenPagePath } from './hidden-pages'

export const COMMAND_CATEGORIES = ['Page', 'Scripture', 'Forum board', 'News', 'Staff'] as const
export type CommandCategory = (typeof COMMAND_CATEGORIES)[number]

export type CommandIconId =
  | 'dashboard'
  | 'codex'
  | 'lectures'
  | 'market'
  | 'premium'
  | 'pipeline'
  | 'forum'
  | 'stream'
  | 'landing'
  | 'support'
  | 'oracle'
  | 'connections'
  | 'chassis'
  | 'isolation'
  | 'news'
  | 'watch'
  | 'admin'
  | 'settings'
  | 'profile'

export type CommandNavTo =
  | '/'
  | '/dashboard'
  | '/codex'
  | '/codex/$slug'
  | '/lectures'
  | '/market'
  | '/premium'
  | '/pipeline'
  | '/forum'
  | '/forum/$categorySlug'
  | '/stream'
  | '/landing'
  | '/support'
  | '/oracle'
  | '/connections'
  | '/chassis'
  | '/news'
  | '/news/$slug'
  | '/watch'
  | '/admin'
  | '/admin/logic'
  | '/settings'
  | '/profile'

export type CommandCatalogItem = {
  id: string
  label: string
  category: CommandCategory
  icon: CommandIconId
  to?: CommandNavTo
  params?: Record<string, string>
  keywords?: string[]
}

export type CatalogNavigateArgs = {
  to: CommandNavTo
  params?: Record<string, string>
}

export type SearchTab = 'people' | 'pages'

/**
 * Top-level app pages.
 * Overlay Pages and /search?type=pages share this list.
 *
 * Isolation: the /isolation HUD route was removed. Isolation queries still land on a live
 * chamber — the Isolation Protocols liturgy in the Codex — rather than a dead path.
 */
export const COMMAND_CATALOG: CommandCatalogItem[] = [
  {
    id: 'nav-home',
    label: 'Home page',
    category: 'Page',
    icon: 'landing',
    to: '/',
    keywords: ['home', 'landing', 'start'],
  },
  {
    id: 'nav-hub',
    label: 'Dashboard',
    category: 'Page',
    icon: 'dashboard',
    to: '/dashboard',
    keywords: ['dashboard', 'hub', 'command hub', 'home', 'today'],
  },
  {
    id: 'nav-oracle',
    label: 'Oracle',
    category: 'Page',
    icon: 'oracle',
    to: '/oracle',
    keywords: ['oracle', 'synaptic', 'chat', 'ask', 'ai'],
  },
  {
    id: 'nav-codex',
    label: 'Codex',
    category: 'Page',
    icon: 'codex',
    to: '/codex',
    keywords: ['codex', 'sacred codex', 'scriptures', 'doctrine', 'read'],
  },
  {
    id: 'nav-isolation-protocols',
    label: 'Isolation Protocols',
    category: 'Scripture',
    icon: 'isolation',
    to: '/codex/$slug',
    params: { slug: isolationProtocolsSlug() },
    keywords: ['isolation', 'privacy', 'dome', 'privacy shell', 'perimeter'],
  },
  {
    id: 'nav-lectures',
    label: 'Academy',
    category: 'Page',
    icon: 'lectures',
    to: '/lectures',
    keywords: ['academy', 'molt academy', 'courses', 'lectures', 'tracks', 'certificates', 'certifications', 'lessons'],
  },
  {
    id: 'nav-pipeline',
    label: 'Science',
    category: 'Page',
    icon: 'pipeline',
    to: '/pipeline',
    keywords: ['science', 'moltology science', 'pipeline', 'stages', 'clearance', 'how it works'],
  },
  {
    id: 'nav-forum',
    label: 'Forum',
    category: 'Page',
    icon: 'forum',
    to: '/forum',
    keywords: ['forum', 'community', 'boards', 'topics', 'posts'],
  },
  {
    id: 'nav-stream',
    label: 'Activity',
    category: 'Page',
    icon: 'stream',
    to: '/stream',
    keywords: ['activity', 'activity stream', 'stream', 'feed'],
  },
  {
    id: 'nav-connections',
    label: 'Connections',
    category: 'Page',
    icon: 'connections',
    to: '/connections',
    keywords: ['connections', 'people', 'fellows', 'friends', 'links', 'followers'],
  },
  {
    id: 'nav-chassis',
    label: 'Gear',
    category: 'Page',
    icon: 'chassis',
    to: '/chassis',
    keywords: ['gear', 'chassis', 'chassis configurator', 'loadout', 'cosmetics', 'avatar', 'configurator'],
  },
  {
    id: 'nav-market',
    label: 'Market',
    category: 'Page',
    icon: 'market',
    to: '/market',
    keywords: ['market', 'benthic market', 'shop', 'store', 'credits', 'gems'],
  },
  {
    id: 'nav-premium',
    label: 'Premium',
    category: 'Page',
    icon: 'premium',
    to: '/premium',
    // Members do not see this page. HIDDEN_PAGES is the registry.
    keywords: ['premium', 'membership', 'subscription'],
  },
  {
    id: 'nav-news',
    label: 'News',
    category: 'Page',
    icon: 'news',
    to: '/news',
    keywords: ['news', 'dispatch', 'moltnation', 'updates'],
  },
  {
    id: 'nav-profile',
    label: 'Your profile',
    category: 'Page',
    icon: 'profile',
    to: '/profile',
    keywords: ['profile', 'dossier', 'me'],
  },
  {
    id: 'nav-settings',
    label: 'Settings',
    category: 'Page',
    icon: 'settings',
    to: '/settings',
    keywords: ['settings', 'account', 'preferences', 'notifications'],
  },
  {
    id: 'nav-support',
    label: 'Help & support',
    category: 'Page',
    icon: 'support',
    to: '/support',
    keywords: ['support', 'help', 'contact', 'ticket', 'bug'],
  },
  {
    id: 'nav-watch',
    label: 'Covenant Watch',
    category: 'Staff',
    icon: 'watch',
    to: '/watch',
    keywords: ['watch', 'covenant', 'moderation', 'steward'],
  },
  {
    id: 'nav-admin',
    label: 'Admin',
    category: 'Staff',
    icon: 'admin',
    to: '/admin',
    keywords: ['admin', 'steward', 'oversight'],
  },
  {
    id: 'nav-logic-atlas',
    label: 'Logic Atlas',
    category: 'Staff',
    icon: 'admin',
    to: '/admin/logic',
    keywords: ['logic', 'atlas', 'rules', 'decisions', 'business logic'],
  },
]

export const PAGES_NEWS_LIMIT = 20

export function boardPagesFromCategories(
  boards: Array<{ slug: string; name: string; description?: string }>,
): CommandCatalogItem[] {
  return boards.map((board) => ({
    id: `board-${board.slug}`,
    label: board.name,
    category: 'Forum board',
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
      label: post.title,
      category: 'News',
      icon: 'news',
      to: '/news/$slug',
      params: { slug: post.slug },
      keywords: ['news', 'dispatch', post.title],
    }))
}

export function scripturePagesFromCanon(
  scriptures: Array<{ id: string; title: string; category?: string }> = CANONICAL_SCRIPTURES,
): CommandCatalogItem[] {
  return scriptures.map((scripture) => {
    const slug = scriptureSlugFromId(scripture.id)
    return {
      id: `codex-${slug}`,
      label: scripture.title,
      category: 'Scripture',
      icon: 'codex',
      to: '/codex/$slug',
      params: { slug },
      keywords: [scripture.id, scripture.title, scripture.category ?? '', 'scripture', 'liturgy'],
    }
  })
}

/**
 * Pages result source for overlay + /search?type=pages.
 * HUD chambers from COMMAND_CATALOG, plus seed Forum boards, recent News titles,
 * and canonical scriptures already used by the Codex reader (no schema, no migrate.yml).
 */
export function buildPagesCatalog(options?: {
  boards?: Array<{ slug: string; name: string; description?: string }>
  news?: Array<{ slug: string; title: string; publishedAt?: string }>
  scriptures?: Array<{ id: string; title: string; category?: string }>
}): CommandCatalogItem[] {
  return [
    ...COMMAND_CATALOG,
    ...scripturePagesFromCanon(options?.scriptures ?? CANONICAL_SCRIPTURES),
    ...boardPagesFromCategories(options?.boards ?? INITIAL_FORUM_CATEGORIES),
    ...newsPagesFromPosts(options?.news ?? INITIAL_BLOG_POSTS),
  ]
}

export const PAGES_CATALOG: CommandCatalogItem[] = buildPagesCatalog()

function catalogHaystack(cmd: CommandCatalogItem): string {
  return [cmd.label, cmd.category, ...(cmd.keywords ?? [])].join(' ').toLowerCase()
}

/**
 * Shared Pages filter. Empty query lists first-class chambers so overlay and /search
 * stay scannable. Typed queries also search Forum boards, recent News titles, and
 * canonical scriptures.
 */
export function filterCommandCatalog(
  query: string,
  items?: CommandCatalogItem[],
  options?: { includeHidden?: boolean; includeAdminOnly?: boolean },
): CommandCatalogItem[] {
  const q = query.trim().toLowerCase()
  const pool = items ?? (q ? PAGES_CATALOG : COMMAND_CATALOG)
  const visible = pool.filter((cmd) => {
    if (isAdminOnlyPath(cmd.to) && !options?.includeAdminOnly) return false
    if (!options?.includeHidden && isHiddenPagePath(cmd.to)) return false
    return true
  })
  if (!q) return visible
  return visible.filter((cmd) => catalogHaystack(cmd).includes(q))
}

export function catalogNavigateArgs(command: CommandCatalogItem): CatalogNavigateArgs | null {
  if (!command.to) return null
  return command.params ? { to: command.to, params: command.params } : { to: command.to }
}

/** Live catalog row for a stored page recent. Boards and news live on PAGES_CATALOG. */
export function findCatalogCommand(
  id: string,
  items: CommandCatalogItem[] = PAGES_CATALOG,
): CommandCatalogItem | undefined {
  const trimmed = id.trim()
  if (!trimmed) return undefined
  return items.find((cmd) => cmd.id === trimmed)
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
