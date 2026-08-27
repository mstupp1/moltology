import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  })

  it('shows a not-found state for an unknown board', () => {
    mockUseLoaderData.mockReturnValue({ category: null, topics: [] })

    render(<ForumBoardPage />)

    expect(screen.getByText('Board Not Found')).toBeInTheDocument()
  })
})
