import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { INITIAL_BLOG_POSTS } from '../../lib/blog-data'

// Mock TanStack Router
const mockUseLoaderData = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
    useLoaderData: () => mockUseLoaderData(),
  }),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/news' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

// Mock API functions
vi.mock('@/lib/server/api', () => ({
  getBlogPostsFn: vi.fn().mockResolvedValue(INITIAL_BLOG_POSTS),
  getPodcastsFn: vi.fn().mockResolvedValue([]),
}))

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null }),
  },
}))

import { Route } from './index'
const NewsIndexPage = Route.options.component!

describe('NewsIndexPage (index.tsx) Route Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLoaderData.mockReturnValue(INITIAL_BLOG_POSTS)
  })

  it('renders main lead dispatch first in DOM hierarchy for proper mobile stacking', () => {
    const { container } = render(<NewsIndexPage />)

    const mainLeadBadge = screen.getByText(new RegExp(`${INITIAL_BLOG_POSTS[0].category} · MAIN LEAD DISPATCH`))
    expect(mainLeadBadge).toBeInTheDocument()

    // Verify main lead post title is rendered in the h1 headline
    expect(screen.getByRole('heading', { level: 1, name: INITIAL_BLOG_POSTS[0].title })).toBeInTheDocument()

    // Verify the grid column order classes
    const heroGrid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-12')
    expect(heroGrid).toBeTruthy()

    const columns = heroGrid?.children
    expect(columns?.length).toBe(3)

    // First child in DOM should be the main lead column with order-1 lg:order-2
    expect(columns?.[0].className).toContain('order-1')
    expect(columns?.[0].className).toContain('lg:order-2')
    expect(columns?.[0].className).toContain('lg:col-span-6')

    // Second child in DOM should be the left column with order-2 lg:order-1
    expect(columns?.[1].className).toContain('order-2')
    expect(columns?.[1].className).toContain('lg:order-1')
    expect(columns?.[1].className).toContain('lg:col-span-3')

    // Third child in DOM should be the right column with order-3 lg:order-3
    expect(columns?.[2].className).toContain('order-3')
    expect(columns?.[2].className).toContain('lg:order-3')
    expect(columns?.[2].className).toContain('lg:col-span-3')
  })

  it('renders MoltNation live breaking ticker and topic desks', () => {
    render(<NewsIndexPage />)

    expect(screen.getByText('★ MOLTNATION LIVE ★')).toBeInTheDocument()
    expect(screen.getByText('CATCH UP ON DISPATCHES')).toBeInTheDocument()
    expect(screen.getByText('STREAMING NOW')).toBeInTheDocument()
    expect(screen.getByText('MOLTNATION PODCAST DISPATCHES')).toBeInTheDocument()
  })
})
