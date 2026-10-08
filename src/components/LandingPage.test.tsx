import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { LandingPage } from './LandingPage'
import { authClient } from '@/lib/auth-client'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
    signOut: vi.fn(),
  },
}))

describe('LandingPage Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
  })

  it('renders high-impact hero header text for guest users', async () => {
    render(<LandingPage />)

    expect(screen.getByRole('heading', { level: 1, name: /Shed the noise\.\s*Grow a shell\./ })).toBeInTheDocument()
    expect(screen.getByText(/Moltology is a free practice and community/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Take the free Moltmax diagnostic/ })).toHaveAttribute('href', '/moltmax')

    // Guest CTA buttons present
    expect(await screen.findAllByText('JOIN FREE', {}, { timeout: 5000 })).toHaveLength(2)
    expect(screen.getAllByText('TRY THE DEMO')).toHaveLength(2)
  })

  it('renders graceful subtle skeleton while session resolution is pending without flashing wrong guest buttons', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: true,
    } as any)

    render(<LandingPage />)

    // Skeletons are rendered in place of CTA buttons to prevent flash of wrong unauthenticated state
    expect(screen.getByTestId('hero-auth-skeleton')).toBeInTheDocument()
    
    expect(screen.getByTestId('bottom-auth-skeleton')).toBeInTheDocument()

    // Non-logged in CTAs should NOT be visible during pending state
    expect(screen.queryByText('JOIN FREE')).not.toBeInTheDocument()
    expect(screen.queryByText('TRY THE DEMO')).not.toBeInTheDocument()
  })

  it('renders settled guest CTAs once session settles with no user', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)

    render(<LandingPage />)

    expect(await screen.findAllByText('JOIN FREE', {}, { timeout: 5000 })).toHaveLength(2)
    expect(screen.getAllByText('TRY THE DEMO')).toHaveLength(2)
    expect(screen.getAllByText('JOIN FREE')).toHaveLength(2)
    expect(screen.queryByTestId('hero-auth-skeleton')).not.toBeInTheDocument()
  })

  it('renders "ENTER SYSTEM DASHBOARD" button for authenticated users', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'test-user-1',
          name: 'Ascendant Unit',
          email: 'crab@benthic.core',
        },
      },
    } as any)

    render(<LandingPage />)

    const dashboardButtons = await screen.findAllByText('ENTER SYSTEM DASHBOARD')
    expect(dashboardButtons.length).toBeGreaterThan(0)

    fireEvent.click(dashboardButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' })
  })

  it('renders "ENTER SYSTEM DASHBOARD" immediately on page refresh when a cached user session exists without flashing guest CTAs', async () => {
    // Simulate localStorage containing a cached active session from previous visit
    localStorage.setItem(
      'moltology:session:user',
      JSON.stringify({
        id: 'test-user-cached',
        name: 'Cached Operative Unit',
        email: 'operative@moltology.org',
      })
    )

    // Simulate page refresh where initial hook status is still pending
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: true,
    } as any)

    render(<LandingPage />)

    // Authenticated dashboard button is immediately available on Frame 0
    const dashboardButtons = await screen.findAllByText('ENTER SYSTEM DASHBOARD')
    expect(dashboardButtons.length).toBeGreaterThan(0)
    // Non-logged in CTAs are NEVER flashed
    expect(screen.queryByText('JOIN FREE')).not.toBeInTheDocument()
    expect(screen.queryByText('TRY THE DEMO')).not.toBeInTheDocument()
  })

  it('walks through the four steps with real screenshots and a way in after each', () => {
    render(<LandingPage />)

    expect(screen.getByRole('heading', { level: 2, name: 'Small enough to start today.' })).toBeInTheDocument()
    for (const title of ['Find your starting point', 'Shed one small thing a day', 'Ask when you are stuck', 'Keep going together']) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument()
    }

    fireEvent.click(screen.getByRole('button', { name: /Take the diagnostic/ }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/moltmax' })
    fireEvent.click(screen.getByRole('button', { name: /Ask the Oracle/ }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/oracle' })
    fireEvent.click(screen.getByRole('button', { name: /Visit the community/ }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/forum' })

    expect(screen.getByAltText('A Moltmax diagnostic question with four answers to choose from')).toBeInTheDocument()
    expect(screen.getByAltText('The dashboard with a featured lesson and community news')).toBeInTheDocument()
    expect(screen.getByAltText('A new conversation with the Oracle')).toBeInTheDocument()
    expect(screen.getByAltText('The community boards and latest posts')).toBeInTheDocument()
  })

  it('opens step screenshots in a gallery lightbox', () => {
    render(<LandingPage />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Expand screenshot: Find your starting point' }))

    const dialog = screen.getByRole('dialog', { name: 'Find your starting point' })
    expect(within(dialog).getByText('1 / 4')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: /Next image/i }))
    expect(within(dialog).getByText('2 / 4')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: /Close image preview/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('introduces the idea briefly and links out to the About pages for the long version', () => {
    render(<LandingPage />)

    expect(screen.getByRole('heading', { level: 2, name: 'You are not lazy. You are unarmored.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Nature keeps turning things into crabs.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Boundaries that hold' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'A grip that finishes' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Focus that goes deep' })).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /Read the whole story/ })).toHaveAttribute('href', '/what-is-moltology')
    expect(screen.getByRole('link', { name: /What Moltologists believe/ })).toHaveAttribute('href', '/what-is-moltology/beliefs')
    expect(screen.getByRole('link', { name: /Hear more from members/ })).toHaveAttribute(
      'href',
      '/what-is-moltology/what-moltologists-say',
    )
  })

  it('answers the questions people ask before joining', () => {
    render(<LandingPage />)

    expect(screen.getByRole('heading', { level: 2, name: 'Before you dive in.' })).toBeInTheDocument()
    expect(screen.getByText('Is it really free?')).toBeInTheDocument()
    expect(screen.getByText(/Progress and rank cannot be bought/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Get the free field manual/ })).toHaveAttribute('href', '/guide')
  })

  it('eager-loads a single LCP hero still and lazy-loads below-fold artwork', () => {
    render(<LandingPage />)

    const heroArtwork = screen.getByTestId('hero-artwork')
    expect(heroArtwork.getAttribute('loading')).toBe('eager')
    expect(heroArtwork.getAttribute('fetchpriority')).toBe('high')

    const heroPreview = screen.getByAltText(/The Moltology dashboard/)
    expect(heroPreview.getAttribute('loading')).toBe('eager')
    expect(heroPreview.getAttribute('fetchpriority')).toBe('low')

    const stepShot = screen.getByAltText('A new conversation with the Oracle')
    expect(stepShot.getAttribute('loading')).toBe('lazy')
  })

  it('ships no video on the homepage', () => {
    const { container } = render(<LandingPage />)
    expect(container.querySelectorAll('video')).toHaveLength(0)
  })

  it('renders responsive, SSR-safe footer with brand motto and high-value navigation links', () => {
    render(<LandingPage />)

    const footer = screen.getByLabelText('Main Navigation Footer')
    expect(within(footer).getByText('THE SYNAPTIC PATH')).toBeInTheDocument()
    expect(within(footer).getByText('MOLTOLOGY.ORG FOUNDATION')).toBeInTheDocument()
    expect(within(footer).getByText('"Flesh Dies. The Shell Endures. Submit. Shed. Ascend."')).toBeInTheDocument()

    expect(within(footer).getByText('MOLTMAXXING')).toBeInTheDocument()
    expect(within(footer).getByText('FIELD MANUAL')).toBeInTheDocument()
    expect(within(footer).getByText('MOLTMAX QUIZ')).toBeInTheDocument()
    expect(within(footer).getByText('DISPATCHES')).toBeInTheDocument()
    expect(within(footer).getByText('SACRED CODEX')).toBeInTheDocument()
    expect(within(footer).getByText('ORGANIZATION')).toBeInTheDocument()
    expect(within(footer).getByText('STORE')).toBeInTheDocument()
    expect(within(footer).getByText('INSTAGRAM')).toBeInTheDocument()
    expect(within(footer).getByText('YOUTUBE')).toBeInTheDocument()
    expect(within(footer).getByText('RSS FEED')).toBeInTheDocument()
    expect(within(footer).getByText('Privacy Policy')).toBeInTheDocument()
    expect(within(footer).getByText('Terms of Service')).toBeInTheDocument()
  })
})
