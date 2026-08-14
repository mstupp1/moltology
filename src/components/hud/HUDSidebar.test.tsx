import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HUDSidebar } from './HUDSidebar'
import { authClient } from '@/lib/auth-client'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' }),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null })),
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
    expect(screen.getByText('COMMUNITY & VAULT')).toBeInTheDocument()

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

  it('toggles sidebar collapse rail with shortcut key or collapse button', () => {
    render(<HUDSidebar />)

    const aside = screen.getByRole('complementary')
    expect(aside).toHaveClass('md:w-72')

    const toggleBtn = screen.getByTitle(/Collapse Sidebar/i)
    fireEvent.click(toggleBtn)

    expect(aside).toHaveClass('md:w-[72px]')

    // Press Cmd+B to un-collapse
    fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(aside).toHaveClass('md:w-72')
  })

  it('toggles mobile HUD menu state on mobile button click and renders icon-only with no text', () => {
    render(<HUDSidebar />)

    const mobileMenuBtn = screen.getByRole('button', { name: /Open HUD Menu/i })
    expect(mobileMenuBtn).toBeInTheDocument()
    expect(mobileMenuBtn.textContent).toBe('')

    fireEvent.click(mobileMenuBtn)

    const closeMenuBtn = screen.getByRole('button', { name: /Close HUD Menu/i })
    expect(closeMenuBtn).toBeInTheDocument()
    expect(closeMenuBtn.textContent).toBe('')
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
    })
    expect(document.body.style.overflow).toBe('')
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

  it('collapses mobile top bar when isTopBarHidden is true and menu is closed', () => {
    const { container } = render(<HUDSidebar isTopBarHidden={true} />)
    const mobileBar = container.querySelector('.md\\:hidden')
    expect(mobileBar).toHaveClass('h-0', 'opacity-0', '-translate-y-full')
  })
})
