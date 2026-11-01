import { createFileRoute } from '@tanstack/react-router'
import { DailyRoutineWidget } from '@/components/hud/DailyRoutineWidget'
import { DailyRoutineGhost } from '@/components/hud/HudGhostSkeletons'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'

function AlignmentPage() {
  return (
    <div className="shrink-0">
      <DailyRoutineWidget />
    </div>
  )
}

export const Route = createFileRoute('/_hud/alignment')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: privatePageSeo({
      title: 'Daily alignment | Moltology',
      description: 'Your daily alignment: today’s liturgies, progress and recent history.',
    }),
  }),
  component: AlignmentPage,
  pendingComponent: DailyRoutineGhost,
})
