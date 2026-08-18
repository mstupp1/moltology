import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Route } from './chassis'
import { authClient } from '@/lib/auth-client'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

describe('Chassis Configurator HUD Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders guest lock screen when unauthenticated', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText('CHASSIS CONFIGURATOR LOCKED')).toBeInTheDocument()
    expect(screen.getByText('RESTRICTED ACCESS')).toBeInTheDocument()
    expect(
      screen.getByText('The BioForge avatar customizer and chassis plating generator require an authorized initiate account.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SIGN UP TO UNLOCK/i })).toBeInTheDocument()
  })

  it('renders BioForge avatar studio when authenticated', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText('MOLTMAXXING & BIO-FORGE AVATAR STUDIO')).toBeInTheDocument()
    expect(screen.getByText('CARCINIZATION & COSMETIC TRANSMUTATION')).toBeInTheDocument()
    expect(screen.getAllByText('STAGE 4: HIGH ASCENDANT').length).toBeGreaterThanOrEqual(1)
  })
})
