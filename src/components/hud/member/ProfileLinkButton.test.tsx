import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfileLinkButton } from './ProfileLinkButton'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/components/ui/ToastProvider', () => ({ useOptionalToast: () => ({ toast }) }))
const writeText = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
})
describe('profile link sharing', () => {
  it('prefers a readable username link when a username is claimed', async () => {
    writeText.mockResolvedValue(undefined)
    render(<ProfileLinkButton userId="opaque-account-id" handle="mstupp" />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy profile link' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/member/mstupp`))
  })
  it('copies a stable profile link and explains the friend request', async () => {
    writeText.mockResolvedValue(undefined)
    render(<ProfileLinkButton userId="member-1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy profile link' }))
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/member/member-1`)
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('friend request')))
  })
  it('reports clipboard failures without claiming success', async () => {
    writeText.mockRejectedValue(new Error('denied'))
    render(<ProfileLinkButton userId="member-1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy profile link' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(toast.success).not.toHaveBeenCalled()
  })
})
