import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { INITIAL_FORUM_TOPICS } from '../../lib/forum-seed-data'

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

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null }),
  },
}))

import { Route } from './$categorySlug/$topicSlug'
const ForumThreadPage = Route.options.component!

describe('ForumThreadPage (/forum/$categorySlug/$topicSlug)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ categorySlug: 'rules-announcements', topicSlug: 'welcome-to-community-core-directives' })
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

  it('renders a not-found state when the post is missing', () => {
    mockUseLoaderData.mockReturnValue(null)

    render(<ForumThreadPage />)

    expect(screen.getByText('Post Not Found')).toBeInTheDocument()
  })
})