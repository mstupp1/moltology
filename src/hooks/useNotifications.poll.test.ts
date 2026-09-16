import { describe, expect, it } from 'vitest'
import { NOTIFICATIONS_POLL_MS } from './useNotifications'

describe('notification poll interval', () => {
  it('stays above Neon Free 5-minute idle so a visible HUD tab cannot pin compute', () => {
    expect(NOTIFICATIONS_POLL_MS).toBeGreaterThan(5 * 60_000)
  })
})
