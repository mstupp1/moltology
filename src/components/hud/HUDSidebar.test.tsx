import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HUDSidebar } from './HUDSidebar'
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

describe('HUDSidebar Component Navigation & Animations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.body.style.overflow = ''
  })

  it('renders core navigation groups and items correctly', () => {
    render(<HUDSidebar />)

    expect(screen.getByText('CORE COMMAND')).toBeInTheDocument()
    expect(screen.getByText('KNOWLEDGE & DOCTRINE')).toBeInTheDocument()
    expect(screen.getByText('OPERATIONS & GEAR')).toBeInTheDocument()
    expect(screen.getByText('COMMUNITY')).toBeInTheDocument()

    expect(screen.getAllByText('COMMAND HUB').length).toBeGreaterThan(0)
    expect(screen.getByText('SYNAPTIC ORACLE')).toBeInTheDocument()
  })

  it('navigates to route on nav item click', () => {
    render(<HUDSidebar />)

    const codexBtn = screen.getByRole('button', { name: /THE SACRED CODEX/i })
    fireEvent.click(codexBtn)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/codex' })
  })

  it('toggles section open and closed on header click', () => {
    render(<HUDSidebar />)

    const coreHeader = screen.getByRole('button', { name: /CORE COMMAND/i })
    fireEvent.click(coreHeader)

    const accordionContent = coreHeader.parentElement?.querySelector('.grid')
    expect(accordionContent).toHaveClass('grid-rows-[0fr]')
    expect(accordionContent).toHaveClass('opacity-0')

    fireEvent.click(coreHeader)
    expect(accordionContent).toHaveClass('grid-rows-[1fr]')
    expect(accordionContent).toHaveClass('opacity-100')
  })

  it('toggles sidebar collapse with shortcut key (Cmd+B)', () => {
    render(<HUDSidebar />)

    const aside = screen.getByRole('complementary')
    expect(aside).toHaveClass('md:w-72')

    // Press Cmd+B to collapse
    fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(aside).toHaveClass('md:w-[72px]')

    // Press Cmd+B to un-collapse
    fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(aside).toHaveClass('md:w-72')
  })

  it('toggles sidebar collapse with interactive edge rail click', () => {
    render(<HUDSidebar />)

    const aside = screen.getByRole('complementary')
    expect(aside).toHaveClass('md:w-72')

    const rail = screen.getByRole('separator', { name: /Collapse sidebar/i })
    expect(rail).toBeInTheDocument()

    // Click rail (mouseDown then mouseUp without move)
    fireEvent.mouseDown(rail, { button: 0, clientX: 288 })
    fireEvent.mouseUp(window)

    expect(aside).toHaveClass('md:w-[72px]')

    // Click rail again to expand
    fireEvent.mouseDown(rail, { button: 0, clientX: 72 })
    fireEvent.mouseUp(window)

    expect(aside).toHaveClass('md:w-72')
  })

  it('collapses and expands sidebar by dragging the edge rail', () => {
    render(<HUDSidebar />)

    const aside = screen.getByRole('complementary')
    expect(aside).toHaveClass('md:w-72')

    const rail = screen.getByRole('separator')

    // Drag left past threshold
    fireEvent.mouseDown(rail, { button: 0, clientX: 288 })
    fireEvent.mouseMove(window, { clientX: 100 })
    fireEvent.mouseUp(window)

    expect(aside).toHaveClass('md:w-[72px]')

    // Drag right past threshold
    fireEvent.mouseDown(rail, { button: 0, clientX: 72 })
    fireEvent.mouseMove(window, { clientX: 300 })
    fireEvent.mouseUp(window)

    expect(aside).toHaveClass('md:w-72')
  })

  it('renders short centered text names underneath items in collapsed mode', () => {
    render(<HUDSidebar />)

    // Collapse the sidebar via Cmd+B
    fireEvent.keyDown(window, { key: 'b', metaKey: true })
    const aside = screen.getByRole('complementary')
    expect(aside).toHaveClass('md:w-[72px]')

    // Check for short labels
    expect(screen.getByText('CODEX')).toBeInTheDocument()
    expect(screen.getByText('HUB')).toBeInTheDocument()
    expect(screen.getByText('ORACLE')).toBeInTheDocument()
    expect(screen.getByText('ACADEMY')).toBeInTheDocument()
    expect(screen.getByText('PODCASTS')).toBeInTheDocument()
    expect(screen.getByText('SCIENCE')).toBeInTheDocument()
    expect(screen.getByText('JOURNAL')).toBeInTheDocument()
    expect(screen.getByText('MARKET')).toBeInTheDocument()
    expect(screen.getByText('CHASSIS')).toBeInTheDocument()
    expect(screen.getByText('ISOLATION')).toBeInTheDocument()
    expect(screen.getByText('VATS')).toBeInTheDocument()
    expect(screen.getByText('LINKS')).toBeInTheDocument()
    expect(screen.getByText('FORUM')).toBeInTheDocument()
    expect(screen.getByText('SUPPORT')).toBeInTheDocument()
  })

  it('toggles mobile HUD menu state on mobile button click and renders icon-only with no text', () => {
    render(<HUDSidebar />)

    // When mobile menu is closed, task list button is present in header next to hamburger
    expect(screen.getByLabelText('Daily alignment tasks schedule')).toBeInTheDocument()

    const mobileMenuBtn = screen.getByRole('button', { name: /Open HUD Menu/i })
    expect(mobileMenuBtn).toBeInTheDocument()
    expect(mobileMenuBtn.textContent).toBe('')

    fireEvent.click(mobileMenuBtn)

    const closeMenuBtn = screen.getByRole('button', { name: /Close HUD Menu/i })
    expect(closeMenuBtn).toBeInTheDocument()
    expect(closeMenuBtn.textContent).toBe('')

    // When mobile menu is open, the progress bar row is rendered in the top header
    expect(screen.getByLabelText('Level 1 Badge')).toBeInTheDocument()
    expect(screen.getByLabelText('Next Level 2 Badge')).toBeInTheDocument()
  })

  it('renders mobile menu as full-screen portal modal with body scroll locked', async () => {
    render(<HUDSidebar />)

    const mobileMenuBtn = screen.getByRole('button', { name: /Open HUD Menu/i })
    fireEvent.click(mobileMenuBtn)

    const dialog = screen.getByRole('dialog', { name: /Navigation Menu/i })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveClass('fixed', 'inset-x-0', 'bottom-0', 'top-14', 'w-screen')
    expect(document.body.style.overflow).toBe('hidden')

    // Close via close button
    const closeBtn = screen.getByRole('button', { name: /Close HUD Menu/i })
    fireEvent.click(closeBtn)

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Navigation Menu/i })).not.toBeInTheDocument()
      expect(document.body.style.overflow).toBe('')
    })
  })

  it('closes mobile full-screen menu when Escape key is pressed', async () => {
    render(<HUDSidebar />)

    const mobileMenuBtn = screen.getByRole('button', { name: /Open HUD Menu/i })
    fireEvent.click(mobileMenuBtn)

    expect(screen.getByRole('dialog', { name: /Navigation Menu/i })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Navigation Menu/i })).not.toBeInTheDocument()
    })
  })

  it('navigates and closes mobile menu when nav item inside modal is clicked', async () => {
    render(<HUDSidebar />)

    const mobileMenuBtn = screen.getByRole('button', { name: /Open HUD Menu/i })
    fireEvent.click(mobileMenuBtn)

    const dialog = screen.getByRole('dialog', { name: /Navigation Menu/i })
    expect(dialog).toBeInTheDocument()

    // Find nav buttons inside the dialog
    const codexBtns = screen.getAllByRole('button', { name: /THE SACRED CODEX/i })
    // The second one is inside the mobile dialog
    const mobileCodexBtn = codexBtns[codexBtns.length - 1]
    fireEvent.click(mobileCodexBtn)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/codex' })
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Navigation Menu/i })).not.toBeInTheDocument()
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
    expect(aside?.className).toContain('md:w-[72px]')
    expect(aside?.className).not.toContain('md:w-72')
  })
})
