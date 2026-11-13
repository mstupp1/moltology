import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Route } from './character'
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
    totals: { shellHardness: 0, pincerTorque: 0, neuralLatency: 0, ecdysisDiscipline: 0, depthTolerance: 0 },
    vaultSize: 20,
    config: { style: 'critters', seed: 'saved', race: 'lobster' },
    appearanceRevision: 1,
  }),
  saveCharacterFn: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

vi.mock('@/components/hud/avatar/AvatarCreatorPreview', () => ({
  AvatarCreatorPreview: () => <div data-testid="preview" />,
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

  it('lets guests edit the starter character and asks them to sign up to save it', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(
      await screen.findByRole('button', { name: /Save my character/i }, { timeout: 8000 }),
    ).toBeInTheDocument()
    expect(screen.queryByText('CHARACTER LOCKED')).not.toBeInTheDocument()
    const { getChassisLoadoutFn } = await import('@/lib/server/api')
    expect(getChassisLoadoutFn).toHaveBeenCalledWith({ data: {} })
  })

  it('holds the workspace skeleton for the first-paint empty session shape', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByTestId('hud-workspace-ghost')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Save my character/i })).not.toBeInTheDocument()
  })

  it('renders chassis status page when authenticated', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const Component = Route.options.component!
    render(<Component />)

    const sections = await screen.findByRole('navigation', { name: 'Character sections' })
    expect(sections).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Customize' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/character/shop')
  })
})
