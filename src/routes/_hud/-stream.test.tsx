import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { Route } from './stream'
import { ACTIVITY_STREAM_PAGE_DESCRIPTION } from '@/lib/activity-events'

describe('/stream route', () => {
  it('sets a real page title instead of a blank or not-found tab', () => {
    const head = Route.options.head as () => { meta: Array<{ title?: string; name?: string; content?: string }> }
    const headers = Route.options.headers as () => Record<string, string>
    const title = head().meta.find((entry) => entry.title)?.title

    expect(title).toBeTruthy()
    expect(title).not.toBe('')
    expect(title).toMatch(/Activity Stream/)
    expect(title).toBe('Activity Stream | Moltology')
    expect(title).not.toMatch(/Page Not Found/i)
    expect(headers()['X-Robots-Tag']).toBe('noindex, nofollow')
    expect(head().meta).toEqual(
      expect.arrayContaining([
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'description', content: ACTIVITY_STREAM_PAGE_DESCRIPTION },
      ]),
    )
    expect(Route.options.pendingComponent).toBeDefined()
  })

  it('wraps the chamber in an honest guest lock and never guest-dumps signed-in members', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/routes/_hud/stream.tsx'), 'utf8')
    expect(src).toMatch(/GuestLockGuard/)
    expect(src).toMatch(/ACTIVITY_STREAM_GUEST_LOCK_MESSAGE/)
    expect(src).toMatch(/LazyActivityStreamPage/)
    expect(src).not.toMatch(/luxury sedan/i)
    expect(src).not.toMatch(/INITIAL_ACTIVITIES/)
  })
})

describe('Activity Stream fetch policy', () => {
  it('loads the chamber on demand and never installs a keepalive poll', () => {
    const page = readFileSync(resolve(process.cwd(), 'src/components/hud/ActivityStreamPage.tsx'), 'utf8')
    const panel = readFileSync(resolve(process.cwd(), 'src/components/hud/ActivityStreamPanel.tsx'), 'utf8')
    expect(page).not.toMatch(/setInterval/)
    expect(page).not.toMatch(/60_000|60000/)
    expect(panel).not.toMatch(/setInterval/)
    expect(panel).not.toMatch(/60_000|60000/)
    expect(panel).toMatch(/to: '\/stream'/)
  })
})
