import { describe, expect, it } from 'vitest'
import {
  HIDDEN_PAGES,
  canViewHiddenPages,
  isHiddenPagePath,
  normalizeAppPath,
} from './hidden-pages'

describe('hidden pages', () => {
  it('treats subterranean vats as a hidden page', () => {
    expect(HIDDEN_PAGES.map((page) => page.path)).toEqual(['/subterranean', '/premium'])
    expect(isHiddenPagePath('/subterranean')).toBe(true)
    expect(isHiddenPagePath('/subterranean/')).toBe(true)
    expect(isHiddenPagePath('/subterranean?vat=1')).toBe(true)
    expect(isHiddenPagePath('/subterranean/vault')).toBe(true)
    expect(isHiddenPagePath('/premium')).toBe(true)
    expect(isHiddenPagePath('/premium/')).toBe(true)
    expect(isHiddenPagePath('/premium?checkout=success')).toBe(true)
  })

  it('leaves ordinary chambers visible', () => {
    expect(isHiddenPagePath('/dashboard')).toBe(false)
    expect(isHiddenPagePath('/codex')).toBe(false)
    expect(isHiddenPagePath('/subterranean-extra')).toBe(false)
    expect(isHiddenPagePath(null)).toBe(false)
    expect(normalizeAppPath('/codex/')).toBe('/codex')
  })

  it('lets admins and super admins view hidden pages', () => {
    expect(canViewHiddenPages({ email: 'ops@example.com', role: 'admin' })).toBe(true)
    expect(canViewHiddenPages({ email: 'myles@moltology.org', role: 'user' })).toBe(true)
    expect(canViewHiddenPages({ email: 'member@example.com', role: 'user' }, 'admin')).toBe(true)
    expect(canViewHiddenPages({ email: 'member@example.com', role: 'user' }, 'super_admin')).toBe(true)
  })

  it('keeps hidden pages away from members and guests', () => {
    expect(canViewHiddenPages(null)).toBe(false)
    expect(canViewHiddenPages({ email: 'member@example.com', role: 'user' })).toBe(false)
    expect(canViewHiddenPages({ email: 'member@example.com', role: 'user' }, 'user')).toBe(false)
  })
})
