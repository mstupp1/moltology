import { describe, expect, it } from 'vitest'
import { STORE_DEFAULTS, quoteBinding, selectStandardRate, storeAddressSchema, storeSettingsSchema, safeTrackingUrl } from './store'
const address = { name: 'Test', line1: '1 Test Street', line2: null, city: 'Seattle', state: 'WA', postalCode: '98101', country: 'US', phone: null }
describe('store delivery rules', () => {
  it('starts private with US/manual controls and no invented policies', () => {
    expect(STORE_DEFAULTS).toMatchObject({ publicEnabled: false, enabledCountries: ['US'], fulfillmentMode: 'manual', policiesApproved: false })
    expect(storeSettingsSchema.safeParse({ ...STORE_DEFAULTS, publicEnabled: true }).success).toBe(false)
  })
  it.each([{ ...address, state: '' }, { ...address, postalCode: 'bad' }, { ...address, line1: '' }, { ...address, country: 'USA' }])('rejects invalid delivery details', input => {
    expect(storeAddressSchema.safeParse(input).success).toBe(false)
  })
  it('binds email, every delivery field, price, mapping and quantities', () => {
    const line = { variantId: 'a', quantity: 1, unitPriceCents: 1800, printfulSyncVariantId: 42 } as any
    const bound = { email: 'buyer@example.com', address, lines: [line] }
    for (const edited of [{ ...bound, email: 'other@example.com' }, { ...bound, address: { ...address, line2: 'Apt 2' } }, { ...bound, lines: [{ ...line, quantity: 2 }] }, { ...bound, lines: [{ ...line, unitPriceCents: 1900 }] }, { ...bound, lines: [{ ...line, printfulSyncVariantId: 43 }] }]) expect(quoteBinding(edited)).not.toBe(quoteBinding(bound))
  })
  it('accepts only an available USD standard rate without floating point drift', () => {
    expect(selectStandardRate([{ id:'EXPRESS',rate:'9.99',currency:'USD' },{ id:'STANDARD',name:'Standard',rate:'6.95',currency:'USD' }])).toMatchObject({ service: 'STANDARD', amountCents: 695 })
    for (const rate of ['NaN','-1.00','1.001','']) expect(() => selectStandardRate([{ id:'STANDARD',rate,currency:'USD' }])).toThrow()
    expect(() => selectStandardRate([{ id:'STANDARD',rate:'1.00',currency:'EUR' }])).toThrow()
    expect(() => selectStandardRate([])).toThrow('unavailable')
  })
  it('never renders executable tracking URLs', () => {
    expect(safeTrackingUrl('javascript:alert(1)')).toBeNull()
    expect(safeTrackingUrl('http://example.com')).toBeNull()
    expect(safeTrackingUrl('https://example.com/track')).toBe('https://example.com/track')
  })
})
