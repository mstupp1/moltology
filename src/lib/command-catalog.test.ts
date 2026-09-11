import { describe, it, expect } from 'vitest'
import { INITIAL_BLOG_POSTS } from './blog-data'
import { INITIAL_FORUM_CATEGORIES } from './forum-seed-data'
import {
  COMMAND_CATALOG,
  PAGES_CATALOG,
  boardPagesFromCategories,
  buildPagesCatalog,
  catalogNavigateArgs,
  filterCommandCatalog,
  newsPagesFromPosts,
  parseSearchTab,
  searchPageLocation,
} from './command-catalog'

describe('command catalog', () => {
  it('names the social surface Community, not Forum', () => {
    const forumNav = COMMAND_CATALOG.find((cmd) => cmd.id === 'nav-forum')
    expect(forumNav?.to).toBe('/forum')
    expect(forumNav?.label).toBe('Open Community')
    expect(forumNav?.label).not.toMatch(/forum/i)
  })

  it('keeps existing rites and lists live HUD chambers members search for', () => {
    expect(COMMAND_CATALOG.map((cmd) => cmd.id)).toEqual([
      'nav-home',
      'nav-hub',
      'nav-oracle',
      'nav-codex',
      'nav-isolation-protocols',
      'nav-lectures',
      'nav-podcasts',
      'nav-pipeline',
      'nav-journal',
      'nav-market',
      'nav-chassis',
      'nav-subterranean',
      'nav-forum',
      'nav-stream',
      'nav-connections',
      'nav-news',
      'nav-watch',
      'nav-landing',
      'nav-support',
      'nav-settings',
      'nav-profile',
      'ritual-purge',
      'system-scan',
    ])
  })

  it('surfaces live HUD chambers for obvious page queries', () => {
    expect(filterCommandCatalog('oracle').map((cmd) => cmd.id)).toContain('nav-oracle')
    expect(filterCommandCatalog('connections').map((cmd) => cmd.id)).toContain('nav-connections')
    expect(filterCommandCatalog('chassis').map((cmd) => cmd.id)).toContain('nav-chassis')
    expect(filterCommandCatalog('podcasts').map((cmd) => cmd.id)).toContain('nav-podcasts')
    expect(filterCommandCatalog('news').map((cmd) => cmd.id)).toContain('nav-news')
    expect(filterCommandCatalog('stream').map((cmd) => cmd.id)).toContain('nav-stream')
  })

  it('maps isolation to the Isolation Protocols liturgy instead of a removed HUD route', () => {
    const isolation = filterCommandCatalog('isolation').find(
      (cmd) => cmd.id === 'nav-isolation-protocols',
    )
    expect(isolation).toBeDefined()
    expect(catalogNavigateArgs(isolation!)).toEqual({ to: '/codex' })
    expect(isolation!.to).not.toBe('/isolation')
  })

  it('filters pages by label and category the way the palette always has', () => {
    const codex = filterCommandCatalog('Codex')
    expect(codex.map((cmd) => cmd.id)).toEqual(['nav-codex'])
    expect(filterCommandCatalog('rituals').map((cmd) => cmd.id)).toEqual(['ritual-purge'])
    expect(filterCommandCatalog('').length).toBe(COMMAND_CATALOG.length)
  })

  it('uses the same pages catalog for overlay and /search pages', () => {
    expect(PAGES_CATALOG).toEqual(buildPagesCatalog())
    expect(PAGES_CATALOG.map((cmd) => cmd.id)).toEqual([
      ...COMMAND_CATALOG.map((cmd) => cmd.id),
      ...INITIAL_FORUM_CATEGORIES.map((board) => `board-${board.slug}`),
      ...newsPagesFromPosts(INITIAL_BLOG_POSTS).map((cmd) => cmd.id),
    ])
  })

  it('includes forum boards and recent news titles from existing seed loaders', () => {
    const boards = filterCommandCatalog('Rules & Directives')
    expect(boards.map((cmd) => cmd.id)).toContain('board-rules-announcements')
    expect(catalogNavigateArgs(boards[0]!)).toEqual({
      to: '/forum/$categorySlug',
      params: { categorySlug: 'rules-announcements' },
    })

    const moltmax = filterCommandCatalog('moltmaxxing protocol')
    expect(moltmax.some((cmd) => cmd.id === 'news-the-2026-moltmaxxing-protocol-guide')).toBe(true)
    const dispatch = moltmax.find((cmd) => cmd.id.startsWith('news-'))
    expect(catalogNavigateArgs(dispatch!)).toEqual({
      to: '/news/$slug',
      params: { slug: 'the-2026-moltmaxxing-protocol-guide' },
    })
  })

  it('maps injected boards and news the same way both surfaces would', () => {
    const pages = buildPagesCatalog({
      boards: [{ slug: 'trench-watch', name: 'Trench Watch', description: 'Board for watch reports' }],
      news: [{ slug: 'latest-shed', title: 'Latest Shed Report', publishedAt: '2026-09-01T00:00:00.000Z' }],
    })
    expect(pages.map((cmd) => cmd.id)).toContain('board-trench-watch')
    expect(pages.map((cmd) => cmd.id)).toContain('news-latest-shed')
    expect(boardPagesFromCategories([{ slug: 'trench-watch', name: 'Trench Watch' }])[0]?.to).toBe(
      '/forum/$categorySlug',
    )
  })

  it('sends See all to /search with people when they were looking at people', () => {
    expect(parseSearchTab('people')).toBe('people')
    expect(parseSearchTab('pages')).toBe('pages')
    expect(parseSearchTab('users')).toBe('people')
    expect(searchPageLocation('claw_lord', 'people')).toEqual({
      to: '/search',
      search: { q: 'claw_lord', type: 'people' },
    })
    expect(searchPageLocation('Codex', 'pages').search.type).toBe('pages')
  })
})
