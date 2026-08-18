import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Route } from './subterranean'
import { authClient } from '@/lib/auth-client'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

describe('Subterranean HUD Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders guest lock screen when unauthenticated', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText('SUBTERRANEAN VATS LOCKED')).toBeInTheDocument()
    expect(screen.getByText('RESTRICTED ACCESS')).toBeInTheDocument()
    expect(
      screen.getByText('Subterranean specimen containment vats and biometric telemetry streams require an authorized initiate account.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SIGN UP TO UNLOCK/i })).toBeInTheDocument()
  })

  it('renders full subterranean vats hub when authenticated', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Commander Craw' } },
    } as any)
    const Component = Route.options.component!
    render(<Component />)

    expect(screen.getByText('MUTAGENIC HYBRID RESEARCH CHAMBERS')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE BIO-VAT CONTAINMENT MATRIX')).toBeInTheDocument()
    expect(screen.getByText('LOVECRAFTIAN ARCHIVAL TRANSCRIPTS')).toBeInTheDocument()
  })
})
