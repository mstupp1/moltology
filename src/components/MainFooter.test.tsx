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

    expect(screen.getByText('Moltmaxxing')).toBeInTheDocument()
    expect(screen.getByText('Field Manual')).toBeInTheDocument()
    expect(screen.getByText('QUIZ')).toBeInTheDocument()
    expect(screen.getByText('NEWS')).toBeInTheDocument()
    expect(screen.getByText('Codex')).toBeInTheDocument()
    expect(screen.getByText('Company')).toBeInTheDocument()
  })

  it('renders external merch store, social channels, and RSS feed', () => {
    render(<MainFooter />)

    const storeLink = screen.getByText('Store').closest('a')
    expect(storeLink).toHaveAttribute('href', 'https://www.etsy.com/shop/SaasTrash')
    expect(storeLink).toHaveAttribute('target', '_blank')

    const instagramLink = screen.getByText('Instagram').closest('a')
    expect(instagramLink).toHaveAttribute('href', 'https://www.instagram.com/moltology_org/')

    const youtubeLink = screen.getByText('YouTube').closest('a')
    expect(youtubeLink).toHaveAttribute('href', 'https://www.youtube.com/@Moltology')

    const rssLink = screen.getByText('RSS feed').closest('a')
    expect(rssLink).toHaveAttribute('href', '/rss.xml')
  })

  it('links the tip jar as a plain outbound link', () => {
    render(<MainFooter />)

    const tipLink = screen.getByText('BUY US A COFFEE').closest('a')
    expect(tipLink).toHaveAttribute('href', 'https://buymeacoffee.com/moltology')
    expect(tipLink).toHaveAttribute('target', '_blank')
    expect(tipLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('points STORE at the on-site catalog for admins', () => {
    storeAccess = { canView: true, pending: false }
    render(<MainFooter />)
    const storeLink = screen.getByText('Store').closest('a')
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
