import React, { Suspense, lazy } from 'react'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

const LazySacredCodexReader = lazy(() =>
  import('./SacredCodexReader').then((m) => ({ default: m.SacredCodexReader })),
)

export function CodexChamber({ scriptureSlug }: { scriptureSlug?: string }) {
  return (
    <div className="flex flex-col">
      <Suspense fallback={<HudWorkspaceGhost />}>
        <LazySacredCodexReader scriptureSlug={scriptureSlug} />
      </Suspense>
    </div>
  )
}
