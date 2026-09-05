import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import {
  ForumHubCard,
  FORUM_HUB_EMPTY_COPY,
  FORUM_HUB_TITLE,
  toForumHubThreads,
} from './ForumHubCard'
import { getForumTopicsFn } from '@/lib/server/api'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, params, ...props }: any) => (
    <a href={`${to}/${params?.categorySlug ?? ''}/${params?.topicSlug ?? ''}`} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/server/api', () => ({
  getForumTopicsFn: vi.fn(),
}))

function topic(overrides: Partial<{
  id: string
  title: string
  slug: string
  categorySlug: string
  categoryName: string
  createdAt: string
}> = {}) {
  return {
    id: overrides.id ?? 'topic-1',
    categoryId: 'cat-1',
    categorySlug: overrides.categorySlug ?? 'general-discussion',
    categoryName: overrides.categoryName ?? 'General Discussion',
    categoryColor: '#00ffff',
    userId: 'user-1',
    authorName: 'claw_lord',
    authorAvatar: '',
    authorStage: 2,
    title: overrides.title ?? 'How to harden a soft week',
    slug: overrides.slug ?? 'how-to-harden-a-soft-week',
    content: 'Start with one shed.',
    isPinned: false,
    isLocked: false,
    views: 4,
    repliesCount: 1,
    upvotes: 2,
    lastReplyAt: overrides.createdAt ?? '2026-09-01T12:00:00.000Z',
    createdAt: overrides.createdAt ?? '2026-09-01T12:00:00.000Z',
  }
}

describe('ForumHubCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the empty forum state without crashing', async () => {
    vi.mocked(getForumTopicsFn).mockResolvedValue([])

    render(<ForumHubCard />)

    await waitFor(() => {
      expect(screen.getByText(FORUM_HUB_EMPTY_COPY.title)).toBeInTheDocument()
    })
    expect(screen.getByText(FORUM_HUB_EMPTY_COPY.body)).toBeInTheDocument()
    expect(screen.getByText(FORUM_HUB_TITLE)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enter forums/i })).toBeInTheDocument()
  })

  it('renders up to three recent threads with board and age', async () => {
    vi.mocked(getForumTopicsFn).mockResolvedValue([
      topic({ id: 't1', title: 'First thread', slug: 'first-thread', categoryName: 'The Melt' }),
      topic({ id: 't2', title: 'Second thread', slug: 'second-thread', categoryName: 'Carcinization' }),
      topic({ id: 't3', title: 'Third thread', slug: 'third-thread' }),
      topic({ id: 't4', title: 'Fourth thread', slug: 'fourth-thread' }),
    ])

    render(<ForumHubCard />)

    await waitFor(() => {
      expect(screen.getByText('First thread')).toBeInTheDocument()
    })
    expect(screen.getByText('The Melt')).toBeInTheDocument()
    expect(screen.getByText('Second thread')).toBeInTheDocument()
    expect(screen.getByText('Third thread')).toBeInTheDocument()
    expect(screen.queryByText('Fourth thread')).not.toBeInTheDocument()
    expect(getForumTopicsFn).toHaveBeenCalledWith({ data: { sortBy: 'latest' } })
  })

  it('shows the empty forum state when the loader fails', async () => {
    vi.mocked(getForumTopicsFn).mockRejectedValue(new Error('forum unavailable'))

    render(<ForumHubCard />)

    await waitFor(() => {
      expect(screen.getByText(FORUM_HUB_EMPTY_COPY.title)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /enter forums/i })).toBeInTheDocument()
  })

  it('navigates to the forums from the CTA', async () => {
    vi.mocked(getForumTopicsFn).mockResolvedValue([])

    render(<ForumHubCard />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enter forums/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /enter forums/i }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/forum' })
  })
})

describe('toForumHubThreads', () => {
  it('maps title, board, and age and caps at three', () => {
    const views = toForumHubThreads(
      [
        topic({ id: 'a', title: 'Alpha', categoryName: 'Board A', createdAt: '2026-09-01T00:00:00.000Z' }),
        topic({ id: 'b', title: 'Beta', categoryName: 'Board B', createdAt: '2026-09-02T00:00:00.000Z' }),
        topic({ id: 'c', title: 'Gamma', categoryName: 'Board C', createdAt: '2026-09-03T00:00:00.000Z' }),
        topic({ id: 'd', title: 'Delta', categoryName: 'Board D', createdAt: '2026-09-04T00:00:00.000Z' }),
      ],
      () => '2d ago',
    )

    expect(views).toHaveLength(3)
    expect(views[0]).toMatchObject({ title: 'Alpha', categoryName: 'Board A', ageLabel: '2d ago' })
    expect(views.map((row) => row.title)).toEqual(['Alpha', 'Beta', 'Gamma'])
  })
})
