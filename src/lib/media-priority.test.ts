import { describe, it, expect } from 'vitest'
import { eagerImageProps, lazyImageProps, lcpImageProps } from './media-priority'

describe('media priority hints', () => {
  it('marks only the LCP candidate as high-priority eager', () => {
    expect(lcpImageProps.loading).toBe('eager')
    expect(lcpImageProps.fetchPriority).toBe('high')
    expect(lazyImageProps.loading).toBe('lazy')
    expect(lazyImageProps.fetchPriority).toBe('low')
    expect(eagerImageProps.fetchPriority).not.toBe('high')
  })
})
