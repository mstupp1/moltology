import { describe, it, expect } from 'vitest'
import { Route } from './friends'

describe('/friends route', () => {
  it('sets a private Friends title', () => {
    const head = Route.options.head as () => { meta: Array<{ title?: string; name?: string; content?: string }> }
    const headers = Route.options.headers as () => Record<string, string>
    expect(head().meta.find((entry) => entry.title)?.title).toBe('Friends | Moltology')
    expect(headers()['X-Robots-Tag']).toBe('noindex, nofollow')
    expect(Route.options.pendingComponent).toBeDefined()
  })

  it('reads the tab from search and ignores unknown tabs', () => {
    const validate = Route.options.validateSearch as (search: Record<string, unknown>) => { tab?: string }
    expect(validate({ tab: 'incoming' })).toEqual({ tab: 'incoming' })
    expect(validate({ tab: 'feed' })).toEqual({ tab: 'feed' })
    expect(validate({ tab: 'nope' })).toEqual({ tab: undefined })
  })
})
