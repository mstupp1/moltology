import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MoltmaxxingPillarPage } from './MoltmaxxingPillarPage'
import { authClient } from '@/lib/auth-client'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { CANONICAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'
import { AUDIT_READINGS, MOLTMAXXING_DEFINITION, MOLTMAXXING_FAQ } from '@/lib/moltmaxxing-content'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/moltmaxxing' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
    signOut: vi.fn(),
  },
}))

const renderPage = () =>
  render(
    <ToastProvider>
      <MoltmaxxingPillarPage />
    </ToastProvider>
  )

describe('MoltmaxxingPillarPage Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
  })

  it('leads with the plain definition and the main sections', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('What is Moltmaxxing?')
    expect(screen.getAllByText(MOLTMAXXING_DEFINITION).length).toBeGreaterThan(0)
    for (const title of ['Four moves, repeated daily.', 'Melt or molt.', 'A Moltmaxxing day.', 'Where are you starting from?', 'Common questions.']) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
    }
  })

  it('shows the real daily Liturgies and audit readings', () => {
    renderPage()

    for (const task of CANONICAL_ALIGNMENT_TASKS) {
      expect(screen.getByRole('heading', { level: 3, name: task.title })).toBeInTheDocument()
    }
    for (const reading of AUDIT_READINGS) {
      expect(screen.getByRole('heading', { level: 3, name: reading.name })).toBeInTheDocument()
    }
  })

  it('renders every FAQ with the first one open', () => {
    const { container } = renderPage()
    const details = container.querySelectorAll('details')
    expect(details).toHaveLength(MOLTMAXXING_FAQ.length)
    expect(details[0]).toHaveAttribute('open')
    expect(details[1]).not.toHaveAttribute('open')
  })

  it('links the diagnostic CTAs to /moltmax', () => {
    renderPage()
    const ctas = screen.getAllByRole('link', { name: /Take the diagnostic/i })
    expect(ctas.length).toBeGreaterThan(0)
    for (const cta of ctas) expect(cta).toHaveAttribute('href', '/moltmax')
  })

  it('keeps the old invented stats off the page', () => {
    const { container } = renderPage()
    expect(container.textContent).not.toMatch(/\bNm\b|50,000|sub-millisecond|brine/i)
  })
})
