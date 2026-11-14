import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { authClient } from '@/lib/auth-client'
import { getAuthJWTToken } from '@/lib/jwt'
import { createSupportTicketFn } from '@/lib/server/api'
import { SUPPORT_INBOX, SUPPORT_TICKET_BODY_MAX, SUPPORT_TICKET_COPY } from '@/lib/support-tickets'
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

  it('gives guests the support email instead of a fake form', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
    renderForm()

    expect(screen.getByTestId('support-ticket-guest')).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_TICKET_COPY.guestTitle)).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_TICKET_COPY.guestBody)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: SUPPORT_INBOX })).toHaveAttribute('href', `mailto:${SUPPORT_INBOX}`)
    expect(screen.getByText(SUPPORT_TICKET_COPY.guestEmail)).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_TICKET_COPY.guestSignIn)).toBeInTheDocument()
    expect(screen.queryByTestId('support-ticket-form')).not.toBeInTheDocument()
    expect(screen.queryByText(/Benthic|carapace|Dispatch|Transmit|initiate/i)).not.toBeInTheDocument()
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

    // One box: no subject, topic or priority fields.
    expect(screen.getAllByRole('textbox').filter((el) => el.id !== 'support-ticket-bait')).toHaveLength(1)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByLabelText(SUPPORT_TICKET_COPY.bodyLabel)).toHaveAttribute('maxLength', String(SUPPORT_TICKET_BODY_MAX))
    expect(screen.getByTestId('support-ticket-counter')).toHaveTextContent('0 / 1,200')

    fireEvent.change(screen.getByLabelText(SUPPORT_TICKET_COPY.bodyLabel), {
      target: { value: 'The vault would not open after a greaves swap.' },
    })
    expect(screen.getByTestId('support-ticket-counter')).toHaveTextContent('46 / 1,200')
    fireEvent.submit(screen.getByTestId('support-ticket-form'))

    await waitFor(() => {
      expect(createSupportTicketFn).toHaveBeenCalledWith({
        data: expect.objectContaining({
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
