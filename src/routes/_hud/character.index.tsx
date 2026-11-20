import React, { Suspense, lazy } from 'react'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'
import { createFileRoute } from '@tanstack/react-router'
import { HudSectionGhost } from '@/components/hud/HudGhostSkeletons'
import { loadCustomizePage } from '@/components/hud/chassis/character-pages'

const LazyChassisStatusPage = lazy(() =>
  loadCustomizePage().then((m) => ({ default: m.ChassisStatusPage }))
)

function ChassisRoute() {
  return (
    // Open to guests: they edit the starter character and sign up to keep it.
    <div className="flex flex-col flex-1 min-h-0 h-full w-full">
      <Suspense fallback={<HudSectionGhost />}>
        <LazyChassisStatusPage />
      </Suspense>
    </div>
  )
}

export const Route = createFileRoute('/_hud/character/')({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: privatePageSeo({
      title: 'Character | Moltology',
      description: 'Customize your character and seat gear from your vault.',
    }),
  }),
  component: ChassisRoute,
  pendingComponent: HudSectionGhost,
})

