import React, { act } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { authClient } from '@/lib/auth-client'
import { WelcomeInitiateHero } from './WelcomeInitiateHero'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

describe('WelcomeInitiateHero Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
  })

  it('renders the simplified serene welcome initiate section in guest mode with free notice and red sign up button', () => {
    render(<WelcomeInitiateHero />)

    // Heading exists
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/WELCOME,\s+INITIATE/i)

    // Inspiring message is rendered
    expect(
      screen.getByText(/In the quiet depths beneath the surface noise, true clarity emerges/i)
    ).toBeInTheDocument()

    // Verify stats and excessive metric noise are removed
    expect(screen.queryByText(/LARVA #8971/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/CONVERSION/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/PINCER TORQUE/i)).not.toBeInTheDocument()

    // Subtle refresh icon button exists
    expect(screen.getByRole('button', { name: /Next inspiring message/i })).toBeInTheDocument()

    // Guest Hub 100% Free text and Sign Up button are rendered on right
    expect(screen.getByText(/100% Free/i)).toBeInTheDocument()
    const ctaButton = screen.getByRole('button', { name: /SIGN UP/i })
    expect(ctaButton).toBeInTheDocument()

    // Clicking CTA opens modal
    fireEvent.click(ctaButton)
    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument()
  })

  it('hides the guest CTA button when user is authenticated', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-123', name: 'Commander Pinch' } },
    } as any)

    render(<WelcomeInitiateHero />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/WELCOME,\s+INITIATE/i)
    expect(screen.queryByRole('button', { name: /SIGN UP/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/100% Free/i)).not.toBeInTheDocument()
  })

  it('holds the sign up CTA while the session is unresolved', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: true } as any)
    render(<WelcomeInitiateHero />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/WELCOME,\s+INITIATE/i)
    expect(screen.queryByRole('button', { name: /SIGN UP/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/100% Free/i)).not.toBeInTheDocument()
  })

  it('cycles inspiring wisdom messages when clicking subtle refresh button', async () => {
    vi.useFakeTimers()
    render(<WelcomeInitiateHero />)

    const refreshBtn = screen.getByRole('button', { name: /Next inspiring message/i })
    expect(refreshBtn).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(refreshBtn)
      vi.advanceTimersByTime(250)
    })

    expect(
      screen.getByText(/The ocean floor does not rush to meet the tide/i)
    ).toBeInTheDocument()

    vi.useRealTimers()
  })
})
