import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, ...props }: any) => (
    <a href={String(to).replace('$slug', params?.slug ?? '')} {...props}>
      {children}
    </a>
  ),
}))

const getOracleCardsFn = vi.fn()
vi.mock('@/lib/server/api', () => ({ getOracleCardsFn: (...args: unknown[]) => getOracleCardsFn(...args) }))
vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn().mockResolvedValue(null) }))
vi.mock('@/components/forum/ForumTopicRow', () => ({
  ForumTopicRow: ({ topic }: any) => <article data-testid="forum-topic-row">{topic.title}</article>,
}))

import { OracleReadCards, orderOracleCards } from './OracleReadCards'

const topic = (slug: string, title: string) => ({ slug, title, id: slug, categorySlug: 'general-discussion' }) as any
const empty = { forum: [], news: [], changelog: [], academy: [], codex: [] }

describe('OracleReadCards', () => {
  it('orders cards the way the Oracle read them and drops refs that did not load', () => {
    const cards = orderOracleCards(
      [
        { kind: 'codex', count: 1, refs: ['SCR-010#2'] },
        { kind: 'forum-list', count: 3, refs: ['b', 'gone', 'a'] },
        { kind: 'forum-thread', count: 1, refs: ['a'] },
      ],
      {
        ...empty,
        forum: [topic('a', 'Topic A'), topic('b', 'Topic B')],
        codex: [{ id: 'SCR-010', title: 'The Law of Ecdysis', volumeName: 'II', href: '/codex/scr-010#verse-2', verse: null }],
      },
    )
    expect(cards.map((c) => c.key)).toEqual(['codex:SCR-010', 'forum:b', 'forum:a'])
  })

  it('shows the label, three cards, then the rest behind Show more', async () => {
    getOracleCardsFn.mockResolvedValueOnce({
      ...empty,
      forum: ['a', 'b', 'c', 'd', 'e'].map((s) => topic(s, `Topic ${s.toUpperCase()}`)),
    })
    render(<OracleReadCards signedIn={false} reads={[{ kind: 'forum-list', count: 5, refs: ['a', 'b', 'c', 'd', 'e'] }]} />)
    expect(screen.getByText('Read 5 forum topics')).toBeTruthy()
    expect(await screen.findAllByTestId('forum-topic-row')).toHaveLength(3)
    expect(getOracleCardsFn).toHaveBeenCalledWith({ data: expect.objectContaining({ forum: ['a', 'b', 'c', 'd', 'e'], token: undefined }) })
    fireEvent.click(screen.getByRole('button', { name: /Show 2 more/ }))
    expect(screen.getAllByTestId('forum-topic-row')).toHaveLength(5)
  })

  it('renders news, changelog and Codex cards with their links', async () => {
    getOracleCardsFn.mockResolvedValueOnce({
      ...empty,
      news: [{ slug: 'edge-ai', title: 'Edge AI', summary: 's', category: 'TECH', coverImageUrl: '', publishedAt: '2026-11-01T00:00:00Z', tags: [] }],
      changelog: [{ slug: 'v2', version: 'v2.0', title: 'Oracle skills', category: 'Feature', summary: 'Skills.', content: '', releasedAt: '2026-11-14T00:00:00Z' }],
      codex: [{ id: 'SCR-010', title: 'The Law of Ecdysis', volumeName: 'II', href: '/codex/scr-010#verse-2', verse: { verseNumber: 2, text: 'Shed what no longer fits.' } }],
    })
    render(
      <OracleReadCards
        signedIn={false}
        reads={[
          { kind: 'news', count: 1, refs: ['edge-ai'] },
          { kind: 'changelog', count: 1, refs: ['v2'] },
          { kind: 'codex', count: 1, refs: ['SCR-010#2'] },
        ]}
      />,
    )
    expect((await screen.findByText('Edge AI')).closest('a')?.getAttribute('href')).toBe('/news/edge-ai')
    expect(screen.getByText('Oracle skills').closest('a')?.getAttribute('href')).toBe('/changelog/v2')
    expect(screen.getByText('Shed what no longer fits.').closest('a')?.getAttribute('href')).toBe('/codex/scr-010#verse-2')
  })

  it('shows only the label when nothing has cards', () => {
    render(<OracleReadCards signedIn={false} reads={[{ kind: 'academy', count: 0 }]} />)
    expect(screen.getByText('Checked the Academy')).toBeTruthy()
    expect(getOracleCardsFn).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ academy: [] }) }))
  })
})
