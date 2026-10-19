import React, { Suspense, lazy, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { scriptureSlugFromId } from '@/lib/codex-links'

const LazySacredCodexReader = lazy(() =>
  import('./SacredCodexReader').then((m) => ({ default: m.SacredCodexReader })),
)

export function CodexChamber({ scriptureSlug }: { scriptureSlug?: string }) {
  const navigate = useNavigate()
  const handleNavigate = useCallback(
    (scriptureId: string) => {
      void navigate({
        to: '/codex/$slug',
        params: { slug: scriptureSlugFromId(scriptureId) },
        resetScroll: false,
      })
    },
    [navigate]
  )

  return (
    <div className="flex flex-col">
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazySacredCodexReader scriptureSlug={scriptureSlug} onNavigate={handleNavigate} />
      </Suspense>
    </div>
  )
}
