import { describe, expect, it } from 'vitest'
import { shopCatalog } from '../equipment-seed-data'
import { collectionReleased } from './collections'

describe('timed collections', () => {
  it('keeps Winter Molt out of the shop until midnight New York time on its day', () => {
    expect(collectionReleased('winter-molt', new Date('2026-12-01T04:59:00Z'))).toBe(false)
    expect(collectionReleased('winter-molt', new Date('2026-12-01T05:00:00Z'))).toBe(true)
    expect(collectionReleased('royal-reef', new Date('2020-01-01T00:00:00Z'))).toBe(true)
    expect(collectionReleased(undefined)).toBe(true)
  })

  it('sells its pieces only once it is out', () => {
    const before = shopCatalog(new Date('2026-11-24T12:00:00Z'))
    const after = shopCatalog(new Date('2026-12-02T12:00:00Z'))
    expect(before.some((r) => r.slug === 'evergreen-cape')).toBe(false)
    expect(after.some((r) => r.slug === 'evergreen-cape')).toBe(true)
    expect(before.some((r) => r.slug === 'coral-cape')).toBe(true)
  })
})
