import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OnboardingFlow, greetingName } from './OnboardingFlow'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { authClient } from '@/lib/auth-client'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    getSession: vi.fn(() => Promise.resolve({ data: null })),
  },
}))

const mockSaveAvatar = vi.fn()
const mockUpdateStats = vi.fn()
const mockClaimHandle = vi.fn()
const mockGetProfile = vi.fn()
const mockGetStats = vi.fn()

vi.mock('@/lib/server/api', () => ({
  saveLobsterAvatarFn: (...args: any[]) => mockSaveAvatar(...args),
  updateUserStatsFn: (...args: any[]) => mockUpdateStats(...args),
  claimMemberHandleFn: (...args: any[]) => mockClaimHandle(...args),
  getUserProfileFn: (...args: any[]) => mockGetProfile(...args),
  getUserStatsFn: (...args: any[]) => mockGetStats(...args),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-jwt-token'),
}))

vi.mock('@/components/AuthModal', () => ({
  AuthModal: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Sign up">
      <button onClick={onClose}>Close sign up</button>
    </div>
  ),
}))

const signedIn = (id = 'user-1', name = 'Myles Stupp') =>
  vi.mocked(authClient.useSession).mockReturnValue({ data: { user: { id, name } }, isPending: false } as any)
const guest = () => vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)

const renderFlow = (props: Partial<React.ComponentProps<typeof OnboardingFlow>> = {}) => {
  const onDismiss = vi.fn()
  render(
    <ToastProvider>
      <OnboardingFlow userName="Myles Stupp" onDismiss={onDismiss} {...props} />
    </ToastProvider>,
  )
  return { onDismiss }
}

const next = () => fireEvent.click(screen.getByRole('button', { name: /^(Next|Get started)$/ }))

describe('OnboardingFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockSaveAvatar.mockResolvedValue({ success: true })
    mockUpdateStats.mockResolvedValue({})
    mockClaimHandle.mockResolvedValue({ handle: 'claw_lord' })
    mockGetProfile.mockResolvedValue({ handle: null, avatarConfig: null })
    mockGetStats.mockResolvedValue(null)
    signedIn()
  })

  it('greets by first name and skips placeholder names', () => {
    expect(greetingName('Myles Stupp')).toBe('Myles')
    expect(greetingName('Initiate')).toBeNull()
    expect(greetingName('Guest')).toBeNull()
    expect(greetingName('someone@example.com')).toBeNull()
  })

  it('walks members through welcome, tour, username and character, in that order, with no audio', async () => {
    renderFlow()
    expect(screen.getByRole('dialog', { name: 'Welcome to Moltology, Myles' })).toBeInTheDocument()
    expect(document.querySelector('audio')).toBeNull()
    expect(screen.getByText('Step 1 of 4 · Welcome')).toBeInTheDocument()

    next()
    expect(screen.getByRole('heading', { name: "What's here" })).toBeInTheDocument()
    next()
    expect(screen.getByRole('heading', { name: 'Pick a username' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/Username/), { target: { value: 'claw_lord' } })
    next()
    expect(await screen.findByRole('heading', { name: 'Make your character' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Surprise me/i })).toBeInTheDocument()
    expect(screen.queryByText(/Roll Base Stats/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'Pick a username' })).toBeInTheDocument()
  })

  it('claims the username on Next, then saves the character and a quiet stats roll on Finish', async () => {
    const { onDismiss } = renderFlow({ initialStepId: 'username' })
    await waitFor(() => expect(mockGetStats).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/Username/), { target: { value: 'claw_lord' } })
    next()

    await screen.findByRole('heading', { name: 'Make your character' })
    expect(mockClaimHandle).toHaveBeenCalledWith({
      data: expect.objectContaining({ handle: 'claw_lord', userId: 'user-1' }),
    })
    expect(mockSaveAvatar).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Finish' }))
    await waitFor(() => expect(onDismiss).toHaveBeenCalled())
    expect(mockSaveAvatar).toHaveBeenCalled()
    expect(mockUpdateStats).toHaveBeenCalledTimes(1)
    const scores = mockUpdateStats.mock.calls[0][0].data.moltmaxDimensionScores
    expect(Object.values(scores).reduce((a: number, b) => a + (b as number), 0)).toBe(300)
  })

  it('keeps the member on the username step and shows the error when the name is taken', async () => {
    mockClaimHandle.mockRejectedValue(new Error('That username is taken.'))
    renderFlow({ initialStepId: 'username' })

    fireEvent.change(screen.getByLabelText(/Username/), { target: { value: 'claw_lord' } })
    next()

    expect(await screen.findByRole('alert')).toHaveTextContent('That username is taken.')
    expect(screen.getByRole('heading', { name: 'Pick a username' })).toBeInTheDocument()
  })

  it('on a replay, prefills the saved username and leaves existing stats alone', async () => {
    mockGetProfile.mockResolvedValue({ handle: 'old_shell', avatarConfig: null })
    mockGetStats.mockResolvedValue({ moltmaxDimensionScores: { defense: 60 } })
    const { onDismiss } = renderFlow({ initialStepId: 'username' })

    await waitFor(() => expect(screen.getByLabelText(/Username/)).toHaveValue('old_shell'))
    next()
    await screen.findByRole('heading', { name: 'Make your character' })
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }))

    await waitFor(() => expect(onDismiss).toHaveBeenCalled())
    expect(mockClaimHandle).not.toHaveBeenCalled()
    expect(mockUpdateStats).not.toHaveBeenCalled()
    expect(mockSaveAvatar).toHaveBeenCalled()
  })

  it('skips the username step for guests and ends on a free account offer', async () => {
    guest()
    const { onDismiss } = renderFlow({ userName: 'Guest' })

    next()
    next()
    expect(screen.getByRole('heading', { name: 'Make your character' })).toBeInTheDocument()
    next()
    expect(screen.getByRole('heading', { name: 'Keep your character' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/Username/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sign up free' }))
    expect(screen.getByRole('dialog', { name: 'Sign up' })).toBeInTheDocument()
    expect(localStorage.getItem('moltology:avatar_config:guest')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Close sign up' }))
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    await waitFor(() => expect(onDismiss).toHaveBeenCalled())
    expect(mockSaveAvatar).not.toHaveBeenCalled()
  })

  it('moves a guest who signs up on the last step on to the username step', () => {
    guest()
    const view = render(
      <ToastProvider>
        <OnboardingFlow userName="Guest" onDismiss={vi.fn()} initialStepId="keep" />
      </ToastProvider>,
    )
    expect(screen.getByRole('heading', { name: 'Keep your character' })).toBeInTheDocument()

    signedIn('user-2', 'Initiate')
    view.rerender(
      <ToastProvider>
        <OnboardingFlow userName="Initiate" onDismiss={vi.fn()} initialStepId="keep" />
      </ToastProvider>,
    )
    expect(screen.getByRole('heading', { name: 'Pick a username' })).toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const { onDismiss } = renderFlow()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    await waitFor(() => expect(onDismiss).toHaveBeenCalled())
  })
})
