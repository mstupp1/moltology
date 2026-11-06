import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor, act } from '@testing-library/react'
import { HUDSidebar, computeNavItemHidden } from './HUDSidebar'
import { authClient } from '@/lib/auth-client'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' }),
  useRouter: () => ({ preloadRoute: vi.fn() }),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
    getSession: vi.fn().mockResolvedValue({ data: null }),
    signOut: vi.fn(),
  },
}))

const mockGetUserProfileFn = vi.fn().mockResolvedValue(null)
const mockListConnectionsFn = vi.fn().mockResolvedValue({ incoming: [] })

vi.mock('../../lib/server/api', () => ({
  getUserProfileFn: (...args: unknown[]) => mockGetUserProfileFn(...args),
  listConnectionsFn: (...args: unknown[]) => mockListConnectionsFn(...args),
}))

const mockGetPremiumMembershipFn = vi.fn()

vi.mock('@/lib/server/premium-api', () => ({
  getPremiumMembershipFn: (...args: unknown[]) => mockGetPremiumMembershipFn(...args),
}))

vi.mock('../../lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('test-token'),
}))

describe('HUDSidebar Component Navigation & Animations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUserProfileFn.mockResolvedValue(null)
    mockGetPremiumMembershipFn.mockResolvedValue({ hasPurchasedPremium: false, isPremium: false })
    localStorage.clear()
    document.body.style.overflow = ''
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps desktop contents at their target width while the outer rail changes width', () => {
    const { container } = render(<HUDSidebar />)
    const aside = screen.getByRole('complementary')
    expect(aside).toHaveClass('transition-[width]', 'motion-reduce:transition-none')
    expect(container.querySelector('nav')?.parentElement).toHaveClass('w-56')
    fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(container.querySelector('nav')?.parentElement).toHaveClass('w-20')
    fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(container.querySelector('nav')?.parentElement).toHaveClass('w-56')
  })

  it('cancels mobile close callbacks on reopen and releases scroll lock at the desktop breakpoint', () => {
    vi.useFakeTimers()
    render(<HUDSidebar />)
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    act(() => vi.advanceTimersByTime(50))
    const dialog = screen.getByRole('dialog', { name: 'More pages' })
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    expect(dialog).toHaveAttribute('inert')
    expect(dialog).toHaveClass('translate-y-4')
    act(() => vi.advanceTimersByTime(100))
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    act(() => vi.advanceTimersByTime(250))
    expect(screen.getByRole('dialog', { name: 'More pages' })).toBe(dialog)
    expect(dialog).not.toHaveAttribute('inert')
    const previousWidth = window.innerWidth
    window.innerWidth = 1024
    fireEvent.resize(window)
    expect(dialog).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
    window.innerWidth = previousWidth
    vi.useRealTimers()
  })

  it('renders one flat list of pages without section headings', () => {
    render(<HUDSidebar />)
    const sidebar = within(screen.getByRole('complementary'))

    expect(sidebar.queryByText('MAIN')).not.toBeInTheDocument()
    expect(sidebar.queryByText('LEARN')).not.toBeInTheDocument()
    expect(sidebar.queryByText('COMMUNITY')).not.toBeInTheDocument()

    expect(sidebar.getAllByText('DASHBOARD').length).toBeGreaterThan(0)
    expect(sidebar.getByText('ORACLE')).toBeInTheDocument()
    expect(sidebar.getByRole('button', { name: /^CHARACTER$/i })).toBeInTheDocument()
    expect(sidebar.getByRole('button', { name: /^PROFILE$/i })).toBeInTheDocument()
    expect(sidebar.getByRole('button', { name: /^ACADEMY$/i })).toBeInTheDocument()
    expect(sidebar.getByRole('button', { name: /^FORUM$/i })).toBeInTheDocument()
    // Friends lives on the profile and Stages on Character, so neither has a sidebar row.
    expect(sidebar.queryByRole('button', { name: /^FRIENDS$/i })).not.toBeInTheDocument()
    expect(sidebar.queryByRole('button', { name: /^STAGES$/i })).not.toBeInTheDocument()
    // Daily alignment sits in the sidebar footer, above Help & support.
    expect(sidebar.getAllByRole('button', { name: 'Daily alignment tasks schedule' }).length).toBeGreaterThan(0)
    expect(sidebar.queryByRole('button', { name: /^MARKET$/i })).not.toBeInTheDocument()
  })

  it.each([['CODEX', '/codex'], ['FORUM', '/forum'], ['CHARACTER', '/character']])('navigates to %s on nav item click', (label, route) => {
    render(<HUDSidebar />)

    fireEvent.click(within(screen.getByRole('complementary')).getByRole('button', { name: label }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: route })
  })

  it('navigates to /dashboard when brand emblem logo is clicked', () => {
    render(<HUDSidebar />)

    const brandLogos = screen.getAllByRole('img', { name: 'Order Emblem' })
    fireEvent.click(brandLogos[0])

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' })
  })

  it('toggles sidebar collapse with shortcut key (Cmd+B)', () => {
    render(<HUDSidebar />)

    const aside = screen.getByRole('complementary')
    expect(aside).toHaveClass('md:w-56')

    // Press Cmd+B to collapse
    fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(aside).toHaveClass('md:w-20')

    // Press Cmd+B to un-collapse
    fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(aside).toHaveClass('md:w-56')
  })

  it('toggles sidebar collapse with interactive edge rail click', () => {
    render(<HUDSidebar />)

    const aside = screen.getByRole('complementary')
    expect(aside).toHaveClass('md:w-56')

    const rail = screen.getByRole('separator', { name: /Collapse sidebar/i })
    expect(rail).toBeInTheDocument()

    // Click rail (mouseDown then mouseUp without move)
    fireEvent.mouseDown(rail, { button: 0, clientX: 288 })
    fireEvent.mouseUp(window)

    expect(aside).toHaveClass('md:w-20')

    // Click rail again to expand
    fireEvent.mouseDown(rail, { button: 0, clientX: 72 })
    fireEvent.mouseUp(window)

    expect(aside).toHaveClass('md:w-56')
  })

  it('collapses and expands sidebar by dragging the edge rail', () => {
    render(<HUDSidebar />)

    const aside = screen.getByRole('complementary')
    expect(aside).toHaveClass('md:w-56')

    const rail = screen.getByRole('separator')

    // Drag left past threshold
    fireEvent.mouseDown(rail, { button: 0, clientX: 288 })
    fireEvent.mouseMove(window, { clientX: 100 })
    fireEvent.mouseUp(window)

    expect(aside).toHaveClass('md:w-20')

    // Drag right past threshold
    fireEvent.mouseDown(rail, { button: 0, clientX: 72 })
    fireEvent.mouseMove(window, { clientX: 300 })
    fireEvent.mouseUp(window)

    expect(aside).toHaveClass('md:w-56')
  })

  it('renders short centered text names underneath items in collapsed mode', () => {
    render(<HUDSidebar />)

    // Collapse the sidebar via Cmd+B
    fireEvent.keyDown(window, { key: 'b', metaKey: true })
    const aside = screen.getByRole('complementary')
    expect(aside).toHaveClass('md:w-20')

    // Check for short labels
    expect(screen.getAllByText('CODEX').length).toBeGreaterThan(0)
    expect(screen.getAllByText('DASHBOARD').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ORACLE').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ACADEMY').length).toBeGreaterThan(0)
    expect(screen.queryByText('JOURNAL')).not.toBeInTheDocument()
    expect(screen.getAllByText('CHARACTER').length).toBeGreaterThan(0)
    expect(screen.getAllByText('FORUM').length).toBeGreaterThan(0)
    expect(screen.getAllByText('SUPPORT').length).toBeGreaterThan(0)
  })

  it('shows the phone bottom bar with the main pages and More, and keeps search and tasks up top', () => {
    render(<HUDSidebar />)

    const bar = within(screen.getByRole('navigation', { name: 'Main' }))
    expect(bar.getAllByRole('button').map((b) => b.textContent)).toEqual(['DASHBOARD', 'ORACLE', 'CHARACTER', 'FORUM', 'More'])
    fireEvent.click(bar.getByRole('button', { name: 'FORUM' }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/forum' })

    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getAllByLabelText('Daily alignment tasks schedule').length).toBeGreaterThan(0)
    // The old stage progress bar and hamburger are gone.
    expect(screen.queryByLabelText('Stage 1 Badge')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Open menu/i })).not.toBeInTheDocument()
  })

  it('opens More as a sheet above the bottom bar with Profile, Codex and Academy', async () => {
    render(<HUDSidebar />)

    fireEvent.click(screen.getByRole('button', { name: 'More' }))

    const dialog = screen.getByRole('dialog', { name: 'More pages' })
    // A short sheet resting on the bottom bar, not a full-screen panel.
    expect(dialog).toHaveClass('fixed', 'inset-x-0', 'rounded-t-card', 'w-screen')
    expect(dialog).not.toHaveClass('top-14')
    expect(document.body.style.overflow).toBe('hidden')
    expect(screen.getByRole('button', { name: 'More' })).toHaveAttribute('aria-expanded', 'true')
    const sheet = within(dialog)
    expect(sheet.getAllByRole('button').slice(0, 3).map((b) => b.textContent)).toEqual(['PROFILE', 'CODEX', 'ACADEMY'])
    expect(sheet.queryByRole('button', { name: /^ORACLE$/ })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'More pages' })).not.toBeInTheDocument()
      expect(document.body.style.overflow).toBe('')
    })
  })

  it('closes More when the dimmed page behind it is tapped', async () => {
    render(<HUDSidebar />)

    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    expect(screen.getByRole('dialog', { name: 'More pages' })).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('more-backdrop'))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'More pages' })).not.toBeInTheDocument()
    })
  })

  it('closes More when Escape key is pressed', async () => {
    render(<HUDSidebar />)

    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    expect(screen.getByRole('dialog', { name: 'More pages' })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'More pages' })).not.toBeInTheDocument()
    })
  })

  it('navigates and closes More when a page inside it is clicked', async () => {
    render(<HUDSidebar />)

    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    const dialog = screen.getByRole('dialog', { name: 'More pages' })
    fireEvent.click(within(dialog).getByRole('button', { name: /^CODEX$/i }))

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/codex' })
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'More pages' })).not.toBeInTheDocument()
    })
  })

  it('renders sign up button for guest users and opens auth modal on click', () => {
    render(<HUDSidebar />)

    const signUpBtn = screen.getByRole('button', { name: /SIGN UP/i })
    expect(signUpBtn).toBeInTheDocument()

    fireEvent.click(signUpBtn)
    expect(screen.getByRole('heading', { name: /CREATE ACCOUNT/i })).toBeInTheDocument()
  })

  it('stacks Support option on top of Sign Up button in collapsed guest mode and handles clicks', () => {
    render(<HUDSidebar />)

    // Collapse sidebar
    fireEvent.keyDown(window, { key: 'b', metaKey: true })

    const supportBtn = screen.getByRole('button', { name: /SUPPORT/i })
    expect(supportBtn).toBeInTheDocument()

    const signUpBtn = screen.getByTitle(/Sign Up \/ Initialize Operative/i)
    expect(signUpBtn).toBeInTheDocument()

    // Test support navigation
    fireEvent.click(supportBtn)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/support' })

    // Test sign up modal trigger
    fireEvent.click(signUpBtn)
    expect(screen.getByRole('heading', { name: /CREATE ACCOUNT/i })).toBeInTheDocument()
  })

  it('stacks Support option on top of UserAvatarMenu in collapsed authenticated mode', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'test-user-1',
          name: 'Operative Alpha',
          email: 'alpha@moltology.io',
          role: 'admin',
        },
      } as any,
    } as any)

    render(<HUDSidebar />)

    // Collapse sidebar
    fireEvent.keyDown(window, { key: 'b', metaKey: true })

    const supportBtn = screen.getByRole('button', { name: /SUPPORT/i })
    expect(supportBtn).toBeInTheDocument()

    const userMenuBtn = screen.getByRole('button', { name: /User account menu/i })
    expect(userMenuBtn).toBeInTheDocument()

    // Test support navigation
    fireEvent.click(supportBtn)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/support' })

    // Test opening user avatar menu in collapsed mode
    fireEvent.click(userMenuBtn)
    await waitFor(() => {
      expect(screen.getByText('alpha@moltology.io')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /SIGN OUT/i })).toBeInTheDocument()
  })

  it('badges the Profile item with waiting friend requests', async () => {
    mockListConnectionsFn.mockResolvedValueOnce({ incoming: [{ userId: 'a' }, { userId: 'b' }] })
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'test-user-1', name: 'Operative Alpha', email: 'alpha@moltology.io' } } as any,
    } as any)

    render(<HUDSidebar />)

    await waitFor(() => expect(mockListConnectionsFn).toHaveBeenCalled())
    const profile = await screen.findByRole('button', { name: /^PROFILE\W*2 friend requests waiting$/i })
    expect(profile).toHaveTextContent('2')
    fireEvent.click(profile)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/profile' })
  })

  it('renders avatar skeleton placeholder while session is pending', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: true,
    } as any)

    render(<HUDSidebar />)

    expect(screen.getByTestId('sidebar-auth-skeleton')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /SIGN UP/i })).not.toBeInTheDocument()
  })

  it('holds the account pill for the first-paint empty session shape', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)

    render(<HUDSidebar />)

    expect(screen.getByTestId('sidebar-auth-skeleton')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /SIGN UP/i })).not.toBeInTheDocument()
  })

  it('initializes immediately in collapsed state when saved in localStorage', () => {
    localStorage.setItem('moltology_hud_sidebar_collapsed', 'true')

    const { container } = render(<HUDSidebar />)

    const aside = container.querySelector('aside')
    expect(aside?.className).toContain('md:w-20')
    expect(aside?.className).not.toContain('md:w-56')
  })

  it('shows a claimed designation in the account menu instead of the larva unit', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          name: 'Operative Alpha',
          email: 'alpha@moltology.io',
        },
      } as any,
    } as any)
    mockGetUserProfileFn.mockResolvedValue({
      handle: 'claw_lord',
      larvaId: 'LARVA UNIT #2468',
      role: 'user',
    })

    render(<HUDSidebar />)

    fireEvent.click(screen.getByRole('button', { name: /User account menu/i }))
    await waitFor(() => {
      expect(screen.getAllByText('claw_lord').length).toBeGreaterThan(0)
    })
    expect(screen.queryByText(/LARVA UNIT/)).not.toBeInTheDocument()
  })

  it('hides admin tools and Go Oracle MAX badge from members', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'member-1',
          name: 'Member',
          email: 'member@example.com',
          role: 'user',
        },
      } as any,
      isPending: false,
    } as any)
    mockGetUserProfileFn.mockResolvedValue({ role: 'user', handle: null, larvaId: null })

    render(<HUDSidebar />)

    await waitFor(() => {
      expect(mockGetUserProfileFn).toHaveBeenCalled()
    })
    expect(screen.queryByRole('button', { name: /Go Oracle MAX/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^ADMIN$/i })).not.toBeInTheDocument()
  })

  it('shows admin nav and Go Oracle MAX for opted-in admins', async () => {
    mockGetUserProfileFn.mockResolvedValue({ role: 'admin', experiments: ['premium'] })
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'admin-1',
          name: 'Admin',
          email: 'ops@example.com',
          role: 'admin',
        },
      } as any,
      isPending: false,
    } as any)

    render(<HUDSidebar />)

    const adminItem = screen.getByRole('button', { name: /^ADMIN$/i })
    expect(adminItem).toBeInTheDocument()
    expect(adminItem).not.toHaveAttribute('data-hidden', 'true')

    const premiumBadge = await screen.findByRole('button', { name: /Go Oracle MAX/i })
    expect(premiumBadge).toBeInTheDocument()
    expect(premiumBadge).not.toHaveAttribute('data-hidden', 'true')

    // Admin item should be positioned above Help & Support in bottom controls
    const supportItem = screen.getByRole('button', { name: /HELP & SUPPORT/i })
    expect(adminItem.compareDocumentPosition(supportItem)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('shows admin nav item and Go Oracle MAX badge when admin clearance lives only on the profile', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'profile-admin',
          name: 'Profile Admin',
          email: 'profile-admin@example.com',
          role: 'user',
        },
      } as any,
      isPending: false,
    } as any)
    mockGetUserProfileFn.mockResolvedValue({ role: 'admin', experiments: ['premium'], handle: null, larvaId: null })

    render(<HUDSidebar />)

    expect(await screen.findByRole('button', { name: /^ADMIN$/i })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Go Oracle MAX/i })).toBeInTheDocument()
  })

  it('stacks admin above support and hides Go Oracle MAX when sidebar is collapsed', async () => {
    mockGetUserProfileFn.mockResolvedValue({ role: 'admin', experiments: ['premium'] })
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'admin-1',
          name: 'Admin',
          email: 'ops@example.com',
          role: 'admin',
        },
      } as any,
      isPending: false,
    } as any)

    render(<HUDSidebar />)

    // Initially expanded: Go Oracle MAX row visible
    expect(await screen.findByRole('button', { name: /Go Oracle MAX/i })).toBeInTheDocument()

    // Collapse via Cmd+B
    fireEvent.keyDown(window, { key: 'b', metaKey: true })

    // Go Oracle MAX is hidden when collapsed
    expect(screen.queryByRole('button', { name: /Go Oracle MAX/i })).not.toBeInTheDocument()

    // Admin button is stacked above support
    const collapsedAdmin = screen.getByRole('button', { name: /^ADMIN$/i })
    const collapsedSupport = screen.getByRole('button', { name: /SUPPORT/i })
    expect(collapsedAdmin).toBeInTheDocument()
    expect(collapsedSupport).toBeInTheDocument()
    expect(collapsedAdmin.compareDocumentPosition(collapsedSupport)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('shows the account row with the plan and Go Oracle MAX below support for free members', async () => {
    mockGetUserProfileFn.mockResolvedValue({ role: 'admin', experiments: ['premium'] })
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'admin-1', name: 'Admin', email: 'ops@example.com', role: 'admin' } } as any,
      isPending: false,
    } as any)

    render(<HUDSidebar />)

    const goPremium = await screen.findByRole('button', { name: /Go Oracle MAX/i })
    const supportItem = screen.getByRole('button', { name: /HELP & SUPPORT/i })
    const accountRow = screen.getByRole('button', { name: /User account menu/i })
    expect(supportItem.compareDocumentPosition(goPremium)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(goPremium.compareDocumentPosition(accountRow)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(accountRow).toHaveTextContent('Free plan')

    fireEvent.click(goPremium)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/premium' })
  })

  it('hides Go Oracle MAX and labels the account row for current Oracle MAX members', async () => {
    mockGetUserProfileFn.mockResolvedValue({ role: 'admin', experiments: ['premium'] })
    mockGetPremiumMembershipFn.mockResolvedValue({ hasPurchasedPremium: true, isPremium: true })
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'admin-1', name: 'Admin', email: 'ops@example.com', role: 'admin' } } as any,
      isPending: false,
    } as any)

    render(<HUDSidebar />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /User account menu/i })).toHaveTextContent('Oracle MAX member')
    })
    expect(screen.queryByRole('button', { name: /Go Oracle MAX/i })).not.toBeInTheDocument()
  })

  it('shows the larva unit in the account menu when no designation is claimed', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          name: 'Operative Alpha',
          email: 'alpha@moltology.io',
        },
      } as any,
    } as any)
    mockGetUserProfileFn.mockResolvedValue({
      handle: null,
      larvaId: 'LARVA UNIT #2468',
      role: 'user',
    })

    render(<HUDSidebar />)

    fireEvent.click(screen.getByRole('button', { name: /User account menu/i }))
    await waitFor(() => {
      expect(screen.getAllByText('LARVA UNIT #2468').length).toBeGreaterThan(0)
    })
    expect(screen.queryByText('claw_lord')).not.toBeInTheDocument()
  })

  describe('computeNavItemHidden', () => {
    it('returns true for items on a hidden page path', () => {
      expect(computeNavItemHidden({ path: '/store' }, { role: 'admin' })).toBe(true)
    })

    it('returns true for tabs gated by an admin-only feature flag when viewed by admin', () => {
      expect(computeNavItemHidden({ path: '/demo', featureFlag: 'premium' }, { role: 'admin', experiments: ['premium'] })).toBe(true)
    })

    it('returns false for tabs gated by an admin-only feature flag when viewed by regular member', () => {
      expect(computeNavItemHidden({ path: '/demo', featureFlag: 'premium' }, { role: 'user' })).toBe(false)
    })

    it('returns false for standard public tabs', () => {
      expect(computeNavItemHidden({ path: '/dashboard' }, { role: 'admin' })).toBe(false)
      expect(computeNavItemHidden({ path: '/dashboard' }, { role: 'user' })).toBe(false)
    })
  })
})
