import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { authClient } from '@/lib/auth-client'
import { getAuthJWTToken } from '@/lib/jwt'
import { createSupportTicketFn } from '@/lib/server/api'
import { SUPPORT_TICKET_COPY } from '@/lib/support-tickets'
import SupportTicketForm from './SupportTicketForm'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-jwt'),
}))

vi.mock('@/lib/server/api', () => ({
  createSupportTicketFn: vi.fn(),
}))

vi.mock('@/components/TurnstileWidget', () => ({
  TurnstileWidget: React.forwardRef(({ onVerify }: { onVerify?: (token: string) => void }, _ref) => {
    React.useEffect(() => {
      onVerify?.('turnstile-ok')
    }, [onVerify])
    return <div data-testid="turnstile-widget" />
  }),
}))

vi.mock('@/components/AuthModal', () => ({
  AuthModal: () => null,
}))

function renderForm() {
  return render(
    <ToastProvider>
      <SupportTicketForm />
    </ToastProvider>,
  )
}

describe('SupportTicketForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthJWTToken).mockResolvedValue('mock-jwt')
  })

  it('shows an honest sealed state for guests instead of a fake form', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
    renderForm()

    expect(screen.getByTestId('support-ticket-guest')).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_TICKET_COPY.guestTitle)).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_TICKET_COPY.guestBody)).toBeInTheDocument()
    expect(screen.queryByTestId('support-ticket-form')).not.toBeInTheDocument()
  })

  it('submits a signed-in ticket and shows the received reference', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'usr-1', email: 'claw@moltology.org' } },
      isPending: false,
    } as any)
    vi.mocked(createSupportTicketFn).mockResolvedValue({
      success: true,
      ticketId: 'ticket-42',
      ticketReference: 'ticket-42',
    })

    renderForm()

    fireEvent.change(screen.getByLabelText(SUPPORT_TICKET_COPY.subjectLabel), {
      target: { value: 'Chassis freeze' },
    })
    fireEvent.change(screen.getByLabelText(SUPPORT_TICKET_COPY.bodyLabel), {
      target: { value: 'The vault would not open after a greaves swap.' },
    })
    fireEvent.submit(screen.getByTestId('support-ticket-form'))

    await waitFor(() => {
      expect(createSupportTicketFn).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subject: 'Chassis freeze',
          body: 'The vault would not open after a greaves swap.',
          userId: 'usr-1',
          token: 'mock-jwt',
          turnstileToken: 'turnstile-ok',
        }),
      })
    })

    const success = screen.getByTestId('support-ticket-success')
    expect(success).toBeInTheDocument()
    expect(success).toHaveTextContent(SUPPORT_TICKET_COPY.successTitle)
    expect(screen.getByTestId('support-ticket-reference')).toHaveTextContent('ticket-42')
  })
})
