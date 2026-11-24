import { describe, expect, it } from 'vitest'
import { ALL_EQUIPMENT_CATALOG } from './equipment-seed-data'
import { MARKET_BUNDLES, bundlePrice, bundleRefKey, featuredSlots, marketBundle } from './market-featured'

describe('market bundles', () => {
  it('every bundle piece is a catalog row', () => {
    const keys = new Set(ALL_EQUIPMENT_CATALOG.filter((c) => c.kind === 'gear').map((c) => c.appearanceKey ?? c.slug))
    for (const bundle of MARKET_BUNDLES) for (const ref of bundle.pieces) expect(keys, `${bundle.id}: ${ref.baseKey}`).toContain(bundleRefKey(ref))
  })

  it('collection pieces use their own key, other rarities their recoloured version', () => {
    expect(bundleRefKey({ baseKey: 'linen-wrap', rarity: 'epic' })).toBe('linen-wrap')
    expect(bundleRefKey({ baseKey: 'creator-crown', rarity: 'rare' })).toBe('creator-crown--rare')
  })

  it('drops owned pieces out of the price and keeps the discount', () => {
    const bundle = marketBundle('collection-linen-hours')!
    // Epic 900 + uncommon 150 + common 60 + common 60 = 1,170, 20% off = 936, to the nearest 10.
    expect(bundlePrice(bundle)).toEqual({ full: 1170, price: 940, left: 4 })
    expect(bundlePrice(bundle, (ref) => ref.baseKey === 'linen-wrap')).toEqual({ full: 270, price: 220, left: 3 })
    expect(bundlePrice(bundle, () => true)).toEqual({ full: 0, price: 0, left: 0 })
  })
})

describe('featured rotation', () => {
  it('leads with a different collection each week, with its rarest piece beside it', () => {
    const a = featuredSlots(new Date('2026-11-23T12:00:00Z'))
    const b = featuredSlots(new Date('2026-11-30T12:00:00Z'))
    expect(a[0]).toMatchObject({ kind: 'bundle', tag: 'Collection of the week' })
    expect(a[0]).not.toEqual(b[0])
    expect(a[1]).toMatchObject({ kind: 'piece', tag: 'New' })
    // Every collection gets a turn.
    const leads = new Set(Array.from({ length: 10 }, (_, i) => JSON.stringify(featuredSlots(new Date(Date.UTC(2026, 0, 1 + i * 7)))[0])))
    expect(leads.size).toBe(10)
  })
})
