import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'
import type { CompositeTemplateType, CompositeAspectRatio, MascotKey } from '@/components/composite'

const LazyCompositeRenderView = lazy(() => import('@/components/composite/CompositeRenderView'))

interface CompositeSearchParams {
  template?: CompositeTemplateType
  theme?: string
  aspect?: CompositeAspectRatio
  mascot?: MascotKey
  mode?: 'preview' | 'raw'
  preview?: boolean
  secret?: string
  data?: string
}

export const Route = createFileRoute('/render/composite')({
  validateSearch: (search: Record<string, unknown>): CompositeSearchParams => {
    return {
      template: (search.template as CompositeTemplateType) || 'hook',
      theme: (search.theme as string) || 'moltmaxxing',
      aspect: (search.aspect as CompositeAspectRatio) || '4:5',
      mascot: (search.mascot as MascotKey) || 'lobster_thumbs_up',
      mode: (search.mode as 'preview' | 'raw') || 'preview',
      preview: search.preview === true || search.preview === 'true',
      secret: search.secret as string | undefined,
      data: search.data as string | undefined,
    }
  },
  head: () => ({
    meta: [
      { title: 'Composite Studio & Render Engine · Moltology' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  pendingComponent: HUDPageLoader,
  component: CompositeRenderRoute,
})

function CompositeRenderRoute() {
  const search = Route.useSearch()
  return (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyCompositeRenderView search={search} />
    </Suspense>
  )
}

