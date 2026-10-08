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
    expect(await screen.findByText('JOIN FREE', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText('TRY THE DEMO')).toBeInTheDocument()
  })

  it('renders graceful subtle skeleton while session resolution is pending without flashing wrong guest buttons', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: true,
    } as any)

    render(<LandingPage />)

    // Skeletons are rendered in place of CTA buttons to prevent flash of wrong unauthenticated state
    expect(screen.getByTestId('hero-auth-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('pillars-auth-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('bottom-auth-skeleton')).toBeInTheDocument()

    // Non-logged in CTAs should NOT be visible during pending state
    expect(screen.queryByText('JOIN FREE')).not.toBeInTheDocument()
    expect(screen.queryByText('INITIATE ASCENSION')).not.toBeInTheDocument()
    expect(screen.queryByText('TRY THE DEMO')).not.toBeInTheDocument()
  })

  it('renders settled guest CTAs once session settles with no user', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)

    render(<LandingPage />)

    expect(await screen.findByText('JOIN FREE', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText('TRY THE DEMO')).toBeInTheDocument()
    expect(screen.getAllByText('INITIATE ASCENSION').length).toBeGreaterThan(0)
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
    expect(screen.queryByText('INITIATE ASCENSION')).not.toBeInTheDocument()
    expect(screen.queryByText('TRY THE DEMO')).not.toBeInTheDocument()
  })

  it('renders the three core features as benefit-led rows with real screenshots', () => {
    render(<LandingPage />)

    expect(screen.getByRole('heading', { level: 2, name: 'Everything you need to finish what you start.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Know what to do the moment you sit down.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Get unstuck in a single conversation.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Keep going with people who get it.' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Open the dashboard/ }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' })
    fireEvent.click(screen.getByRole('button', { name: /Ask the Oracle/ }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/oracle' })
    fireEvent.click(screen.getByRole('button', { name: /Visit the community/ }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/forum' })

    expect(screen.getByAltText('Dashboard showing a featured lesson and community news')).toBeInTheDocument()
    expect(screen.getByAltText('A new conversation with the Oracle')).toBeInTheDocument()
    expect(screen.getByAltText('The Moltology community boards and latest posts')).toBeInTheDocument()

    expect(screen.getByText('Free to join. No card needed.')).toBeInTheDocument()
  })

  it('shows no backdrop artwork behind the core features', () => {
    render(<LandingPage />)
    const section = document.getElementById('core-pillars')!
    const sources = Array.from(section.querySelectorAll('img')).map((img) => img.getAttribute('src') ?? '')
    expect(sources).toHaveLength(3)
    expect(sources.every((src) => src.includes('/images/marketing/'))).toBe(true)
  })

  it('renders the live interactive laptop and smartphone device showcase', async () => {
    render(<LandingPage />)

    const showcase = await screen.findByLabelText('Interactive System Showcase')
    expect(showcase).toBeInTheDocument()
    expect(within(showcase).getByText('moltology.org/dashboard')).toBeInTheDocument()
    expect(screen.getByAltText('Safari preview')).toBeInTheDocument()
    expect(screen.getByAltText('iPhone 15 Pro preview')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /LAUNCH GUEST DEMO/i })).toBeInTheDocument()
  })

  it('eager-loads a single LCP hero still and lazy-loads below-fold artwork', async () => {
    render(<LandingPage />)

    const heroArtwork = screen.getByTestId('hero-artwork')
    expect(heroArtwork.getAttribute('loading')).toBe('eager')
    expect(heroArtwork.getAttribute('fetchpriority')).toBe('high')

    const heroPreview = screen.getByAltText(/The Moltology dashboard/)
    expect(heroPreview.getAttribute('loading')).toBe('eager')
    expect(heroPreview.getAttribute('fetchpriority')).toBe('low')

    const safariPreview = await screen.findByAltText('Safari preview')
    expect(safariPreview.getAttribute('loading')).toBe('lazy')
    expect(screen.getByAltText('iPhone 15 Pro preview').getAttribute('loading')).toBe('lazy')
  })

  it('ships no hero video on the homepage', () => {
    const { container } = render(<LandingPage />)
    expect(container.querySelectorAll('video')).toHaveLength(0)
  })

  it('renders the 4 Benthic Sacraments with protocol enforcement actions', () => {
    render(<LandingPage />)

    expect(screen.getByText('ASSET & HABIT SHEDDING')).toBeInTheDocument()
    expect(screen.getByText('CHITIN HARDENING')).toBeInTheDocument()
    expect(screen.getAllByText('ISOLATION DOME').length).toBeGreaterThan(0)
    expect(screen.getByText('PIPELINE ASCENT')).toBeInTheDocument()

    const enforceButtons = screen.getAllByText('LEARN MORE')
    expect(enforceButtons.length).toBe(4)
  })

  it('allows switching between the 4 Stages of Carcinization with transformation metrics', () => {
    render(<LandingPage />)

    expect(screen.getByText('THE 4 STAGES OF CARCINIZATION')).toBeInTheDocument()

    // Stage 1 active by default
    expect(screen.getByText('STAGE 01: LARVAL HUMAN')).toBeInTheDocument()
    expect(screen.getByText('75% REDUCED')).toBeInTheDocument()

    // Click Stage 4 tab
    const stage4Tab = screen.getByRole('button', { name: 'STAGE 04' })
    fireEvent.click(stage4Tab)

    expect(screen.getByText('STAGE 04: TOTAL CARCINIZATION')).toBeInTheDocument()
    expect(screen.getByText('0% REDUCED')).toBeInTheDocument()
    expect(screen.getByText('100% HARDENED')).toBeInTheDocument()
  })

  it('opens core feature screenshots in a gallery lightbox', () => {
    render(<LandingPage />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Expand the dashboard screenshot' }))

    const dialog = screen.getByRole('dialog', { name: 'The dashboard' })
    expect(within(dialog).getByText('1 / 3')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: /Next image/i }))
    expect(within(dialog).getByText('The Oracle')).toBeInTheDocument()
    expect(within(dialog).getByText('2 / 3')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: /Close image preview/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
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

  it('renders peppered quiz characters and companions across homepage corners and sections', () => {
    render(<LandingPage />)

    // Verify presence of character overlays
    expect(screen.getByAltText('Hero Lobster Pointing to Action')).toBeInTheDocument()
    expect(screen.getByAltText('Hero Lobster Peeking Over Card')).toBeInTheDocument()
    expect(screen.getByAltText('Sub-Benthic Abyss Scroll Reveal')).toBeInTheDocument()
    expect(screen.getByAltText('Ascended Stage Background Mascot')).toBeInTheDocument()
    expect(screen.getByAltText('Hero Lobster Giving Thumbs-Up')).toBeInTheDocument()
  })
})
