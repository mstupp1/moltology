import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SUPPORT_PAGE_COPY } from '@/lib/support-tickets'
import SupportPortalView from './SupportPortalView'

vi.mock('./SupportTicketForm', () => ({
  default: () => <div data-testid="support-ticket-form-stub" />,
}))

const LORE = /neural|telemetry|benthic|steward|carapace|chassis|\bpressure\b|critical breach|transmit|dispatch/i

function renderPortal() {
  return render(<SupportPortalView loaderData={{ changelogs: [] }} />)
}

describe('SupportPortalView chrome', () => {
  it('uses plain support headings and tab labels', () => {
    renderPortal()

    expect(screen.getByRole('heading', { level: 1, name: SUPPORT_PAGE_COPY.pageTitle })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: new RegExp(SUPPORT_PAGE_COPY.tabChangelog, 'i') })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: new RegExp(`^${SUPPORT_PAGE_COPY.tabFaq}$`, 'i') })).toBeInTheDocument()
    expect(screen.getAllByText(SUPPORT_PAGE_COPY.tabContact).length).toBeGreaterThan(0)
    expect(screen.queryByRole('tab', { name: 'Diagnostics' })).not.toBeInTheDocument()
    expect(screen.getByTestId('support-ticket-form-stub')).toBeInTheDocument()
    expect(screen.queryByText(LORE)).not.toBeInTheDocument()
  })

  it('renames changelog and FAQ panels without lore', () => {
    renderPortal()

    fireEvent.click(screen.getByRole('tab', { name: new RegExp(SUPPORT_PAGE_COPY.tabChangelog, 'i') }))
    expect(screen.getByText(SUPPORT_PAGE_COPY.changelogEmpty)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: new RegExp(`^${SUPPORT_PAGE_COPY.tabFaq}$`, 'i') }))
    expect(screen.getByRole('heading', { name: SUPPORT_PAGE_COPY.faqTitle })).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_PAGE_COPY.faqHint)).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_PAGE_COPY.faqStartTitle)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: new RegExp(SUPPORT_PAGE_COPY.tabContact, 'i') }))
    expect(screen.getByTestId('support-ticket-form-stub')).toBeInTheDocument()
    expect(screen.queryByText(LORE)).not.toBeInTheDocument()
  })

  it('connects the active panel to tabs and supports keyboard navigation', () => {
    renderPortal()

    const contactTab = screen.getByRole('tab', { name: SUPPORT_PAGE_COPY.tabContact })
    expect(contactTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(SUPPORT_PAGE_COPY.tabContact)

    fireEvent.keyDown(contactTab, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: SUPPORT_PAGE_COPY.tabChangelog })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(SUPPORT_PAGE_COPY.tabChangelog)

    fireEvent.keyDown(document.activeElement!, { key: 'Home' })
    expect(screen.getByRole('tab', { name: SUPPORT_PAGE_COPY.tabChangelog })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(SUPPORT_PAGE_COPY.tabChangelog)
  })


  it('expands and collapses release notes for a dotted version', () => {
    render(<SupportPortalView loaderData={{ changelogs: [{
      version: 'v2.3.4', title: 'Support update', summary: 'Updated support tools.',
      content: 'Release details.', category: 'Improvement', tags: [],
      releasedAt: '2026-11-03T12:00:00Z',
    }] }} />)
    fireEvent.click(screen.getByRole('tab', { name: SUPPORT_PAGE_COPY.tabChangelog }))
    fireEvent.click(screen.getByRole('button', { name: `${SUPPORT_PAGE_COPY.changelogExpand}: Support update` }))
    expect(screen.getByRole('button', { name: `${SUPPORT_PAGE_COPY.changelogCollapse}: Support update` })).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: `${SUPPORT_PAGE_COPY.changelogCollapse}: Support update` }))
    expect(screen.getByRole('button', { name: `${SUPPORT_PAGE_COPY.changelogExpand}: Support update` })).toHaveAttribute('aria-expanded', 'false')
  })

})
