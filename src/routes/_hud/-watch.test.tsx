import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    options: config,
  }),
}))

vi.mock('@/components/hud/GuestLockGuard', () => ({
  GuestLockGuard: ({ featureName }: { featureName?: string }) => (
    <div data-testid="guest-lock">{featureName}</div>
  ),
}))

vi.mock('@/components/forum/CovenantWatchPage', () => ({
  CovenantWatchPage: () => <div data-testid="covenant-watch">Covenant Watch</div>,
}))

import { Route } from './watch'

describe('Covenant Watch route', () => {
  it('gates the steward ledger behind a signed-in shell', () => {
    const Page = Route.options.component!
    render(<Page />)
    expect(screen.getByTestId('guest-lock')).toHaveTextContent('Covenant Watch')
  })
})
