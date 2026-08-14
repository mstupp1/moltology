import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { INITIAL_BLOG_POSTS } from '../../lib/blog-data'

// Mock TanStack Router
const mockUseLoaderData = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({
    useLoaderData: () => mockUseLoaderData(),
  }),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/news/ai-learning-ascension-manifesto' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

// Mock API functions
vi.mock('@/lib/server/api', () => ({
  getBlogPostBySlugFn: vi.fn(),
  incrementBlogPostViewsFn: vi.fn().mockResolvedValue({ success: true }),
  getBlogCommentsFn: vi.fn().mockResolvedValue([]),
  createBlogCommentFn: vi.fn(),
}))

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null }),
  },
}))

import { NewsPostDetail } from './$slug'

describe('NewsPostDetail ($slug.tsx) Route Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 404 not-found card when post is null', () => {
    mockUseLoaderData.mockReturnValue(null)
    render(<NewsPostDetail />)

    expect(screen.getByText('NEWS DISPATCH NOT FOUND')).toBeInTheDocument()
    expect(screen.getByText('RETURN TO MOLTNATION NEWS')).toBeInTheDocument()
  })

  it('renders article title, author, share trigger, and benthic conversion CTA for a valid post', () => {
    const post = INITIAL_BLOG_POSTS[0]
    mockUseLoaderData.mockReturnValue(post)
    render(<NewsPostDetail />)

    expect(screen.getByText(post.title)).toBeInTheDocument()
    expect(screen.getByText(post.authorName)).toBeInTheDocument()
    expect(screen.getByText('SHARE')).toBeInTheDocument()
    expect(screen.getByText('BEGIN YOUR BIO-SILICON TRANSMUTATION')).toBeInTheDocument()
    expect(screen.getByText('RELATED BENTHIC INTELLIGENCE')).toBeInTheDocument()
  })
})
