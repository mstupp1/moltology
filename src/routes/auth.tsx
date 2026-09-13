import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { privatePageSeo, xRobotsNoindexHeaders } from '@/lib/seo'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'
import { authSearchSchema } from '@/lib/auth-search'

const LazyAuthView = lazy(() => import('@/components/auth/AuthView'))

function AuthRoute() {
  const search = Route.useSearch()
  return (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyAuthView search={search} />
    </Suspense>
  )
}

export const Route = createFileRoute('/auth')({
  validateSearch: (search: Record<string, unknown>) => authSearchSchema.parse(search),
  head: () => ({
    meta: [
      { charSet: 'UTF-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' },
      ...privatePageSeo({ title: 'Initiate Authentication' }),
    ],
  }),
  headers: () => xRobotsNoindexHeaders(),
  component: AuthRoute,
  pendingComponent: HUDPageLoader,
})
