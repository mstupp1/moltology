import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MainFooter } from './MainFooter'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

let storeAccess = { canView: false, pending: false }

vi.mock('@/hooks/useHiddenPageAccess', () => ({
  useHiddenPageAccess: () => storeAccess,
}))

describe('MainFooter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeAccess = { canView: false, pending: false }
  })

  it('renders default brand title, emblem, and canonical motto', () => {
    render(<MainFooter />)

    expect(screen.getByText('Moltology')).toBeInTheDocument()
    expect(screen.queryByText('MOLTOLOGY.ORG FOUNDATION')).not.toBeInTheDocument()
    expect(screen.getByText('"Flesh Dies. The Shell Endures. Submit. Shed. Ascend."')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Order Emblem' })).toBeInTheDocument()
  })

  it('renders all high-value SEO and tactical HUD chips', () => {
    render(<MainFooter />)

    expect(screen.getByText('MOLTMAXXING')).toBeInTheDocument()
    expect(screen.getByText('FIELD MANUAL')).toBeInTheDocument()
    expect(screen.getByText('MOLTMAX QUIZ')).toBeInTheDocument()
    expect(screen.getByText('DISPATCHES')).toBeInTheDocument()
    expect(screen.getByText('SACRED CODEX')).toBeInTheDocument()
    expect(screen.getByText('ORGANIZATION')).toBeInTheDocument()
  })

  it('renders external merch store, social channels, and RSS feed', () => {
    render(<MainFooter />)

    const storeLink = screen.getByText('STORE').closest('a')
    expect(storeLink).toHaveAttribute('href', 'https://www.etsy.com/shop/SaasTrash')
    expect(storeLink).toHaveAttribute('target', '_blank')

    const instagramLink = screen.getByText('INSTAGRAM').closest('a')
    expect(instagramLink).toHaveAttribute('href', 'https://www.instagram.com/moltology_org/')

    const youtubeLink = screen.getByText('YOUTUBE').closest('a')
    expect(youtubeLink).toHaveAttribute('href', 'https://www.youtube.com/@Moltology')

    const rssLink = screen.getByText('RSS FEED').closest('a')
    expect(rssLink).toHaveAttribute('href', '/rss.xml')
  })

  it('points STORE at the on-site catalog for admins', () => {
    storeAccess = { canView: true, pending: false }
    render(<MainFooter />)
    const storeLink = screen.getByText('STORE').closest('a')
    expect(storeLink).toHaveAttribute('href', '/store')
    expect(storeLink).not.toHaveAttribute('target', '_blank')
  })

  it('renders legal links and copyright', () => {
    render(<MainFooter />)

    expect(screen.getByText('© 2026 MOLTOLOGY SYSTEM INC. ALL RIGHTS RESERVED.')).toBeInTheDocument()
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
  })

  it('allows customizing the tagline and copyright text via props while keeping the standard logo', () => {
    render(
      <MainFooter
        brandTagline="Official Mission & Synod Governance"
        copyrightText="© 2026 MOLTOLOGY.ORG FOUNDATION. ALL RIGHTS RESERVED."
      />
    )

    expect(screen.getByText('Moltology')).toBeInTheDocument()
    expect(screen.getByText('Official Mission & Synod Governance')).toBeInTheDocument()
    expect(screen.getByText('© 2026 MOLTOLOGY.ORG FOUNDATION. ALL RIGHTS RESERVED.')).toBeInTheDocument()
  })

})
