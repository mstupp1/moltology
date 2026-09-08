import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import {
  ForumHubCard,
  FORUM_HUB_EMPTY_COPY,
  FORUM_HUB_TITLE,
  forumHubTopicPreview,
  toForumHubBoards,
  toForumHubPulse,
  toForumHubThreads,
} from './ForumHubCard'
import { FORUM_WITHDRAWN_PREVIEW } from '@/lib/forum-utils'
import { FORUM_UNREAD_LABEL } from '@/lib/forum-visits'
import { authClient } from '@/lib/auth-client'
import { getForumCategoriesFn, getForumTopicsFn } from '@/lib/server/api'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, params, ...props }: any) => {
    let href = String(to ?? '')
    if (href.includes('$topicSlug')) {
      href = `/forum/${params?.categorySlug ?? ''}/${params?.topicSlug ?? ''}`
    } else if (href.includes('$categorySlug')) {
      href = `/forum/${params?.categorySlug ?? ''}`
    } else if (href.includes('$profileId')) {
      href = `/member/${params?.profileId ?? ''}`
    }
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  },
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('a.b.c'),
}))

vi.mock('@/lib/server/api', () => ({
  getForumTopicsFn: vi.fn(),
  getForumCategoriesFn: vi.fn(),
}))

function topic(overrides: Partial<{
  id: string
  title: string
  slug: string
  content: string
  categorySlug: string
  categoryName: string
  categoryColor: string
  createdAt: string
  lastReplyAt: string
  repliesCount: number
  isPinned: boolean
  unread: boolean
  authorName: string
  authorHandle: string | null
  deletedAt: string | null
}> = {}) {
  return {
    id: overrides.id ?? 'topic-1',
    categoryId: 'cat-1',
    categorySlug: overrides.categorySlug ?? 'general-discussion',
    categoryName: overrides.categoryName ?? 'General Discussion',
    categoryColor: overrides.categoryColor ?? '#00b4d8',
    userId: 'user-1',
    authorName: overrides.authorName ?? 'claw_lord',
    authorHandle: overrides.authorHandle ?? 'claw_lord',
    authorAvatar: '',
    authorStage: 2,
    title: overrides.title ?? 'How to harden a soft week',
    slug: overrides.slug ?? 'how-to-harden-a-soft-week',
    content: overrides.content ?? 'Start with one shed.',
    isPinned: overrides.isPinned ?? false,
    isLocked: false,
    views: 4,
    repliesCount: overrides.repliesCount ?? 1,
    upvotes: 2,
    lastReplyAt: overrides.lastReplyAt ?? overrides.createdAt ?? '2026-09-01T12:00:00.000Z',
    createdAt: overrides.createdAt ?? '2026-09-01T12:00:00.000Z',
    unread: overrides.unread,
    deletedAt: overrides.deletedAt,
  }
}

function category(overrides: Partial<{
  id: string
  slug: string
  name: string
  color: string
  sortOrder: number
  topicCount: number
  unreadCount: number
}> = {}) {
  return {
    id: overrides.id ?? 'cat-1',
    slug: overrides.slug ?? 'general-discussion',
    name: overrides.name ?? 'General Discussion',
    description: 'Open board',
    icon: 'MessageSquare',
    color: overrides.color ?? '#00b4d8',
    sortOrder: overrides.sortOrder ?? 1,
    topicCount: overrides.topicCount ?? 4,
    unreadCount: overrides.unreadCount,
  }
}

describe('ForumHubCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any)
    vi.mocked(getForumCategoriesFn).mockResolvedValue([])
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

  it('renders pulse chips, board shortcuts, and up to three active threads', async () => {
    vi.mocked(getForumCategoriesFn).mockResolvedValue([
      category({ id: 'c1', slug: 'the-melt', name: 'The Melt', topicCount: 8, sortOrder: 1 }),
      category({ id: 'c2', slug: 'carcinization', name: 'Carcinization', topicCount: 3, sortOrder: 2 }),
    ])
    vi.mocked(getForumTopicsFn).mockResolvedValue([
      topic({
        id: 't1',
        title: 'First thread',
        slug: 'first-thread',
        categoryName: 'The Melt',
        content: 'A quiet shed before the feed opens.',
        repliesCount: 5,
        authorName: 'abyssal_architect',
      }),
      topic({ id: 't2', title: 'Second thread', slug: 'second-thread', categoryName: 'Carcinization' }),
      topic({ id: 't3', title: 'Third thread', slug: 'third-thread' }),
      topic({ id: 't4', title: 'Fourth thread', slug: 'fourth-thread' }),
    ])

    render(<ForumHubCard />)

    await waitFor(() => {
      expect(screen.getByText('First thread')).toBeInTheDocument()
    })
    expect(screen.getAllByText('The Melt').length).toBeGreaterThan(0)
    expect(screen.getByText('Second thread')).toBeInTheDocument()
    expect(screen.getByText('Third thread')).toBeInTheDocument()
    expect(screen.queryByText('Fourth thread')).not.toBeInTheDocument()
    expect(screen.getByText('A quiet shed before the feed opens.')).toBeInTheDocument()
    expect(screen.getByText('abyssal_architect')).toBeInTheDocument()
    expect(screen.getByText('Boards')).toBeInTheDocument()
    expect(screen.getByText('Topics')).toBeInTheDocument()
    expect(screen.getByTestId('forum-hub-boards')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /carcinization/i })).toHaveAttribute(
      'href',
      '/forum/carcinization',
    )
    expect(getForumTopicsFn).toHaveBeenCalledWith({ data: { sortBy: 'active' } })
    expect(getForumCategoriesFn).toHaveBeenCalled()
  })

  it('shows unread chrome and hydrates signed-in reads with a token', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-hub' } },
      isPending: false,
    } as any)
    vi.mocked(getForumCategoriesFn).mockResolvedValue([
      category({ unreadCount: 2, topicCount: 6 }),
    ])
    vi.mocked(getForumTopicsFn).mockResolvedValue([
      topic({ title: 'Unread dispatch', unread: true, isPinned: true }),
    ])

    render(<ForumHubCard />)

    await waitFor(() => {
      expect(screen.getByText('Unread dispatch')).toBeInTheDocument()
    })
    expect(screen.getByText(FORUM_UNREAD_LABEL)).toBeInTheDocument()
    expect(screen.getByText('PINNED')).toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
    expect(getForumTopicsFn).toHaveBeenCalledWith({
      data: { sortBy: 'active', userId: 'user-hub', token: 'a.b.c' },
    })
    expect(getForumCategoriesFn).toHaveBeenCalledWith({
      data: { userId: 'user-hub', token: 'a.b.c' },
    })
  })

  it('shows the empty forum state when the loader fails', async () => {
    vi.mocked(getForumTopicsFn).mockRejectedValue(new Error('forum unavailable'))
    vi.mocked(getForumCategoriesFn).mockRejectedValue(new Error('forum unavailable'))

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
  it('maps title, board, preview, replies, and age and caps at three', () => {
    const views = toForumHubThreads(
      [
        topic({ id: 'a', title: 'Alpha', categoryName: 'Board A', createdAt: '2026-09-01T00:00:00.000Z', repliesCount: 4 }),
        topic({ id: 'b', title: 'Beta', categoryName: 'Board B', createdAt: '2026-09-02T00:00:00.000Z' }),
        topic({ id: 'c', title: 'Gamma', categoryName: 'Board C', createdAt: '2026-09-03T00:00:00.000Z' }),
        topic({ id: 'd', title: 'Delta', categoryName: 'Board D', createdAt: '2026-09-04T00:00:00.000Z' }),
      ],
      () => '2d ago',
    )

    expect(views).toHaveLength(3)
    expect(views[0]).toMatchObject({
      title: 'Alpha',
      categoryName: 'Board A',
      ageLabel: '2d ago',
      preview: 'Start with one shed.',
      repliesCount: 4,
      authorName: 'claw_lord',
    })
    expect(views.map((row) => row.title)).toEqual(['Alpha', 'Beta', 'Gamma'])
  })

  it('uses withdrawn preview copy when a topic is sealed', () => {
    const [view] = toForumHubThreads(
      [topic({ content: 'secret', deletedAt: '2026-09-02T00:00:00.000Z' })],
      () => '1h ago',
    )
    expect(view.preview).toBe(FORUM_WITHDRAWN_PREVIEW)
  })
})

describe('forum hub boards and pulse', () => {
  it('sorts boards and totals topics and unread', () => {
    const boards = toForumHubBoards([
      category({ id: 'late', name: 'Later', sortOrder: 2, topicCount: 3, unreadCount: 1 }),
      category({ id: 'early', name: 'Earlier', sortOrder: 1, topicCount: 5, unreadCount: 2 }),
    ])
    expect(boards.map((board) => board.name)).toEqual(['Earlier', 'Later'])
    expect(toForumHubPulse(boards)).toEqual({
      boardCount: 2,
      topicCount: 8,
      unreadCount: 3,
    })
  })

  it('collapses preview whitespace', () => {
    expect(forumHubTopicPreview({ content: '  two   spaces  ', deletedAt: null })).toBe('two spaces')
  })
})
