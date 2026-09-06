import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { INITIAL_FORUM_CATEGORIES } from '../../../lib/forum-seed-data'

const mockUseLoaderData = vi.fn()
const mockUseParams = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
    useLoaderData: () => mockUseLoaderData(),
    useParams: () => mockUseParams(),
  }),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/forum/general-discussion' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

vi.mock('@/lib/server/api', () => ({
  getForumCategoryBySlugFn: vi.fn().mockResolvedValue(null),
  getForumTopicsFn: vi.fn().mockResolvedValue([]),
  createForumTopicFn: vi.fn(),
  toggleForumTopicVoteFn: vi.fn(),
  toggleForumPostVoteFn: vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null, isPending: false }),
  },
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue(null),
}))

import { getForumTopicsFn } from '@/lib/server/api'
import { Route } from './$categorySlug/index'
const ForumBoardPage = Route.options.component!

describe('ForumBoardPage (/_hud/forum/$categorySlug/)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ categorySlug: 'general-discussion' })
  })

  it('renders a board header with its name and description', () => {
    const cat = INITIAL_FORUM_CATEGORIES.find((c) => c.slug === 'general-discussion')!
    mockUseLoaderData.mockReturnValue({
      category: { ...cat, topicCount: 1 },
      topics: [],
    })

    render(<ForumBoardPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'General Discussion' })).toBeInTheDocument()
    expect(screen.getByText(cat.description)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new post/i })).toBeInTheDocument()
    expect(screen.queryByTestId('forum-unread-mark')).not.toBeInTheDocument()
  })

  it('shows unread chrome on the board header and topic list for members', async () => {
    const cat = INITIAL_FORUM_CATEGORIES.find((c) => c.slug === 'general-discussion')!
    const unreadTopic = {
      id: 'topic-unread',
      categoryId: cat.id,
      categorySlug: cat.slug,
      title: 'Fresh shell notes',
      slug: 'fresh-shell-notes',
      content: 'A later reply landed here.',
      authorName: 'Initiate',
      authorAvatar: '/images/stage1_larva.png',
      authorStage: 1,
      userId: null,
      isPinned: false,
      isLocked: false,
      views: 4,
      repliesCount: 1,
      upvotes: 0,
      lastReplyAt: '2026-09-06T12:00:00.000Z',
      createdAt: '2026-09-01T12:00:00.000Z',
      unread: true,
    }
    vi.mocked(getForumTopicsFn).mockResolvedValue([unreadTopic] as any)
    mockUseLoaderData.mockReturnValue({
      category: { ...cat, topicCount: 1, unreadCount: 2 },
      topics: [unreadTopic],
    })

    render(<ForumBoardPage />)

    expect(screen.getAllByTestId('forum-unread-mark').some((node) => node.textContent === '2 new')).toBe(true)
    await waitFor(() => {
      expect(screen.getByText('New transmission')).toBeInTheDocument()
    })
  })

  it('shows a not-found state for an unknown board', () => {
    mockUseLoaderData.mockReturnValue({ category: null, topics: [] })

    render(<ForumBoardPage />)

    expect(screen.getByText('Board Not Found')).toBeInTheDocument()
  })
})
