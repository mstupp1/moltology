import { describe, it, expect } from 'vitest'
import { resolveWhatIsMoltologyNavId, WHAT_IS_MOLTOLOGY_NAV } from './nav'

describe('what-is-moltology nav', () => {
  it('lists overview plus three subpages', () => {
    expect(WHAT_IS_MOLTOLOGY_NAV.map((item) => item.id)).toEqual([
      'overview',
      'beliefs',
      'quotes',
      'sacraments',
    ])
  })

  it('resolves active section from pathname', () => {
    expect(resolveWhatIsMoltologyNavId('/what-is-moltology')).toBe('overview')
    expect(resolveWhatIsMoltologyNavId('/what-is-moltology/')).toBe('overview')
    expect(resolveWhatIsMoltologyNavId('/what-is-moltology/beliefs')).toBe('beliefs')
    expect(resolveWhatIsMoltologyNavId('/what-is-moltology/what-moltologists-say')).toBe('quotes')
    expect(resolveWhatIsMoltologyNavId('/what-is-moltology/benthic-sacraments')).toBe('sacraments')
  })
})
