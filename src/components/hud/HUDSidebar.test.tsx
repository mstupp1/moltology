import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('toggles mobile HUD menu state on mobile button click', () => {
    render(<HUDSidebar />)

    const mobileMenuBtn = screen.getByRole('button', { name: /HUD MENU/i })
    fireEvent.click(mobileMenuBtn)

    expect(screen.getByRole('button', { name: /CLOSE/i })).toBeInTheDocument()
  })
})
