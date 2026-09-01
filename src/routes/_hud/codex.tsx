import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'

const LazySacredCodexReader = lazy(() =>
  import('@/components/codex/SacredCodexReader').then((m) => ({ default: m.SacredCodexReader }))
)

function CodexRoute() {
  return (
    <div className="flex flex-col">
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazySacredCodexReader />
      </Suspense>
    </div>
  )
}

export const Route = createFileRoute('/_hud/codex')({
  head: () => ({
    meta: [
      ...seo({
        title: 'The Sacred Codex | Moltology Scriptures & Doctrine',
        description: 'Read the official liturgical scriptures, ecdysis directives, and benthic ascendance formulas of Moltology.',
        keywords: 'Sacred Codex, Moltology Scriptures, Ecdysis Directives, Benthic Ascension, Carcinization Liturgy',
        canonical: 'https://moltology.org/codex',
        siteName: 'Moltology Codex',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/codex' },
    ],
  }),
  component: CodexRoute,
  pendingComponent: HudWorkspaceGhost,
})
