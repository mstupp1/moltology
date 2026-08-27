import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MoltmaxxingPillarPage } from './MoltmaxxingPillarPage'
import { authClient } from '@/lib/auth-client'
import { ToastProvider } from '@/components/ui/ToastProvider'

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

describe('MoltmaxxingPillarPage Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
  })

  it('renders manifesto headline and core sections', () => {
    render(
      <ToastProvider>
        <MoltmaxxingPillarPage />
      </ToastProvider>
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/WHAT IS MOLTMAXXING/i)
    expect(screen.getByText(/The Origin & Philosophy of Moltmaxxing/i)).toBeInTheDocument()
    expect(screen.getByText(/Moltmaxxing vs. Looksmaxxing Matrix/i)).toBeInTheDocument()
    expect(screen.getByText(/You've Heard of Meltmaxxing/i)).toBeInTheDocument()
    expect(screen.getByText(/The 24-Hour Algorithmic Ecdysis Routine/i)).toBeInTheDocument()
    expect(screen.getByText(/The 4 Tiers of Carcinization/i)).toBeInTheDocument()
    expect(screen.getByText(/Frequently Asked Questions/i)).toBeInTheDocument()
  })

  it('toggles FAQ accordion answers', () => {
    render(
      <ToastProvider>
        <MoltmaxxingPillarPage />
      </ToastProvider>
    )

    // First FAQ is open by default
    expect(screen.getByText(/Moltmaxxing is the systematic practice/i)).toBeInTheDocument()

    // Click second FAQ
    const secondFaqQuestion = screen.getByText(/How does Moltmaxxing differ from Looksmaxxing\?/i)
    fireEvent.click(secondFaqQuestion)

    expect(screen.getByText(/Looksmaxxing fixates on superficial soft-tissue cosmetic traits/i)).toBeInTheDocument()
  })

  it('navigates to /moltmax when clicking CTA button', () => {
    render(
      <ToastProvider>
        <MoltmaxxingPillarPage />
      </ToastProvider>
    )

    const ctaBtns = screen.getAllByText(/LAUNCH THE MOLTMAX SCANNER|TEST YOUR BIOMETRICS ON THE LIVE SCANNER/i)
    expect(ctaBtns.length).toBeGreaterThan(0)
    fireEvent.click(ctaBtns[0])
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/moltmax' })
  })
})
