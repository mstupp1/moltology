import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { ConnectedAccounts } from './ConnectedAccounts'
import { authClient } from '@/lib/auth-client'

vi.mock('@/lib/auth-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth-config')>()
  return {
    ...actual,
    isGoogleAuthEnabled: () => true,
  }
})

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    listAccounts: vi.fn(),
    linkSocial: vi.fn(),
    unlinkAccount: vi.fn(),
  },
}))

function renderAccounts(oauthError?: string) {
  return render(
    <ToastProvider>
      <ConnectedAccounts oauthError={oauthError} />
    </ToastProvider>,
  )
}

describe('ConnectedAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authClient.listAccounts).mockResolvedValue({
      data: [
        { id: 'acc-email', providerId: 'credential' },
        { id: 'acc-google', providerId: 'google' },
      ],
      error: null,
    } as any)
  })

  it('lists connected methods and disconnects Google when another method remains', async () => {
    vi.mocked(authClient.unlinkAccount).mockResolvedValue({ data: { status: true }, error: null } as any)
    vi.mocked(authClient.listAccounts)
      .mockResolvedValueOnce({
        data: [
          { id: 'acc-email', providerId: 'credential' },
          { id: 'acc-google', providerId: 'google' },
        ],
        error: null,
      } as any)
      .mockResolvedValueOnce({
        data: [{ id: 'acc-email', providerId: 'credential' }],
        error: null,
      } as any)

    renderAccounts()

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument()
    })

    expect(screen.getByText('Email and password')).toBeInTheDocument()
    expect(screen.getAllByText('Connected').length).toBeGreaterThanOrEqual(2)

    fireEvent.click(screen.getByRole('button', { name: /disconnect google/i }))

    await waitFor(() => {
      expect(authClient.unlinkAccount).toHaveBeenCalledWith({
        providerId: 'google',
        accountId: 'acc-google',
      })
    })
    expect(await screen.findByText('Google disconnected.')).toBeInTheDocument()
  })

  it('connects Google when it is not linked', async () => {
    vi.mocked(authClient.listAccounts).mockResolvedValue({
      data: [{ id: 'acc-email', providerId: 'credential' }],
      error: null,
    } as any)
    vi.mocked(authClient.linkSocial).mockResolvedValue({ data: { redirect: true }, error: null } as any)

    renderAccounts()

    const connect = await screen.findByRole('button', { name: /connect google/i })
    fireEvent.click(connect)

    await waitFor(() => {
      expect(authClient.linkSocial).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: expect.stringMatching(/\/settings$/),
        errorCallbackURL: expect.stringMatching(/\/settings$/),
      })
    })
  })

  it('keeps Disconnect disabled when Google is the only method', async () => {
    vi.mocked(authClient.listAccounts).mockResolvedValue({
      data: [{ id: 'acc-google', providerId: 'google' }],
      error: null,
    } as any)

    renderAccounts()

    const disconnect = await screen.findByRole('button', { name: /disconnect google/i })
    expect(disconnect).toBeDisabled()
  })

  it('toasts a mapped OAuth link error', async () => {
    renderAccounts('account_not_linked')

    expect(
      await screen.findByText(/An account with this email already exists/i),
    ).toBeInTheDocument()
  })
})
