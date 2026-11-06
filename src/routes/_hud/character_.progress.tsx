import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { CharacterSectionNav } from '@/components/hud/chassis/CharacterSectionNav'
import { SITE_ORIGIN, canonicalLink, seo } from '@/lib/seo'

const LazyPipelineView = lazy(() => import('@/components/hud/PipelineView'))

const CANONICAL = `${SITE_ORIGIN}/character/progress`

function CharacterProgressRoute() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <CharacterSectionNav current="progress" className="w-max" />
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazyPipelineView />
      </Suspense>
    </div>
  )
}

// The four stages and your XP, formerly /stages (and before that /pipeline).
// vercel.json sends both old addresses here with a 301.
export const Route = createFileRoute('/_hud/character_/progress')({
  head: () => ({
    links: [canonicalLink(CANONICAL)],
    meta: seo({
      canonical: CANONICAL,
      title: 'Stage progress | Moltology',
      description: 'The four stages, your XP and what opens next.',
    }),
  }),
  component: CharacterProgressRoute,
  pendingComponent: HudWorkspaceGhost,
})
