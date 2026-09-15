import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyWhatIsMoltologyLayout = lazy(() =>
  import('@/components/what-is-moltology/WhatIsMoltologyLayout').then((m) => ({
    default: m.WhatIsMoltologyLayout,
  }))
)

export const Route = createFileRoute('/what-is-moltology')({
  component: () => (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyWhatIsMoltologyLayout />
    </Suspense>
  ),
})
