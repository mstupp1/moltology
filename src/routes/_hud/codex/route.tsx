import React from 'react'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { CodexChamber } from '@/components/codex/CodexChamber'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

/**
 * One reader for /codex and /codex/$slug. The child routes only set the head, so moving
 * between scriptures changes the address without remounting the reader or its filters.
 */
function CodexLayoutRoute() {
  const { slug } = useParams({ strict: false }) as { slug?: string }
  return <CodexChamber scriptureSlug={slug} />
}

export const Route = createFileRoute('/_hud/codex')({
  component: CodexLayoutRoute,
  pendingComponent: HudWorkspaceGhost,
})
