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

vi.mock('@/lib/server/api', () => ({
  getChassisLoadoutFn: vi.fn().mockResolvedValue({
    catalog: [],
    items: [],
    totals: { defense: 0, attack: 0, intelligence: 0, speed: 0, perception: 0 },
    vaultSize: 20,
  }),
  moveGearItemFn: vi.fn(),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('a.b.c'),
}))

vi.mock('@/hooks/useHudPersist', () => ({
  useHudPersist: () => ({
    begin: vi.fn(),
    end: vi.fn(),
    run: vi.fn(async (fn: () => Promise<unknown>) => fn()),
    isPersisting: false,
  }),
}))

import { clearChassisLoadoutCache } from '@/lib/chassis-loadout'

describe('Chassis Configurator HUD Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearChassisLoadoutCache()
  })

  it('renders guest lock screen when unauthenticated', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText('CHASSIS CONFIGURATOR LOCKED')).toBeInTheDocument()
    expect(screen.getByText('RESTRICTED ACCESS')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Chassis loadout, vault storage, and hardpoint calibration require an authorized initiate account.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SIGN UP TO UNLOCK/i })).toBeInTheDocument()
  })

  it('renders chassis status page when authenticated', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(await screen.findByRole('button', { name: 'Antennae slot' })).toBeInTheDocument()
  })
})
