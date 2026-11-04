import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReferralPanel } from './ReferralPanel'

const { load, toast } = vi.hoisted(() => ({ load: vi.fn(), toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/server/api', () => ({ getReferralSummaryFn: load }))
vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn().mockResolvedValue('token') }))
vi.mock('@/components/ui/ToastProvider', () => ({ useToast: () => ({ toast }) }))
const writeText = vi.fn(), nativeShare = vi.fn()
const summary = { userId: 'inviter', rewardedThisMonth: 1, totalXp: 100, referrals: [
  { id: '1', displayName: 'new_member', status: 'pending' },
  { id: '2', displayName: 'active_member', status: 'rewarded' },
  { id: '3', displayName: 'another_member', status: 'cap_reached' },
] }
beforeEach(() => {
  vi.resetAllMocks()
  load.mockResolvedValue(summary)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
})
describe('referral sharing', () => {
  it('copies the invitation and shows real rewards and referral states', async () => {
    render(<ReferralPanel />)
    await screen.findByText('1 of 5 rewards this month · 100 referral XP earned')
    fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/i/inviter`))
    expect(screen.getByText('Pending', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('+100 XP', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Qualified · monthly limit reached', { exact: true })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()
  })
  it('opens native sharing and treats cancellation as a normal action', async () => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: nativeShare })
    nativeShare.mockRejectedValue(new DOMException('Cancelled', 'AbortError'))
    render(<ReferralPanel />)
    await screen.findByText('1 of 5 rewards this month · 100 referral XP earned')
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    await waitFor(() => expect(nativeShare).toHaveBeenCalledWith({
      title: 'Join me on Moltology', text: 'Add me as a friend after signing up.', url: `${window.location.origin}/i/inviter`,
    }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Share' })).not.toBeDisabled())
    expect(toast.error).not.toHaveBeenCalled()
  })
  it('retries failed reads and never presents failed data as zero rewards', async () => {
    load.mockRejectedValueOnce(new Error('unavailable'))
    render(<ReferralPanel />)
    await screen.findByText('Could not load invitations.')
    expect(screen.queryByText('0 of 5 rewards this month · 0 referral XP earned')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByText('1 of 5 rewards this month · 100 referral XP earned')
  })
})
