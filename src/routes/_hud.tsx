import { createFileRoute } from '@tanstack/react-router'
import { HudLayout } from '@/components/hud/HudLayout'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

export const Route = createFileRoute('/_hud')({
  component: HudLayout,
  pendingComponent: HudWorkspaceGhost,
})

