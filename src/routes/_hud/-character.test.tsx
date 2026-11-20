import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Route } from './character.index'
import { CharacterBand } from '@/components/hud/chassis/CharacterBand'
import { calculateProgression } from '@/lib/progression'
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

vi.mock('@/hooks/useDailyAlignment', () => ({
  useDailyAlignment: () => ({ progression: calculateProgression(600) }),
}))

vi.mock('@/hooks/useWalletBalances', () => ({
  useWalletBalances: (userId: string | null) => (userId ? { gems: 1240, credits: 0, creditsLive: false } : null),
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

    expect(screen.getByTestId('hud-section-ghost')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Save my character/i })).not.toBeInTheDocument()
  })

  it('shows one Character band with the wallet, XP and stage on every tab', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    render(<CharacterBand current="customize" />)

    expect(screen.getByRole('heading', { name: 'Character' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Character sections' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Customize' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/character/shop')
    const stats = screen.getByRole('group', { name: 'Your character' })
    expect(stats).toHaveTextContent('Chitin Gems1,240')
    expect(stats).toHaveTextContent('Molt CreditsSoon')
    expect(stats).toHaveTextContent('600 XP')
    expect(stats).toHaveTextContent('StageL-2')
  })

  it('leaves the wallet out of the band for guests', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
    render(<CharacterBand current="shop" />)

    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByText('Chitin Gems')).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Your character' })).toHaveTextContent('600 XP')
  })

  it('shows Save and Discard on the stage only once there is something to save', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const Component = Route.options.component!
    render(<Component />)

    const surprise = await screen.findByRole('button', { name: 'Surprise me' }, { timeout: 8000 })
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
    surprise.click()
    expect(await screen.findByRole('button', { name: 'Save changes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeInTheDocument()
  })
})
