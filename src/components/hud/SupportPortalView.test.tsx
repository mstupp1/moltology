import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SUPPORT_PAGE_COPY, SUPPORT_TICKET_COPY } from '@/lib/support-tickets'
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
    expect(screen.getByRole('button', { name: new RegExp(SUPPORT_PAGE_COPY.tabChangelog, 'i') })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: new RegExp(`^${SUPPORT_PAGE_COPY.tabFaq}$`, 'i') })).toBeInTheDocument()
    expect(screen.getAllByText(SUPPORT_TICKET_COPY.formTitle).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: new RegExp(SUPPORT_PAGE_COPY.tabDiagnostics, 'i') })).toBeInTheDocument()
    expect(screen.getByTestId('support-ticket-form-stub')).toBeInTheDocument()
    expect(screen.queryByText(LORE)).not.toBeInTheDocument()
  })

  it('renames changelog, FAQ, and diagnostics panels without lore', () => {
    renderPortal()

    fireEvent.click(screen.getByRole('button', { name: new RegExp(SUPPORT_PAGE_COPY.tabChangelog, 'i') }))
    expect(screen.getByText(SUPPORT_PAGE_COPY.changelogEmpty)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${SUPPORT_PAGE_COPY.tabFaq}$`, 'i') }))
    expect(screen.getByRole('heading', { name: SUPPORT_PAGE_COPY.faqTitle })).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_PAGE_COPY.faqHint)).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_PAGE_COPY.faqStartTitle)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: new RegExp(SUPPORT_PAGE_COPY.tabDiagnostics, 'i') }))
    expect(screen.getByRole('heading', { name: SUPPORT_PAGE_COPY.diagnosticsTitle })).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_PAGE_COPY.diagnosticsDatabase)).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_PAGE_COPY.diagnosticsAuth)).toBeInTheDocument()
    expect(screen.queryByText(/neon|tanstack|nitro|jwks/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: new RegExp(SUPPORT_TICKET_COPY.formTitle, 'i') }))
    expect(screen.getByTestId('support-ticket-form-stub')).toBeInTheDocument()
    expect(screen.queryByText(LORE)).not.toBeInTheDocument()
  })
})
