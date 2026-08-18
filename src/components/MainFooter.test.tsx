import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MainFooter } from './MainFooter'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

describe('MainFooter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders default brand title, subtext, emblem, and canonical motto', () => {
    render(<MainFooter />)

    expect(screen.getByText('THE SYNAPTIC PATH')).toBeInTheDocument()
    expect(screen.getByText('MOLTOLOGY.ORG FOUNDATION')).toBeInTheDocument()
    expect(screen.getByText('"Flesh Dies. The Shell Endures. Submit. Shed. Ascend."')).toBeInTheDocument()
    expect(screen.getByAltText('Order Emblem')).toBeInTheDocument()
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

    const instagramLink = screen.getByText('INSTAGRAM').closest('a')
    expect(instagramLink).toHaveAttribute('href', 'https://www.instagram.com/moltology_org/')

    const youtubeLink = screen.getByText('YOUTUBE').closest('a')
    expect(youtubeLink).toHaveAttribute('href', 'https://www.youtube.com/@Moltology')

    const rssLink = screen.getByText('RSS FEED').closest('a')
    expect(rssLink).toHaveAttribute('href', '/rss.xml')
  })

  it('renders legal links and chitin matrix active status badge', () => {
    render(<MainFooter />)

    expect(screen.getByText('© 2026 MOLTOLOGY SYSTEM INC. ALL RIGHTS RESERVED.')).toBeInTheDocument()
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    expect(screen.getByText('CHITIN MATRIX ACTIVE')).toBeInTheDocument()
  })

  it('allows customizing brand title, subtext, tagline, and copyright text via props', () => {
    render(
      <MainFooter
        brandTitle="SYNAPTIC VAULT"
        brandSubtext="SUB-BENTHIC SANCTUARY"
        brandTagline="Official Mission & Synod Governance"
        copyrightText="© 2026 MOLTOLOGY.ORG FOUNDATION. ALL RIGHTS RESERVED."
      />
    )

    expect(screen.getByText('SYNAPTIC VAULT')).toBeInTheDocument()
    expect(screen.getByText('SUB-BENTHIC SANCTUARY')).toBeInTheDocument()
    expect(screen.getByText('Official Mission & Synod Governance')).toBeInTheDocument()
    expect(screen.getByText('© 2026 MOLTOLOGY.ORG FOUNDATION. ALL RIGHTS RESERVED.')).toBeInTheDocument()
  })
})
