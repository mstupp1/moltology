import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

    expect(screen.getByRole('heading', { level: 1, name: /Moltology Community/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /posts/i })).toBeInTheDocument()
    const boardList = screen.getByTestId('forum-board-list')
    expect(boardList).toHaveTextContent('Rules & Directives')
    expect(boardList).toHaveTextContent('General Discussion')
    expect(screen.getByRole('button', { name: /new post/i })).toBeInTheDocument()
    expect(screen.queryByTestId('inline-composer-guest')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Rules' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('forum-unread-mark')).not.toBeInTheDocument()
    expect(boardList.textContent?.match(/1 post(?!s)/g)).toHaveLength(3)
    expect(boardList.textContent?.match(/0 posts/g)).toHaveLength(3)
    expect(screen.getByTestId('forum-empty')).toHaveTextContent('No posts yet')
  })

  it('shows new-post counts on boards when the member has unread', () => {
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
    expect(marks.some((node) => node.textContent === 'New')).toBe(true)
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
      expect(marks.some((node) => node.textContent === 'New')).toBe(true)
    })
    expect(getForumTopicsFn).toHaveBeenCalledWith({
      data: { sortBy: 'hot', userId: 'member-1', token: 'eyJ.payload.sig' },
    })
    expect(getForumCategoriesFn).toHaveBeenCalledWith({
      data: { userId: 'member-1', token: 'eyJ.payload.sig' },
    })
  })
})

describe('ForumIndexPage sorting and filters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSession.mockReturnValue({ data: null, isPending: false })
  })

  it('asks the server for the newest posts when New is picked', async () => {
    const categories = INITIAL_FORUM_CATEGORIES.map((c) => ({ ...c, topicCount: 1 }))
    mockUseLoaderData.mockReturnValue({ categories, topics: [INITIAL_FORUM_TOPICS[0]] })
    vi.mocked(getForumTopicsFn).mockResolvedValue([INITIAL_FORUM_TOPICS[1]] as any)

    render(<ForumIndexPage />)
    expect(getForumTopicsFn).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'New' }))
    expect(screen.getByRole('button', { name: 'New' })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => {
      expect(getForumTopicsFn).toHaveBeenCalledWith({ data: { sortBy: 'latest' } })
    })
    await waitFor(() => expect(screen.getByText(INITIAL_FORUM_TOPICS[1].title)).toBeInTheDocument())
  })

  it('offers to clear filters when a board has no matching posts', () => {
    const categories = INITIAL_FORUM_CATEGORIES.map((c) => ({ ...c, topicCount: 1 }))
    const topic = INITIAL_FORUM_TOPICS[0]
    mockUseLoaderData.mockReturnValue({ categories, topics: [topic] })

    render(<ForumIndexPage />)
    const other = categories.find((c) => c.id !== topic.categoryId)!
    fireEvent.change(screen.getByLabelText('Filter by board'), { target: { value: other.slug } })

    expect(screen.getByTestId('forum-empty')).toHaveTextContent('No posts match')
    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(screen.getByText(topic.title)).toBeInTheDocument()
  })
})
