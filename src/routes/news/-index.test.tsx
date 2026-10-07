import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { INITIAL_BLOG_POSTS } from '../../lib/blog-data'

// Mock TanStack Router
const mockUseLoaderData = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
  }),
  useLoaderData: () => mockUseLoaderData(),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/news' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

// Mock API functions
vi.mock('@/lib/server/api', () => ({
  getBlogPostsFn: vi.fn().mockResolvedValue(INITIAL_BLOG_POSTS),
}))

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null, isPending: false }),
  },
}))

import { Route } from './index'
const NewsIndexPage = Route.options.component!

// Enough posts to fill the lead, latest, more stories, and the archive list.
const MANY_POSTS = [
  ...INITIAL_BLOG_POSTS,
  ...INITIAL_BLOG_POSTS.map((post) => ({ ...post, slug: `${post.slug}-archive` })),
]

describe('NewsIndexPage (index.tsx) Route Component', () => {
  // The route lazy-loads the page; warm the module so the first findBy doesn't race a cold import.
  beforeAll(async () => {
    await import('@/components/news/NewsIndexPage')
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLoaderData.mockReturnValue(INITIAL_BLOG_POSTS)
  })

  it('renders the newest story as the lead, followed by latest and more stories', async () => {
    render(<NewsIndexPage />)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'The 2026 Moltmaxxing Protocol' })
    ).toBeInTheDocument()
    expect(screen.getByText('Why Elite AI Operators Are Shedding Biological Constraints')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Latest' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'More stories' })).toBeInTheDocument()
  })

  it('drops the ticker and placeholder sections', async () => {
    render(<NewsIndexPage />)

    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByText('★ MOLTNATION LIVE ★')).not.toBeInTheDocument()
    expect(screen.queryByText('STREAMING NOW')).not.toBeInTheDocument()
    expect(screen.queryByText(/MOLTNATION UNDERSCORED/)).not.toBeInTheDocument()
    expect(screen.queryByText(/strongest El Niño/)).not.toBeInTheDocument()
  })

  it('filters by section and shows a plain empty state for searches with no match', async () => {
    render(<NewsIndexPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Telemetry' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Telemetry' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search stories'), { target: { value: 'zzzz-no-match' } })
    expect(screen.getByText('No stories match that search.')).toBeInTheDocument()
  })

  it('eager-loads the flag LCP still and lazy-loads remaining dispatch artwork', async () => {
    render(<NewsIndexPage />)

    const flag = await screen.findByAltText('MoltNation Flag Background')
    expect(flag.getAttribute('loading')).toBe('eager')
    expect(flag.getAttribute('fetchpriority')).toBe('high')

    const lead = screen.getByAltText(INITIAL_BLOG_POSTS[0].title)
    expect(lead.getAttribute('loading')).toBe('eager')
    expect(lead.getAttribute('fetchpriority')).not.toBe('high')

    const listingCovers = screen.getAllByAltText(INITIAL_BLOG_POSTS[1].title)
    expect(listingCovers.length).toBeGreaterThan(0)
    listingCovers.forEach((img) => {
      expect(img.getAttribute('loading')).toBe('lazy')
    })
  })

  it('emits crawlable article hrefs for every listed story', async () => {
    mockUseLoaderData.mockReturnValue(MANY_POSTS)
    const { container } = render(<NewsIndexPage />)

    expect(await screen.findByRole('navigation', { name: 'News archive' })).toBeInTheDocument()

    for (const post of MANY_POSTS) {
      const links = container.querySelectorAll(`a[href="/news/${post.slug}"]`)
      expect(links.length).toBeGreaterThan(0)
    }
  })
})
