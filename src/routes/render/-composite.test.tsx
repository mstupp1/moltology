import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Route } from './composite'
import { authClient } from '@/lib/auth-client'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

// Mock Route.useSearch
const mockSearch = vi.fn()
;(Route as any).useSearch = mockSearch

describe('Composite Studio & Render Engine Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearch.mockReturnValue({
      template: 'marketing-leadmagnet',
      theme: 'moltmaxxing-guide',
      aspect: '4:5',
      mascot: 'lobster_pointing',
      mode: 'preview',
      preview: false,
    })
  })

  it('configures HUDPageLoader as route pendingComponent', () => {
    expect(Route.options.pendingComponent).toBe(HUDPageLoader)
  })

  it('renders HUDPageLoader full screen loader (not ghost components) when session is pending', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: true,
    } as any)

    const Component = Route.options.component!
    render(<Component />)

    // Full screen loader status element must be rendered
    const loader = screen.getByRole('status', { name: /Loading/i })
    expect(loader).toBeInTheDocument()

    // Ensure ghost components are NOT rendered
    expect(screen.queryByTestId('hud-workspace-ghost')).not.toBeInTheDocument()
    expect(screen.queryByText('COMPOSITE STUDIO LOCKED')).not.toBeInTheDocument()
  })

  it('renders guest lock screen when unauthenticated and not bypassed', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any)

    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText('COMPOSITE STUDIO LOCKED')).toBeInTheDocument()
    expect(screen.getByText('RESTRICTED ACCESS')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SIGN UP TO UNLOCK/i })).toBeInTheDocument()
  })

  it('renders CompositeStudioUI when authenticated', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'admin-1', name: 'Master Crab' } },
      isPending: false,
    } as any)

    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText('Composite Studio')).toBeInTheDocument()
    expect(screen.getByText('ADMIN ENGINE')).toBeInTheDocument()
  })

  it('renders raw mode directly for headless capture bypass', () => {
    mockSearch.mockReturnValue({
      template: 'hook',
      aspect: '4:5',
      mascot: 'lobster_thumbs_up',
      mode: 'raw',
      preview: true,
    })

    const Component = Route.options.component!
    const { container } = render(<Component />)

    // Raw mode renders with zero-padding container
    expect(container.querySelector('.w-screen.h-screen')).toBeInTheDocument()
    expect(screen.queryByText('COMPOSITE STUDIO LOCKED')).not.toBeInTheDocument()
  })
})
