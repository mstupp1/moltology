import { describe, it, expect } from 'vitest'
import {
  COMMAND_CATALOG,
  filterCommandCatalog,
  parseSearchTab,
  searchPageLocation,
} from './command-catalog'

describe('command catalog', () => {
  it('keeps the existing navigation, ritual, and system commands', () => {
    expect(COMMAND_CATALOG.map((cmd) => cmd.id)).toEqual([
      'nav-hub',
      'nav-codex',
      'nav-lectures',
      'nav-market',
      'nav-subterranean',
      'nav-pipeline',
      'nav-journal',
      'nav-forum',
      'nav-landing',
      'nav-support',
      'ritual-purge',
      'system-scan',
    ])
  })

  it('filters pages by label and category the way the palette always has', () => {
    const codex = filterCommandCatalog('Codex')
    expect(codex.map((cmd) => cmd.id)).toEqual(['nav-codex'])
    expect(filterCommandCatalog('rituals').map((cmd) => cmd.id)).toEqual(['ritual-purge'])
    expect(filterCommandCatalog('').length).toBe(COMMAND_CATALOG.length)
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
