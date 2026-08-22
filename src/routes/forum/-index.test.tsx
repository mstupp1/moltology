import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { INITIAL_FORUM_CATEGORIES, INITIAL_FORUM_TOPICS } from '../../lib/forum-seed-data'

const mockUseLoaderData = vi.fn()
const mockNavigate = vi.fn()

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
    useSession: () => ({ data: null }),
  },
}))

import { Route } from './index'
const ForumIndexPage = Route.options.component!

describe('ForumIndexPage (/forum)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the board directory and latest posts section', () => {
    const categories = INITIAL_FORUM_CATEGORIES.map((c) => ({
      ...c,
      topicCount: INITIAL_FORUM_TOPICS.filter((t) => t.categoryId === c.id).length,
    }))
    mockUseLoaderData.mockReturnValue({ categories, topics: [] })

    render(<ForumIndexPage />)

    expect(screen.getByRole('heading', { level: 1, name: /forums/i })).toBeInTheDocument()
    expect(screen.getByText('Discussion Boards')).toBeInTheDocument()
    expect(screen.getByText('Rules & Directives')).toBeInTheDocument()
    expect(screen.getByText('General Discussion')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new post/i })).toBeInTheDocument()
  })
})