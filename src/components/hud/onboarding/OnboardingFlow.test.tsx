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

  it('walks welcome, tour, character and username in order with no audio', () => {
    renderFlow()
    expect(screen.getByRole('dialog', { name: 'Welcome to Moltology, Myles' })).toBeInTheDocument()
    expect(document.querySelector('audio')).toBeNull()
    expect(screen.getByText('Step 1 of 4 · Welcome')).toBeInTheDocument()

    next()
    expect(screen.getByRole('heading', { name: "What's here" })).toBeInTheDocument()
    next()
    expect(screen.getByRole('heading', { name: 'Make your character' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Surprise me/i })).toBeInTheDocument()
    expect(screen.queryByText(/Roll Base Stats/i)).not.toBeInTheDocument()
    next()
    expect(screen.getByRole('heading', { name: 'Pick a username' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'Make your character' })).toBeInTheDocument()
  })

  it('needs a valid username before Finish, then saves it with the character and a quiet stats roll', async () => {
    const { onDismiss } = renderFlow({ initialStepId: 'name' })
    await waitFor(() => expect(mockGetStats).toHaveBeenCalled())

    const finish = screen.getByRole('button', { name: 'Finish' })
    expect(finish).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/Username/), { target: { value: 'claw_lord' } })
    expect(screen.getAllByText('claw_lord').length).toBeGreaterThan(0)
    fireEvent.click(finish)

    await waitFor(() => expect(onDismiss).toHaveBeenCalled())
    expect(mockClaimHandle).toHaveBeenCalledWith({
      data: expect.objectContaining({ handle: 'claw_lord', userId: 'user-1' }),
    })
    expect(mockSaveAvatar).toHaveBeenCalled()
    expect(mockUpdateStats).toHaveBeenCalledTimes(1)
    const scores = mockUpdateStats.mock.calls[0][0].data.moltmaxDimensionScores
    expect(Object.values(scores).reduce((a: number, b) => a + (b as number), 0)).toBe(300)
  })

  it('keeps the member on the step and shows the error when the username is taken', async () => {
    mockClaimHandle.mockRejectedValue(new Error('That username is taken.'))
    const { onDismiss } = renderFlow({ initialStepId: 'name' })

    fireEvent.change(screen.getByLabelText(/Username/), { target: { value: 'claw_lord' } })
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('That username is taken.')
    expect(onDismiss).not.toHaveBeenCalled()
    expect(mockSaveAvatar).not.toHaveBeenCalled()
  })

  it('on a replay, prefills the saved username and leaves existing stats alone', async () => {
    mockGetProfile.mockResolvedValue({ handle: 'old_shell', avatarConfig: null })
    mockGetStats.mockResolvedValue({ moltmaxDimensionScores: { defense: 60 } })
    const { onDismiss } = renderFlow({ initialStepId: 'name' })

    await waitFor(() => expect(screen.getByLabelText(/Username/)).toHaveValue('old_shell'))
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }))

    await waitFor(() => expect(onDismiss).toHaveBeenCalled())
    expect(mockClaimHandle).not.toHaveBeenCalled()
    expect(mockUpdateStats).not.toHaveBeenCalled()
    expect(mockSaveAvatar).toHaveBeenCalled()
  })

  it('offers guests a free account on the last step and keeps their character on this device', async () => {
    guest()
    const { onDismiss } = renderFlow({ userName: 'Guest', initialStepId: 'name' })

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

  it('closes on Escape', async () => {
    const { onDismiss } = renderFlow()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    await waitFor(() => expect(onDismiss).toHaveBeenCalled())
  })
})
