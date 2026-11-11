import { beforeEach, describe, expect, it, vi } from 'vitest'

const renderStill = vi.hoisted(() => vi.fn((_look: unknown, px: number, shot: string) => `data:image/webp;base64,${shot}-${px}`))
vi.mock('./avatar3d', () => ({
  Avatar3DUnavailable: class extends Error {},
  lookFromConfig: (config: unknown) => config,
  renderStill,
}))

import { readyStill3D, requestStill3D, resetStillsForTests } from './avatar3d-portrait-queue'
import { gearStill } from './avatar3d-gear-icon'

const config = { style: 'critters', seed: 'queue-test', race: 'crab' } as const

describe('3D still queue', () => {
  beforeEach(() => {
    resetStillsForTests()
    renderStill.mockClear()
  })

  it('draws each picture once, however many avatars ask for it', async () => {
    const [a, b] = await Promise.all([requestStill3D(config, 128), requestStill3D({ race: 'crab', seed: 'queue-test', style: 'critters' }, 128)])
    expect(a).toBe('data:image/webp;base64,portrait-128')
    expect(b).toBe(a)
    expect(renderStill).toHaveBeenCalledTimes(1)
    expect(readyStill3D(config, 128)).toBe(a)
  })

  it('keeps faces, full figures and gear close-ups apart', async () => {
    await requestStill3D(config, 128, 'portrait')
    await requestStill3D(config, 128, 'full')
    await requestStill3D(config, 128, 'gear:head')
    expect(renderStill.mock.calls.map((call) => call[2])).toEqual(['portrait', 'full', 'gear:head'])
  })

  it('skips a picture nobody wants any more instead of drawing it', async () => {
    const stop = new AbortController()
    const first = requestStill3D({ ...config, seed: 'busy' }, 128)
    const stale = requestStill3D({ ...config, seed: 'stale' }, 128, 'portrait', stop.signal)
    stop.abort()
    await first
    expect(await stale).toBeNull()
    expect(renderStill).toHaveBeenCalledTimes(1)
  })

  it('shows every catalog item on a plain mannequin, close in on its slot', () => {
    const crown = gearStill('creator-crown')
    expect(crown?.shot).toBe('gear:head')
    expect(crown?.config.equipment).toEqual({ head: { visualKey: 'creator-crown' } })
    expect(gearStill('no-such-item')).toBeNull()
  })
})
