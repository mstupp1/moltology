import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { INITIAL_FORUM_TOPICS } from '../../../lib/forum-seed-data'

const mockUseLoaderData = vi.fn()
const mockUseParams = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
    useLoaderData: () => mockUseLoaderData(),
    useParams: () => mockUseParams(),
  }),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/forum/general-discussion/some-topic' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

vi.mock('@/lib/server/api', () => ({
  getForumTopicDetailFn: vi.fn().mockResolvedValue(null),
  createForumPostFn: vi.fn(),
  toggleForumTopicVoteFn: vi.fn(),
  toggleForumPostVoteFn: vi.fn(),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('a.b.c'),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
  },
}))

import { authClient } from '@/lib/auth-client'
import { getForumTopicDetailFn } from '@/lib/server/api'
import { Route } from './$categorySlug/$topicSlug'
const ForumThreadPage = Route.options.component!

describe('ForumThreadPage (/_hud/forum/$categorySlug/$topicSlug)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ categorySlug: 'rules-announcements', topicSlug: 'welcome-to-community-core-directives' })
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
  })

  it('renders the post title, body, comments, and sign-in prompt', () => {
    const seed = INITIAL_FORUM_TOPICS[0]
    mockUseLoaderData.mockReturnValue({
      topic: {
        ...seed,
        categorySlug: 'rules-announcements',
        categoryName: 'Rules & Directives',
        categoryColor: '#ff5540',
        userId: null,
      },
      posts: [],
    })

    render(<ForumThreadPage />)

    expect(screen.getByRole('heading', { level: 1, name: seed.title })).toBeInTheDocument()
    expect(screen.getByText(/Greetings Initiates/)).toBeInTheDocument()
    expect(screen.getByText(/0 Comments/)).toBeInTheDocument()
    expect(screen.getByText('Sign in to join the discussion.')).toBeInTheDocument()
  })

  it('shows the reply composer when the session user is authenticated', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'authed-user', name: 'Initiate' } },
    } as any)
    vi.mocked(getForumTopicDetailFn).mockResolvedValue(null)

    const seed = INITIAL_FORUM_TOPICS[0]
    mockUseLoaderData.mockReturnValue({
      topic: {
        ...seed,
        categorySlug: 'rules-announcements',
        categoryName: 'Rules & Directives',
        categoryColor: '#ff5540',
        userId: null,
      },
      posts: [],
    })

    render(<ForumThreadPage />)

    expect(screen.getByText('Post Reply')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^reply$/i })).toBeInTheDocument()
    expect(screen.queryByText('Sign in to join the discussion.')).not.toBeInTheDocument()
  })

  it('hydrates prior upvotes so already-voted topics stay pressed', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'authed-user', name: 'Initiate' } },
    } as any)

    const seed = INITIAL_FORUM_TOPICS[0]
    const baseTopic = {
      ...seed,
      categorySlug: 'rules-announcements',
      categoryName: 'Rules & Directives',
      categoryColor: '#ff5540',
      userId: null,
      upvotes: 88,
    }
    // Loader has no JWT — omit voted so the client can use session cache / hydrate.
    mockUseLoaderData.mockReturnValue({
      topic: baseTopic,
      posts: [],
    })
    vi.mocked(getForumTopicDetailFn).mockResolvedValue({
      topic: { ...baseTopic, voted: true, upvotes: 88 },
      posts: [],
    })

    render(<ForumThreadPage />)

    await vi.waitFor(() => {
      expect(getForumTopicDetailFn).toHaveBeenCalled()
    })

    const call = vi.mocked(getForumTopicDetailFn).mock.calls[0]?.[0] as any
    expect(call?.data?.trackView).toBe(false)
    expect(call?.data?.token).toBe('a.b.c')

    await vi.waitFor(() => {
      const voteBtn = screen.getByTitle('Remove upvote')
      expect(voteBtn).toHaveAttribute('aria-pressed', 'true')
    })
  })

  it('renders a not-found state when the post is missing', () => {
    mockUseLoaderData.mockReturnValue(null)

    render(<ForumThreadPage />)

    expect(screen.getByText('Post Not Found')).toBeInTheDocument()
  })
})
