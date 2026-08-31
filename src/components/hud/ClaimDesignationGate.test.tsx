import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { ClaimDesignationGate } from './ClaimDesignationGate'
import { HANDLE_TAKEN_MESSAGE } from '@/lib/member-handle'

const mockClaim = vi.fn()

vi.mock('@/lib/server/api', () => ({
  claimMemberHandleFn: (...args: any[]) => mockClaim(...args),
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-jwt'),
}))

function renderGate(props?: Partial<React.ComponentProps<typeof ClaimDesignationGate>>) {
  const onClaimed = vi.fn()
  const onDefer = vi.fn()
  render(
    <ToastProvider>
      <ClaimDesignationGate
        userId="user-1"
        larvaUnit="LARVA UNIT #2468"
        onClaimed={onClaimed}
        onDefer={onDefer}
        {...props}
      />
    </ToastProvider>,
  )
  return { onClaimed, onDefer }
}

describe('ClaimDesignationGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClaim.mockResolvedValue({ handle: 'claw_lord', displayName: 'claw_lord' })
  })

  it('seals a valid unique designation', async () => {
    const { onClaimed } = renderGate()
    fireEvent.change(screen.getByPlaceholderText('your_designation'), { target: { value: 'claw_lord' } })
    fireEvent.click(screen.getByRole('button', { name: /Seal designation/i }))

    await waitFor(() => {
      expect(mockClaim).toHaveBeenCalledWith({
        data: expect.objectContaining({ handle: 'claw_lord', userId: 'user-1' }),
      })
      expect(onClaimed).toHaveBeenCalledWith('claw_lord')
    })
  })

  it('shows a taken designation instead of coercing it', async () => {
    mockClaim.mockRejectedValue(new Error(HANDLE_TAKEN_MESSAGE))
    renderGate()
    fireEvent.change(screen.getByPlaceholderText('your_designation'), { target: { value: 'claw_lord' } })
    fireEvent.click(screen.getByRole('button', { name: /Seal designation/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(HANDLE_TAKEN_MESSAGE)
    })
  })

  it('lets an existing member remain under the larva unit', () => {
    const { onDefer, onClaimed } = renderGate()
    fireEvent.click(screen.getByRole('button', { name: /Remain under unit designation/i }))
    expect(onDefer).toHaveBeenCalled()
    expect(onClaimed).not.toHaveBeenCalled()
  })
})
