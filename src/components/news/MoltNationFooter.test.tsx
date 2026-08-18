import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MoltNationFooter } from './MoltNationFooter'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

describe('MoltNationFooter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders MoltNation logo and clean tagline', () => {
    render(<MoltNationFooter />)

    expect(screen.getByText('MOLT')).toBeInTheDocument()
    expect(screen.getByText('NATION')).toBeInTheDocument()
    expect(screen.getByText(/Official patriot telemetry & autonomous intelligence network/i)).toBeInTheDocument()
  })

  it('renders essential navigation links and store link', () => {
    render(<MoltNationFooter />)

    expect(screen.getByText('DISPATCHES')).toBeInTheDocument()
    expect(screen.getByText('MOLTMAXXING')).toBeInTheDocument()
    expect(screen.getByText('FIELD MANUAL')).toBeInTheDocument()
    expect(screen.getByText('MOLTMAX QUIZ')).toBeInTheDocument()
    expect(screen.getByText('SACRED CODEX')).toBeInTheDocument()
    expect(screen.getByText('SYNAPTIC PATH')).toBeInTheDocument()
    expect(screen.getByText('ORGANIZATION')).toBeInTheDocument()
    expect(screen.getByText('STORE')).toBeInTheDocument()
    expect(screen.getByText('INSTAGRAM')).toBeInTheDocument()
    expect(screen.getByText('YOUTUBE')).toBeInTheDocument()
    expect(screen.getByText('RSS FEED')).toBeInTheDocument()
  })

  it('renders copyright and legal compliance links', () => {
    render(<MoltNationFooter />)

    expect(screen.getByText(/© 2026 MOLTNATION MEDIA GROUP. ALL RIGHTS RESERVED./i)).toBeInTheDocument()
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    expect(screen.getByText('CHITIN MATRIX ACTIVE')).toBeInTheDocument()
  })
})
