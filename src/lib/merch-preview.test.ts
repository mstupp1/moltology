import { describe, expect, it } from 'vitest'
import { MERCH_PREVIEW, readMerchPreview } from './merch-preview'

describe('merch preview mode', () => {
  it('never turns on outside a dev server', () => {
    expect(readMerchPreview({ dev: false, flag: '1' })).toBe(false)
    expect(readMerchPreview({ dev: false, flag: 'true', nodeEnv: 'development' })).toBe(false)
    expect(readMerchPreview({ dev: true, flag: '1', nodeEnv: 'production' })).toBe(false)
  })

  it('needs the flag in dev', () => {
    expect(readMerchPreview({ dev: true })).toBe(false)
    expect(readMerchPreview({ dev: true, flag: '0' })).toBe(false)
    expect(readMerchPreview({ dev: true, flag: '1' })).toBe(true)
  })

  it('is off in the test run', () => {
    expect(MERCH_PREVIEW).toBe(false)
  })
})
