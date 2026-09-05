export const COMMAND_CATEGORIES = ['Navigation', 'Rituals', 'System'] as const
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

export type CommandNavTo =
  | '/'
  | '/dashboard'
  | '/codex'
  | '/lectures'
  | '/market'
  | '/subterranean'
  | '/pipeline'
  | '/journal'
  | '/forum'
  | '/landing'
  | '/support'

export type CommandCatalogItem = {
  id: string
  label: string
  category: CommandCategory
  icon: CommandIconId
  shortcut?: string
  to?: CommandNavTo
  toast?: {
    id: string
    title: string
    message: string
  }
}

export type SearchTab = 'people' | 'pages'

/** Today's command list. Palette Pages and /search Pages share this. */
export const COMMAND_CATALOG: CommandCatalogItem[] = [
  {
    id: 'nav-home',
    label: 'Open Moltology Home (Landing)',
    category: 'Navigation',
    icon: 'landing',
    to: '/',
  },
  {
    id: 'nav-hub',
    label: 'Open Portal Command Hub (Mainpage)',
    category: 'Navigation',
    icon: 'dashboard',
    shortcut: 'G H',
    to: '/dashboard',
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
    id: 'nav-market',
    label: 'Open Benthic Market & Transmutation Artifacts',
    category: 'Navigation',
    icon: 'market',
    shortcut: 'G M',
    to: '/market',
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

export function filterCommandCatalog(
  query: string,
  items: CommandCatalogItem[] = COMMAND_CATALOG,
): CommandCatalogItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q),
  )
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
