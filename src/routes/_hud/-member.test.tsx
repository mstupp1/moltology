import { describe, it, expect } from 'vitest'
import { Route } from './member/$profileId'
import { MEMBER_PROFILE_SEO } from '@/lib/seo'

describe('/member/$profileId dossier route', () => {
  it('sets a real page title instead of a blank or not-found tab', () => {
    const head = Route.options.head as () => { meta: Array<{ title?: string }> }
    const headers = Route.options.headers as () => Record<string, string>
    const meta = head().meta
    const title = meta.find((entry) => entry.title)?.title

    expect(title).toBe(MEMBER_PROFILE_SEO.title)
    expect(title).not.toBe('')
    expect(title).not.toMatch(/Page Not Found/i)
    expect(headers()['X-Robots-Tag']).toBe('noindex, nofollow')
    expect(Route.options.pendingComponent).toBeDefined()
  })
})
