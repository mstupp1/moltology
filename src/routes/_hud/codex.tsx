import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SacredCodexReader } from '@/components/codex/SacredCodexReader'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'

function CodexRoute() {
  return (
    <div className="h-full flex-1 flex flex-col min-h-0 overflow-hidden">
      <SacredCodexReader />
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
