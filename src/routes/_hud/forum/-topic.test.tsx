import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
  Link: ({ children, to, params, ...props }: any) => (
    <a href={params?.profileId ? `/member/${params.profileId}` : to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/server/api', () => ({
  getForumTopicDetailFn: vi.fn().mockResolvedValue(null),
  createForumPostFn: vi.fn(),
  toggleForumTopicVoteFn: vi.fn(),
  toggleForumPostVoteFn: vi.fn(),
  searchMembersFn: vi.fn().mockResolvedValue([]),
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

  it('holds the sign-in prompt while the session is unresolved', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
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

    expect(screen.getByTestId('forum-reply-auth-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('Sign in to join the discussion.')).not.toBeInTheDocument()
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

  it('shows member B on the reply and member A on the original post', () => {
    mockUseLoaderData.mockReturnValue({
      topic: {
        id: 'topic-a',
        categoryId: 'cat-1',
        categorySlug: 'moltmaxxing-biometrics',
        categoryName: 'Moltmaxxing & Biometrics',
        categoryColor: '#00ffff',
        userId: 'member-a',
        authorName: 'LARVA UNIT #1111',
        authorAvatar: '/images/stage1_larva.png',
        authorStage: 1,
        title: 'BEST PRACTICES FOR SHELL HARDNESS & PINCER TORQUE GAINS',
        slug: 'shell-hardness-pincer-torque-gains-tips',
        content: 'Thread body from member A.',
        isPinned: false,
        isLocked: false,
        views: 10,
        repliesCount: 1,
        upvotes: 0,
        lastReplyAt: '2026-08-28T19:37:07.000Z',
        createdAt: '2026-08-03T08:30:00.000Z',
      },
      posts: [
        {
          id: 'post-b',
          topicId: 'topic-a',
          parentId: null,
          userId: 'member-b',
          authorName: 'LARVA UNIT #2468',
          authorAvatar: '/images/stage1_larva.png',
          authorStage: 2,
          content: 'Reply body from member B, long enough to count.',
          upvotes: 0,
          createdAt: '2026-08-28T19:37:07.000Z',
        },
      ],
    })

    render(<ForumThreadPage />)

    expect(screen.getByText('LARVA UNIT #1111')).toBeInTheDocument()
    expect(screen.getByText('LARVA UNIT #2468')).toBeInTheDocument()
    expect(screen.getByText('Reply body from member B, long enough to count.')).toBeInTheDocument()
    const replyCard = screen.getByText('Reply body from member B, long enough to count.').closest('div')
    expect(replyCard).toHaveTextContent('LARVA UNIT #2468')
    expect(replyCard).not.toHaveTextContent('LARVA UNIT #1111')
  })

  it('shows claimed designations on the original post and reply', () => {
    mockUseLoaderData.mockReturnValue({
      topic: {
        id: 'topic-a',
        categoryId: 'cat-1',
        categorySlug: 'moltmaxxing-biometrics',
        categoryName: 'Moltmaxxing & Biometrics',
        categoryColor: '#00ffff',
        userId: 'member-a',
        authorName: 'claw_lord',
        authorHandle: 'claw_lord',
        authorAvatar: '/images/stage1_larva.png',
        authorStage: 1,
        title: 'BEST PRACTICES FOR SHELL HARDNESS & PINCER TORQUE GAINS',
        slug: 'shell-hardness-pincer-torque-gains-tips',
        content: 'Thread body from member A.',
        isPinned: false,
        isLocked: false,
        views: 10,
        repliesCount: 1,
        upvotes: 0,
        lastReplyAt: '2026-08-28T19:37:07.000Z',
        createdAt: '2026-08-03T08:30:00.000Z',
      },
      posts: [
        {
          id: 'post-b',
          topicId: 'topic-a',
          parentId: null,
          userId: 'member-b',
          authorName: 'pincer_prime',
          authorHandle: 'pincer_prime',
          authorAvatar: '/images/stage1_larva.png',
          authorStage: 2,
          content: 'Reply body from member B, long enough to count.',
          upvotes: 0,
          createdAt: '2026-08-28T19:37:07.000Z',
        },
      ],
    })

    render(<ForumThreadPage />)

    expect(screen.getByText('claw_lord')).toBeInTheDocument()
    expect(screen.getByText('pincer_prime')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'claw_lord' })).toHaveAttribute('href', '/member/claw_lord')
    expect(screen.getByRole('link', { name: 'pincer_prime' })).toHaveAttribute('href', '/member/pincer_prime')
    expect(screen.queryByText('LARVA UNIT #8971')).not.toBeInTheDocument()
  })

  it('nests child replies under their parent and opens an inline composer', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'authed-user', name: 'Initiate' } },
    } as any)

    mockUseLoaderData.mockReturnValue({
      topic: {
        id: 'topic-a',
        categoryId: 'cat-1',
        categorySlug: 'rules-announcements',
        categoryName: 'Rules & Directives',
        categoryColor: '#ff5540',
        userId: null,
        authorName: 'High Ascendant',
        authorAvatar: '/images/stage1_larva.png',
        authorStage: 4,
        title: 'Threaded discussion',
        slug: 'threaded-discussion',
        content: 'Original post body long enough.',
        isPinned: false,
        isLocked: false,
        views: 10,
        repliesCount: 2,
        upvotes: 1,
        lastReplyAt: '2026-08-03T20:30:00.000Z',
        createdAt: '2026-08-01T12:00:00.000Z',
      },
      posts: [
        {
          id: 'post-root',
          topicId: 'topic-a',
          parentId: null,
          userId: 'member-a',
          authorName: 'Architect Vaelen',
          authorAvatar: '/images/stage1_larva.png',
          authorStage: 3,
          content: 'Root reply body long enough to count.',
          upvotes: 3,
          createdAt: '2026-08-01T14:00:00.000Z',
        },
        {
          id: 'post-child',
          topicId: 'topic-a',
          parentId: 'post-root',
          userId: 'member-b',
          authorName: 'Larva Unit',
          authorAvatar: '/images/stage1_larva.png',
          authorStage: 1,
          content: 'Nested child reply body long enough.',
          upvotes: 1,
          createdAt: '2026-08-02T09:00:00.000Z',
        },
      ],
    })

    render(<ForumThreadPage />)

    const cards = screen.getAllByTestId('forum-post-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveAttribute('data-depth', '0')
    expect(cards[1]).toHaveAttribute('data-depth', '1')
    expect(screen.getByTestId('forum-reply-sort')).toBeInTheDocument()

    fireEvent.click(screen.getAllByTestId('forum-reply-to-comment')[0])
    expect(screen.getByTestId('forum-inline-reply-composer')).toBeInTheDocument()
    expect(screen.getByText('Reply to comment')).toBeInTheDocument()
  })

  it('quotes the topic into the top reply composer', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'authed-user', name: 'Initiate' } },
    } as any)

    mockUseLoaderData.mockReturnValue({
      topic: {
        id: 'topic-a',
        categoryId: 'cat-1',
        categorySlug: 'rules-announcements',
        categoryName: 'Rules & Directives',
        categoryColor: '#ff5540',
        userId: 'member-a',
        authorName: 'claw_lord',
        authorHandle: 'claw_lord',
        authorAvatar: '/images/stage1_larva.png',
        authorStage: 3,
        title: 'Quote the original transmission',
        slug: 'quote-the-original',
        content: 'Original post body long enough.',
        isPinned: false,
        isLocked: false,
        views: 10,
        repliesCount: 0,
        upvotes: 1,
        lastReplyAt: '2026-08-01T12:00:00.000Z',
        createdAt: '2026-08-01T12:00:00.000Z',
      },
      posts: [],
    })

    render(<ForumThreadPage />)

    fireEvent.click(screen.getByTestId('forum-quote-topic'))
    const composer = screen.getByTestId('forum-top-reply-composer')
    expect(composer.querySelector('textarea')).toHaveValue(
      '> @claw_lord held:\n> Original post body long enough.\n\n',
    )
  })

  it('quotes a reply into the inline composer with handle attribution', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'authed-user', name: 'Initiate' } },
    } as any)

    mockUseLoaderData.mockReturnValue({
      topic: {
        id: 'topic-a',
        categoryId: 'cat-1',
        categorySlug: 'rules-announcements',
        categoryName: 'Rules & Directives',
        categoryColor: '#ff5540',
        userId: null,
        authorName: 'High Ascendant',
        authorAvatar: '/images/stage1_larva.png',
        authorStage: 4,
        title: 'Threaded discussion',
        slug: 'threaded-discussion',
        content: 'Original post body long enough.',
        isPinned: false,
        isLocked: false,
        views: 10,
        repliesCount: 1,
        upvotes: 1,
        lastReplyAt: '2026-08-01T14:00:00.000Z',
        createdAt: '2026-08-01T12:00:00.000Z',
      },
      posts: [
        {
          id: 'post-root',
          topicId: 'topic-a',
          parentId: null,
          userId: 'member-a',
          authorName: 'pincer_prime',
          authorHandle: 'pincer_prime',
          authorAvatar: '/images/stage1_larva.png',
          authorStage: 3,
          content: 'Root reply body long enough to count.',
          upvotes: 3,
          createdAt: '2026-08-01T14:00:00.000Z',
        },
      ],
    })

    render(<ForumThreadPage />)

    fireEvent.click(screen.getByTestId('forum-quote-post'))
    const composer = screen.getByTestId('forum-inline-reply-composer')
    expect(composer.querySelector('textarea')).toHaveValue(
      '> @pincer_prime held:\n> Root reply body long enough to count.\n\n',
    )
  })

  it('does not offer Quote on a withdrawn topic', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'authed-user', name: 'Initiate' } },
    } as any)

    mockUseLoaderData.mockReturnValue({
      topic: {
        id: 'topic-a',
        categoryId: 'cat-1',
        categorySlug: 'rules-announcements',
        categoryName: 'Rules & Directives',
        categoryColor: '#ff5540',
        userId: 'member-a',
        authorName: 'claw_lord',
        authorHandle: 'claw_lord',
        authorAvatar: '/images/stage1_larva.png',
        authorStage: 3,
        title: 'Sealed transmission',
        slug: 'sealed-transmission',
        content: 'This body should stay sealed.',
        isPinned: false,
        isLocked: false,
        views: 10,
        repliesCount: 0,
        upvotes: 1,
        lastReplyAt: '2026-08-01T12:00:00.000Z',
        createdAt: '2026-08-01T12:00:00.000Z',
        deletedAt: '2026-09-06T02:00:00.000Z',
      },
      posts: [],
    })

    render(<ForumThreadPage />)

    expect(screen.queryByTestId('forum-quote-topic')).not.toBeInTheDocument()
  })
})
