import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WhatIsMoltologySubnav } from './WhatIsMoltologySubnav'
import {
  PublicHeaderChromeProvider,
  useRegisterPublicHeaderChrome,
} from '@/components/public-header-chrome'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: '/what-is-moltology/beliefs' }),
}))

function ChromeHarness({
  height,
  visible,
}: {
  height: number
  visible: boolean
}) {
  useRegisterPublicHeaderChrome({ height, visible })
  return <WhatIsMoltologySubnav />
}

describe('WhatIsMoltologySubnav', () => {
  it('sits under the header when it is visible and docks to the top when it hides', () => {
    const { rerender } = render(
      <PublicHeaderChromeProvider>
        <ChromeHarness height={88} visible />
      </PublicHeaderChromeProvider>,
    )

    const nav = screen.getByRole('navigation', { name: /about moltology sections/i })
    expect(nav).toHaveStyle({ transform: 'translateY(88px)' })
    expect(nav.className).toContain('fixed')
    expect(nav.className).not.toContain('top-[4.5rem]')

    rerender(
      <PublicHeaderChromeProvider>
        <ChromeHarness height={88} visible={false} />
      </PublicHeaderChromeProvider>,
    )

    expect(screen.getByRole('navigation', { name: /about moltology sections/i })).toHaveStyle({
      transform: 'translateY(0px)',
    })
  })

  it('marks the active section and gives each tab a 44px hit target', () => {
    render(
      <PublicHeaderChromeProvider>
        <ChromeHarness height={64} visible />
      </PublicHeaderChromeProvider>,
    )

    const beliefs = screen.getByRole('link', { name: /beliefs & codes/i })
    expect(beliefs).toHaveAttribute('aria-current', 'page')
    expect(beliefs.className).toContain('min-h-11')
  })
})