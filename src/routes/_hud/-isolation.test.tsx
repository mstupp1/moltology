import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Route } from './isolation'
import { authClient } from '@/lib/auth-client'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

describe('Isolation HUD Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders guest lock screen when unauthenticated', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText('ISOLATION PROTOCOLS LOCKED')).toBeInTheDocument()
    expect(screen.getByText('RESTRICTED ACCESS')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SIGN UP TO UNLOCK/i })).toBeInTheDocument()
  })

  it('renders full-height video feed and controls when authenticated', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText('ISOLATION PROTOCOLS')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pause feed/i })).toBeInTheDocument()
    expect(screen.queryByText(/Continuous video feed\./i)).not.toBeInTheDocument()
  })

  it('opens Settings modal when clicking SETTINGS button in video controls', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const Component = Route.options.component!
    render(<Component />)

    const settingsBtn = screen.getByRole('button', { name: /open protocol settings/i })
    fireEvent.click(settingsBtn)

    expect(screen.getByText(/ISOLATION SHIELDING & PROTOCOL CONFIGURATION/i)).toBeInTheDocument()
    expect(screen.getByText(/ISOLATION FORCE-FIELD/i)).toBeInTheDocument()
    expect(screen.getByText(/MOLT PRIVACY SHELL/i)).toBeInTheDocument()
  })

  it('handles FORCE PRIVATE action and displays confirmation alert', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const Component = Route.options.component!
    render(<Component />)

    // Open settings modal from video controls
    const settingsBtn = screen.getByRole('button', { name: /open protocol settings/i })
    fireEvent.click(settingsBtn)

    // Trigger FORCE PRIVATE
    const forcePrivateBtn = screen.getByRole('button', { name: /force private/i })
    fireEvent.click(forcePrivateBtn)

    // Verify toast notification appears
    expect(
      screen.getByText(/FORCE PRIVATE ENGAGED: EXTERNAL CONNECTIONS SHROUDED/i)
    ).toBeInTheDocument()
  })
})
