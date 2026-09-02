import { describe, it, expect } from 'vitest'
import { Route } from './search'
import { SEARCH_PAGE_SEO } from '@/lib/seo'

describe('/search route', () => {
  it('sets a real page title instead of a blank or not-found tab', () => {
    const head = Route.options.head as (ctx: {
      match: { search?: { q?: string; type?: string } }
    }) => { meta: Array<{ title?: string }> }
    const headers = Route.options.headers as () => Record<string, string>
    const emptyTitle = head({ match: { search: { q: '', type: 'people' } } }).meta.find(
      (entry) => entry.title,
    )?.title
    const namedTitle = head({ match: { search: { q: 'claw_lord', type: 'people' } } }).meta.find(
      (entry) => entry.title,
    )?.title

    expect(emptyTitle).toBe(SEARCH_PAGE_SEO.title)
    expect(emptyTitle).not.toBe('')
    expect(emptyTitle).not.toMatch(/Page Not Found/i)
    expect(namedTitle).toBe('Search · claw_lord | Moltology')
    expect(headers()['X-Robots-Tag']).toBe('noindex, nofollow')
    expect(Route.options.pendingComponent).toBeDefined()
  })

  it('defaults missing type to people and keeps q as a string', () => {
    const validate = Route.options.validateSearch as (search: Record<string, unknown>) => {
      q: string
      type: 'people' | 'pages'
    }
    expect(validate({})).toEqual({ q: '', type: 'people' })
    expect(validate({ q: 'claw', type: 'pages' })).toEqual({ q: 'claw', type: 'pages' })
  })
})
