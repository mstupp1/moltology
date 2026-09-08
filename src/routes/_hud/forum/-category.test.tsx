import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { INITIAL_FORUM_CATEGORIES } from '../../../lib/forum-seed-data'

const mockUseLoaderData = vi.fn()
const mockUseParams = vi.fn()
const mockNavigate = vi.fn()
const mockUseSession = vi.fn((): { data: { user: { id: string } } | null; isPending: boolean } => ({
  data: null,
  isPending: false,
}))

const mockRedirect = vi.fn((args: unknown) => {
  const err = new Error('REDIRECT')
  Object.assign(err, args)
  throw err
})

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
  redirect: (args: unknown) => mockRedirect(args),
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
    useSession: () => mockUseSession(),
  },
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue(null),
}))

import { getForumCategoryBySlugFn, getForumTopicsFn } from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'
import { Route } from './$categorySlug/index'
const ForumBoardPage = Route.options.component!

describe('ForumBoardPage (/_hud/forum/$categorySlug/)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ categorySlug: 'general-discussion' })
    mockUseSession.mockReturnValue({ data: null, isPending: false })
    vi.mocked(getAuthJWTToken).mockResolvedValue(null)
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
    expect(screen.getByText('1 TOPIC')).toBeInTheDocument()
    expect(screen.queryByText('1 TOPICS')).not.toBeInTheDocument()
  })

  it('pluralizes the board topic-count badge for empty and multi-topic boards', () => {
    const cat = INITIAL_FORUM_CATEGORIES.find((c) => c.slug === 'general-discussion')!

    mockUseLoaderData.mockReturnValue({
      category: { ...cat, topicCount: 0 },
      topics: [],
    })
    const { unmount } = render(<ForumBoardPage />)
    expect(screen.getByText('0 TOPICS')).toBeInTheDocument()
    unmount()

    mockUseLoaderData.mockReturnValue({
      category: { ...cat, topicCount: 2 },
      topics: [],
    })
    render(<ForumBoardPage />)
    expect(screen.getByText('2 TOPICS')).toBeInTheDocument()
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

  it('hydrates unread chrome from JWT on the board list', async () => {
    const cat = INITIAL_FORUM_CATEGORIES.find((c) => c.slug === 'general-discussion')!
    mockUseSession.mockReturnValue({
      data: { user: { id: 'member-1' } },
      isPending: false,
    })
    vi.mocked(getAuthJWTToken).mockResolvedValue('eyJ.payload.sig')
    mockUseLoaderData.mockReturnValue({
      category: { ...cat, topicCount: 1 },
      topics: [],
    })
    vi.mocked(getForumCategoryBySlugFn).mockResolvedValue({
      ...cat,
      topicCount: 1,
      unreadCount: 2,
    } as any)
    vi.mocked(getForumTopicsFn).mockResolvedValue([
      {
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
      },
    ] as any)

    render(<ForumBoardPage />)

    await waitFor(() => {
      expect(screen.getAllByTestId('forum-unread-mark').some((node) => node.textContent === '2 new')).toBe(true)
      expect(screen.getByText('New transmission')).toBeInTheDocument()
    })
    expect(getForumTopicsFn).toHaveBeenCalledWith({
      data: {
        categorySlug: 'general-discussion',
        query: '',
        sortBy: 'hot',
        userId: 'member-1',
        token: 'eyJ.payload.sig',
      },
    })
  })

  it('shows a not-found state for an unknown board', () => {
    mockUseLoaderData.mockReturnValue({ category: null, topics: [] })

    render(<ForumBoardPage />)

    expect(screen.getByText('Board Not Found')).toBeInTheDocument()
  })

  it('redirects rules-directives to the seeded rules-announcements board', async () => {
    const rules = INITIAL_FORUM_CATEGORIES.find((c) => c.slug === 'rules-announcements')!
    vi.mocked(getForumCategoryBySlugFn).mockResolvedValue({ ...rules, topicCount: 1 } as any)
    const loader = Route.options.loader as any

    await expect(
      loader({ params: { categorySlug: 'rules-directives' } }),
    ).rejects.toThrow('REDIRECT')

    expect(mockRedirect).toHaveBeenCalledWith({
      to: '/forum/$categorySlug',
      params: { categorySlug: 'rules-announcements' },
      replace: true,
    })
  })
})
