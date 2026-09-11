import { describe, it, expect } from 'vitest'
import { Route } from './stream'

describe('/stream route', () => {
  it('sets a real page title instead of a blank or not-found tab', () => {
    const head = Route.options.head as () => { meta: Array<{ title?: string }> }
    const headers = Route.options.headers as () => Record<string, string>
    const title = head().meta.find((entry) => entry.title)?.title

    expect(title).toBeTruthy()
    expect(title).not.toBe('')
    expect(title).toMatch(/Activity Stream/)
    expect(title).toBe('Activity Stream | Moltology')
    expect(title).not.toMatch(/Page Not Found/i)
    expect(headers()['X-Robots-Tag']).toBe('noindex, nofollow')
    expect(head().meta).toEqual(
      expect.arrayContaining([{ name: 'robots', content: 'noindex, nofollow' }]),
    )
    expect(Route.options.pendingComponent).toBeDefined()
  })
})
