import { describe, it, expect, beforeEach } from 'vitest'
import { COMMAND_CATALOG } from './command-catalog'
import {
  SEARCH_RECENTS_LIMIT,
  SEARCH_RECENTS_STORAGE_PREFIX,
  clearSearchRecents,
  getSearchRecents,
  pageFromRecent,
  rememberOpenedPage,
  rememberOpenedPerson,
  rememberOpenedQuery,
  searchRecentsStorageKey,
} from './search-recents'

const MEMBER_A = 'usr_claw_a'
const MEMBER_B = 'usr_claw_b'

const clawLord = {
  id: 'member-claw',
  larvaId: 'LARVA UNIT #9',
  handle: 'claw_lord',
  displayName: 'claw_lord',
  stage: 2,
  stageLabel: 'Soft-Shed',
  avatarConfig: { style: 'classic', seed: 'claw' },
}

describe('search recents', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('keys the trail by member id and never writes without one', () => {
    expect(searchRecentsStorageKey(MEMBER_A).startsWith(SEARCH_RECENTS_STORAGE_PREFIX)).toBe(true)
    expect(rememberOpenedQuery(null, 'claw', 'people')).toEqual([])
    expect(rememberOpenedPerson(undefined, clawLord)).toEqual([])
    expect(localStorage.length).toBe(0)
  })

  it('remembers opened queries, people, and pages, newest first', () => {
    rememberOpenedQuery(MEMBER_A, '  claw  ', 'people')
    rememberOpenedPerson(MEMBER_A, clawLord)
    const page = rememberOpenedPage(MEMBER_A, COMMAND_CATALOG.find((cmd) => cmd.id === 'nav-codex')!)

    expect(page.map((entry) => entry.kind)).toEqual(['page', 'person', 'query'])
    expect(page[0]).toMatchObject({ kind: 'page', commandId: 'nav-codex' })
    expect(page[1]).toMatchObject({ kind: 'person', memberId: 'member-claw', displayName: 'claw_lord' })
    expect(page[2]).toMatchObject({ kind: 'query', query: 'claw', type: 'people' })
    expect(localStorage.getItem(searchRecentsStorageKey(MEMBER_A))).toContain('nav-codex')
  })

  it('dedupes the same destination or query and bumps it to the front', () => {
    rememberOpenedQuery(MEMBER_A, 'claw', 'people')
    rememberOpenedPage(MEMBER_A, COMMAND_CATALOG.find((cmd) => cmd.id === 'nav-oracle')!)
    const next = rememberOpenedQuery(MEMBER_A, 'CLAW', 'people')

    expect(next).toHaveLength(2)
    expect(next[0]).toMatchObject({ kind: 'query', query: 'CLAW' })
    expect(next[1]).toMatchObject({ kind: 'page', commandId: 'nav-oracle' })
  })

  it('caps the trail and isolates members from each other', () => {
    for (let i = 0; i < SEARCH_RECENTS_LIMIT + 3; i += 1) {
      rememberOpenedQuery(MEMBER_A, `call-${i}`, 'pages')
    }
    rememberOpenedQuery(MEMBER_B, 'other-shell', 'people')

    const trailA = getSearchRecents(MEMBER_A)
    expect(trailA).toHaveLength(SEARCH_RECENTS_LIMIT)
    expect(trailA[0]).toMatchObject({ query: `call-${SEARCH_RECENTS_LIMIT + 2}` })
    expect(trailA.some((entry) => entry.kind === 'query' && entry.query === 'call-0')).toBe(false)
    expect(getSearchRecents(MEMBER_B)).toEqual([
      expect.objectContaining({ kind: 'query', query: 'other-shell' }),
    ])
  })

  it('clears only the signed-in member trail and ignores corrupt storage', () => {
    rememberOpenedQuery(MEMBER_A, 'claw', 'people')
    rememberOpenedQuery(MEMBER_B, 'keep-me', 'pages')
    expect(clearSearchRecents(MEMBER_A)).toEqual([])
    expect(getSearchRecents(MEMBER_A)).toEqual([])
    expect(getSearchRecents(MEMBER_B)[0]).toMatchObject({ query: 'keep-me' })

    localStorage.setItem(searchRecentsStorageKey(MEMBER_A), '{not-json')
    expect(getSearchRecents(MEMBER_A)).toEqual([])

    localStorage.setItem(
      searchRecentsStorageKey(MEMBER_A),
      JSON.stringify([{ kind: 'query', query: '', type: 'people', openedAt: Date.now() }]),
    )
    expect(getSearchRecents(MEMBER_A)).toEqual([])
  })

  it('replays a stored page from the live catalog when the chamber still exists', () => {
    rememberOpenedPage(MEMBER_A, COMMAND_CATALOG.find((cmd) => cmd.id === 'nav-connections')!)
    const stored = getSearchRecents(MEMBER_A)[0]
    expect(stored.kind).toBe('page')
    if (stored.kind !== 'page') return
    expect(pageFromRecent(stored).to).toBe('/connections')
  })
})
