import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireStaff = vi.fn()

vi.mock('./admin-oversight', () => ({
  requireStaff: (...args: unknown[]) => requireStaff(...args),
}))

import { getLogicAtlasHandler } from './logic-atlas'

describe('getLogicAtlasHandler', () => {
  beforeEach(() => {
    requireStaff.mockReset()
  })

  it('refuses callers who are not staff', async () => {
    requireStaff.mockRejectedValue(new Error('This page is not available.'))
    await expect(getLogicAtlasHandler({ data: { userId: 'member' } })).rejects.toThrow('This page is not available.')
  })

  it('returns the generated atlas to staff', async () => {
    requireStaff.mockResolvedValue({ userId: 'staff' })
    const atlas = await getLogicAtlasHandler({ data: { userId: 'staff' } })
    expect(atlas.version).toBe(1)
    expect(atlas.rules.length).toBeGreaterThan(0)
    expect(atlas.stats.rules).toBe(atlas.rules.length)
    expect(requireStaff).toHaveBeenCalledOnce()
  })
})
