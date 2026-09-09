import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { INITIAL_FORUM_CATEGORIES, INITIAL_FORUM_TOPICS } from '../../../lib/forum-seed-data'

const mockUseLoaderData = vi.fn()
const mockNavigate = vi.fn()
const mockUseSession = vi.fn((): { data: { user: { id: string } } | null; isPending: boolean } => ({
  data: null,
  isPending: false,
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
    useLoaderData: () => mockUseLoaderData(),
  }),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/forum' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

vi.mock('@/lib/server/api', () => ({
  getForumCategoriesFn: vi.fn().mockResolvedValue([]),
  getForumTopicsFn: vi.fn().mockResolvedValue([]),
  createForumTopicFn: vi.fn(),
  toggleForumTopicVoteFn: vi.fn(),
  toggleForumPostVoteFn: vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => mockUseSession(),
  },
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue(null),
}))

import { getForumCategoriesFn, getForumTopicsFn } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { Route } from './index'
const ForumIndexPage = Route.options.component!

describe('ForumIndexPage (/_hud/forum/)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSession.mockReturnValue({ data: null, isPending: false })
    vi.mocked(getAuthJWTToken).mockResolvedValue(null)
  })

  it('renders the board directory and latest posts section', () => {
    const categories = INITIAL_FORUM_CATEGORIES.map((c) => ({
      ...c,
      topicCount: INITIAL_FORUM_TOPICS.filter((t) => t.categoryId === c.id).length,
    }))
    mockUseLoaderData.mockReturnValue({ categories, topics: [] })

    render(<ForumIndexPage />)

    expect(screen.getByRole('heading', { level: 1, name: /community/i })).toBeInTheDocument()
    expect(screen.getByText('Discussion Boards')).toBeInTheDocument()
    expect(screen.getByText('Rules & Directives')).toBeInTheDocument()
    expect(screen.getByText('General Discussion')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new post/i })).toBeInTheDocument()
    expect(screen.queryByTestId('forum-unread-mark')).not.toBeInTheDocument()
    expect(screen.getAllByText('1 TOPIC')).toHaveLength(3)
    expect(screen.getAllByText('0 TOPICS')).toHaveLength(3)
    expect(screen.queryByText('1 TOPICS')).not.toBeInTheDocument()
  })

  it('shows new-transmission counts on boards when the member has unread', () => {
    const categories = INITIAL_FORUM_CATEGORIES.map((c, index) => ({
      ...c,
      topicCount: INITIAL_FORUM_TOPICS.filter((t) => t.categoryId === c.id).length,
      unreadCount: index === 0 ? 3 : 0,
    }))
    mockUseLoaderData.mockReturnValue({
      categories,
      topics: [{ ...INITIAL_FORUM_TOPICS[0], unread: true }],
    })

    render(<ForumIndexPage />)

    const marks = screen.getAllByTestId('forum-unread-mark')
    expect(marks.some((node) => node.textContent === '3 new')).toBe(true)
    expect(marks.some((node) => node.textContent === 'New transmission')).toBe(true)
  })

  it('hydrates unread chrome after a signed-in member JWT is available', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'member-1' } },
      isPending: false,
    })
    vi.mocked(getAuthJWTToken).mockResolvedValue('eyJ.payload.sig')

    const categories = INITIAL_FORUM_CATEGORIES.map((c) => ({
      ...c,
      topicCount: INITIAL_FORUM_TOPICS.filter((t) => t.categoryId === c.id).length,
    }))
    mockUseLoaderData.mockReturnValue({ categories, topics: [INITIAL_FORUM_TOPICS[0]] })

    vi.mocked(getForumCategoriesFn).mockResolvedValue(
      categories.map((c, index) => ({ ...c, unreadCount: index === 0 ? 2 : 0 })) as any,
    )
    vi.mocked(getForumTopicsFn).mockResolvedValue([
      { ...INITIAL_FORUM_TOPICS[0], unread: true },
    ] as any)

    render(<ForumIndexPage />)

    await waitFor(() => {
      const marks = screen.getAllByTestId('forum-unread-mark')
      expect(marks.some((node) => node.textContent === '2 new')).toBe(true)
      expect(marks.some((node) => node.textContent === 'New transmission')).toBe(true)
    })
    expect(getForumTopicsFn).toHaveBeenCalledWith({
      data: { sortBy: 'hot', userId: 'member-1', token: 'eyJ.payload.sig' },
    })
    expect(getForumCategoriesFn).toHaveBeenCalledWith({
      data: { userId: 'member-1', token: 'eyJ.payload.sig' },
    })
  })
})
