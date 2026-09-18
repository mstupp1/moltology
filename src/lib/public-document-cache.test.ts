import { describe, expect, it } from 'vitest'
import { isPublicDocumentCachePath, publicDocumentCacheHeaders } from './public-document-cache'

describe('isPublicDocumentCachePath', () => {
  it('caches the landing page and public document trees that SSR-query Postgres', () => {
    expect(isPublicDocumentCachePath('/')).toBe(true)
    expect(isPublicDocumentCachePath('/news')).toBe(true)
    expect(isPublicDocumentCachePath('/news/the-hold-you-sat-through')).toBe(true)
    expect(isPublicDocumentCachePath('/changelog')).toBe(true)
    expect(isPublicDocumentCachePath('/changelog/v1')).toBe(true)
    expect(isPublicDocumentCachePath('/forum')).toBe(true)
    expect(isPublicDocumentCachePath('/forum/general-discussion')).toBe(true)
  })

  it('does not cache authenticated HUD workspaces', () => {
    expect(isPublicDocumentCachePath('/dashboard')).toBe(false)
    expect(isPublicDocumentCachePath('/oracle')).toBe(false)
    expect(isPublicDocumentCachePath('/settings')).toBe(false)
    expect(isPublicDocumentCachePath(null)).toBe(false)
  })

  it('sends a Vercel CDN header so signed-in cookies do not origin-SSR news', () => {
    const headers = publicDocumentCacheHeaders()
    expect(headers['Cache-Control']).toContain('s-maxage=600')
    expect(headers['Vercel-CDN-Cache-Control']).toBe(
      'public, s-maxage=600, stale-while-revalidate=3600',
    )
  })
})
