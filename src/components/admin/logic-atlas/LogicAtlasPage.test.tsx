import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { LogicAtlas } from '@/lib/logic-atlas/types'
import type { LogicAtlasSearch } from '@/lib/logic-atlas/search'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('./AtlasCanvas', () => ({
  AtlasCanvas: ({ onSelectRule, matches }: { onSelectRule: (id: string) => void; matches: Set<string> | null }) => (
    <div data-testid="atlas-canvas-stub" data-matches={matches ? [...matches].join(',') : 'all'}>
      <button type="button" onClick={() => onSelectRule('forum.rate-limit')}>
        pick rule
      </button>
    </div>
  ),
}))

vi.mock('./FlowDiagram', () => ({ FlowDiagram: () => <div data-testid="flow-stub" /> }))

vi.mock('@/lib/server/api', () => ({ getLogicAtlasFn: vi.fn() }))

import { LogicAtlasView } from './LogicAtlasPage'

const ATLAS: LogicAtlas = {
  version: 1,
  syncedAt: '2026-09-24',
  repoUrl: 'https://github.com/example/repo',
  stats: { domains: 1, rules: 2, decisions: 1, anchors: 1, drifted: 0, flagged: 1 },
  canvas: { width: 600, height: 300 },
  domains: [
    {
      id: 'forum',
      title: 'Forum & moderation',
      color: '#00ffc8',
      summary: 'Forum rules.',
      overviewHtml: '',
      box: { x: 0, y: 0, width: 600, height: 300 },
      ruleIds: ['forum.rate-limit', 'forum.quarantine'],
    },
  ],
  rules: [
    {
      id: 'forum.rate-limit',
      domain: 'forum',
      title: 'Ten writes per minute',
      kind: 'limit',
      status: 'active',
      statement: 'Each member can write at most 10 times a minute.',
      anchors: [
        {
          file: 'src/lib/community-rules.ts',
          symbol: 'FORUM_WRITE_RATE_LIMIT',
          line: 70,
          value: '10',
          drift: 'ok',
          url: 'https://github.com/example/repo/blob/main/src/lib/community-rules.ts#L70',
        },
      ],
      tests: [],
      dependsOn: [],
      usedBy: ['forum.quarantine'],
      decisions: ['forum-write-hardening'],
      flag: { level: 'watch', note: 'The limiter is per server instance.' },
      flow: null,
      position: { x: 20, y: 70 },
      drift: 'ok',
    },
    {
      id: 'forum.quarantine',
      domain: 'forum',
      title: 'Prohibited posts never insert',
      kind: 'gate',
      status: 'active',
      statement: 'Clear abuse is refused.',
      anchors: [],
      tests: [],
      dependsOn: ['forum.rate-limit'],
      usedBy: [],
      decisions: [],
      flag: null,
      flow: null,
      position: { x: 300, y: 70 },
      drift: 'ok',
    },
  ],
  decisions: [
    {
      id: 'forum-write-hardening',
      date: '2026-09-08',
      title: 'Harden forum writes',
      summary: 'Safety checks and a rate limit.',
      domains: ['forum'],
      rules: ['forum.rate-limit'],
      status: 'accepted',
      supersededBy: null,
      sources: [{ kind: 'pr', label: 'PR #90', url: 'https://github.com/example/repo/pull/90' }],
      sections: [{ heading: 'Context', html: '<p>Posts skipped harm filters.</p>' }],
    },
  ],
  edges: [{ id: 'forum.rate-limit->forum.quarantine', source: 'forum.rate-limit', target: 'forum.quarantine', crossDomain: false }],
}

function renderView(search: LogicAtlasSearch = {}) {
  const onSearchChange = vi.fn()
  const view = render(
    <LogicAtlasView atlas={ATLAS} error={null} onRetry={vi.fn()} search={search} onSearchChange={onSearchChange} />,
  )
  return { onSearchChange, ...view }
}

describe('LogicAtlasView', () => {
  it('shows the summary and the map by default', async () => {
    renderView()
    expect(screen.getByLabelText('Atlas summary')).toHaveTextContent('Rules2')
    expect(screen.getByText('2026-09-24')).toBeInTheDocument()
    expect(await screen.findByTestId('atlas-canvas-stub')).toBeInTheDocument()
  })

  it('writes rule selection and search to the URL state', async () => {
    const { onSearchChange } = renderView({ q: 'rate' })
    fireEvent.click(await screen.findByText('pick rule'))
    expect(onSearchChange).toHaveBeenCalledWith({ q: 'rate', tab: 'map', rule: 'forum.rate-limit' })
    expect(screen.getByTestId('atlas-canvas-stub')).toHaveAttribute('data-matches', 'forum.rate-limit')
  })

  it('opens the rule drawer with code anchors, flags, and linked decisions', async () => {
    const { onSearchChange } = renderView({ rule: 'forum.rate-limit' })
    const drawer = await screen.findByTestId('atlas-rule-drawer')
    expect(drawer).toHaveTextContent('FORUM_WRITE_RATE_LIMIT')
    expect(drawer).toHaveTextContent('The limiter is per server instance.')
    expect(drawer).toHaveTextContent('Prohibited posts never insert')
    fireEvent.click(screen.getByText('Harden forum writes'))
    expect(onSearchChange).toHaveBeenCalledWith({ tab: 'timeline', decision: 'forum-write-hardening' })
  })

  it('shows decisions on the timeline and jumps back to a rule', () => {
    const { onSearchChange } = renderView({ tab: 'timeline', decision: 'forum-write-hardening' })
    expect(screen.getByText('Posts skipped harm filters.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /PR #90/ })).toHaveAttribute('href', 'https://github.com/example/repo/pull/90')
    fireEvent.click(screen.getByRole('button', { name: /Ten writes per minute/ }))
    expect(onSearchChange).toHaveBeenCalledWith({ tab: 'map', rule: 'forum.rate-limit' })
  })

  it('shows a plain error with a retry', () => {
    const onRetry = vi.fn()
    render(<LogicAtlasView atlas={null} error="This page is not available." onRetry={onRetry} search={{}} onSearchChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }))
    expect(onRetry).toHaveBeenCalled()
  })
})
