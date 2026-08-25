import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  peekForumVote,
  writeForumVote,
  resolveForumVoted,
  syncForumVotesFromServer,
} from './forum-vote-cache'

describe('forum-vote-cache', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('returns undefined for unknown votes', () => {
    expect(peekForumVote('user-1', 'topic-1')).toBeUndefined()
  })

  it('writes and peeks vote state per user', () => {
    writeForumVote('user-1', 'topic-1', true)
    writeForumVote('user-2', 'topic-1', false)

    expect(peekForumVote('user-1', 'topic-1')).toBe(true)
    expect(peekForumVote('user-2', 'topic-1')).toBe(false)
  })

  it('prefers explicit server voted over cache', () => {
    writeForumVote('user-1', 'topic-1', true)
    expect(resolveForumVoted(false, 'user-1', 'topic-1')).toBe(false)
    expect(resolveForumVoted(true, 'user-1', 'topic-1')).toBe(true)
  })

  it('falls back to cache when server voted is unknown', () => {
    writeForumVote('user-1', 'topic-1', true)
    expect(resolveForumVoted(undefined, 'user-1', 'topic-1')).toBe(true)
    expect(resolveForumVoted(undefined, 'user-1', 'topic-2')).toBe(false)
  })

  it('syncs a batch of server vote flags into the cache', () => {
    syncForumVotesFromServer('user-1', [
      { id: 't1', voted: true },
      { id: 't2', voted: false },
      { id: 't3' },
    ])

    expect(peekForumVote('user-1', 't1')).toBe(true)
    expect(peekForumVote('user-1', 't2')).toBe(false)
    expect(peekForumVote('user-1', 't3')).toBeUndefined()
  })
})
