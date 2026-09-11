import { describe, expect, it } from 'vitest'
import { Route as CodexIndexRoute } from './codex/index'
import { Route as CodexSlugRoute } from './codex/$slug'
import { findScriptureBySlug } from '@/lib/codex-links'

describe('/codex routes', () => {
  it('keeps the vault index as a real Codex tab instead of a blank or not-found title', () => {
    const head = CodexIndexRoute.options.head as () => {
      meta: Array<{ title?: string; content?: string; property?: string }>
      links: Array<{ rel?: string; href?: string }>
    }
    const result = head()
    const title = result.meta.find((entry) => entry.title)?.title

    expect(title).toBe('The Sacred Codex | Moltology Scriptures & Doctrine')
    expect(title).not.toMatch(/Page Not Found/i)
    expect(result.links[0]?.href).toBe('https://moltology.org/codex')
    expect(CodexIndexRoute.options.pendingComponent).toBeDefined()
  })

  it('names a known scripture slug in the tab without leaving the Codex chamber', () => {
    const head = CodexSlugRoute.options.head as (ctx: {
      params: { slug: string }
    }) => {
      meta: Array<{ title?: string }>
      links: Array<{ rel?: string; href?: string }>
    }
    const result = head({ params: { slug: 'scr-010' } })
    const title = result.meta.find((entry) => entry.title)?.title
    const scripture = findScriptureBySlug('scr-010')

    expect(scripture?.title).toBe('The Law of Ecdysis')
    expect(title).toBe('The Law of Ecdysis | Moltology Scriptures & Doctrine')
    expect(result.links[0]?.href).toBe('https://moltology.org/codex/scr-010')
  })

  it('keeps an unknown slug in-chamber instead of a hard not-found tab', () => {
    const head = CodexSlugRoute.options.head as (ctx: {
      params: { slug: string }
    }) => {
      meta: Array<{ title?: string }>
      links: Array<{ rel?: string; href?: string }>
    }
    const result = head({ params: { slug: 'scr-999' } })
    const title = result.meta.find((entry) => entry.title)?.title

    expect(findScriptureBySlug('scr-999')).toBeUndefined()
    expect(title).toBe('The Sacred Codex | Moltology Scriptures & Doctrine')
    expect(title).not.toMatch(/Page Not Found/i)
    expect(result.links[0]?.href).toBe('https://moltology.org/codex')
  })
})
