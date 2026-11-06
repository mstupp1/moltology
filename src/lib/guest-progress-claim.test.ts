import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOLTMAX_QUESTIONS, computeMoltmaxResult } from './moltmax-quiz'
import { readGuestProgress, requestGuestAuditSave, saveGuestAudit } from './guest-progress'
import { GUEST_AUDIT_CLAIMED_EVENT } from './guest-progress-key'

const mockUpdateUserStats = vi.hoisted(() => vi.fn())
const mockToken = vi.hoisted(() => vi.fn())
vi.mock('./server/api', () => ({ updateUserStatsFn: mockUpdateUserStats }))
vi.mock('./jwt', () => ({ getAuthJWTToken: mockToken }))

import { claimGuestAudit } from './guest-progress-claim'

const answers = Object.fromEntries(MOLTMAX_QUESTIONS.map((q) => [q.id, q.options[q.options.length - 1].id]))

describe('claimGuestAudit', () => {
  beforeEach(() => {
    localStorage.clear()
    mockUpdateUserStats.mockReset()
    mockToken.mockReset().mockResolvedValue('jwt')
  })

  it('does nothing without a stored audit', async () => {
    expect(await claimGuestAudit()).toBe('none')
    expect(mockUpdateUserStats).not.toHaveBeenCalled()
  })

  it('saves a recomputed score only if the account has no audit, then clears it', async () => {
    saveGuestAudit(answers)
    mockUpdateUserStats.mockResolvedValue({ userId: 'u1' })
    const onClaimed = vi.fn()
    window.addEventListener(GUEST_AUDIT_CLAIMED_EVENT, onClaimed)

    expect(await claimGuestAudit()).toBe('saved')
    const expected = computeMoltmaxResult(answers)
    expect(mockUpdateUserStats).toHaveBeenCalledWith({
      data: { moltmaxScore: expected.score, moltmaxDimensionScores: expected.dimensionScores, onlyIfNoAudit: true, token: 'jwt' },
    })
    expect(readGuestProgress().audit).toBeUndefined()
    expect(onClaimed).toHaveBeenCalledTimes(1)
    window.removeEventListener(GUEST_AUDIT_CLAIMED_EVENT, onClaimed)
  })

  it('replaces an older audit when the guest asked to save', async () => {
    saveGuestAudit(answers)
    requestGuestAuditSave()
    mockUpdateUserStats.mockResolvedValue({ userId: 'u1' })
    await claimGuestAudit()
    expect(mockUpdateUserStats.mock.calls[0][0].data.onlyIfNoAudit).toBe(false)
  })

  it('reports an existing audit kept and clears the guest copy', async () => {
    saveGuestAudit(answers)
    mockUpdateUserStats.mockResolvedValue(undefined)
    expect(await claimGuestAudit()).toBe('kept-existing')
    expect(readGuestProgress().audit).toBeUndefined()
  })

  it('keeps the guest copy when there is no token or the request fails', async () => {
    saveGuestAudit(answers)
    mockToken.mockResolvedValue(null)
    expect(await claimGuestAudit()).toBe('none')
    mockToken.mockResolvedValue('jwt')
    mockUpdateUserStats.mockRejectedValue(new Error('offline'))
    await expect(claimGuestAudit()).rejects.toThrow('offline')
    expect(readGuestProgress().audit).toBeDefined()
  })
})
