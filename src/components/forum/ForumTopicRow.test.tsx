import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { INITIAL_FORUM_TOPICS } from '../../lib/forum-seed-data'
import { FORUM_UNREAD_LABEL } from '../../lib/forum-visits'
import type { ForumTopicEntry } from '../../lib/server/api'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/server/api', () => ({
  toggleForumTopicVoteFn: vi.fn(),
  toggleForumPostVoteFn: vi.fn(),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue(null),
}))

vi.mock('./ForumShell', () => ({
  useForumAuth: () => ({ userId: null, isPending: false }),
}))

import { ForumTopicRow } from './ForumTopicRow'

function topicEntry(overrides: Partial<ForumTopicEntry> = {}): ForumTopicEntry {
  const seed = INITIAL_FORUM_TOPICS[0]
  return {
    ...seed,
    userId: seed.userId ?? null,
    categorySlug: 'rules-announcements',
    categoryName: 'Rules & Directives',
    categoryColor: '#ff5540',
    ...overrides,
  }
}

describe('ForumTopicRow unread chrome', () => {
  it('shows a new transmission mark only when unread is true', () => {
    const { rerender } = render(<ForumTopicRow topic={topicEntry({ unread: true })} />)
    expect(screen.getByTestId('forum-unread-mark')).toHaveTextContent(FORUM_UNREAD_LABEL)

    rerender(<ForumTopicRow topic={topicEntry()} />)
    expect(screen.queryByTestId('forum-unread-mark')).not.toBeInTheDocument()
  })

  it('stays quiet for guests when unread is omitted', () => {
    render(<ForumTopicRow topic={topicEntry({ unread: undefined })} />)
    expect(screen.queryByTestId('forum-unread-mark')).not.toBeInTheDocument()
  })
})
