import React, { Suspense, lazy } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'
import { loadBenefitPage } from '@/lib/benefits/registry'
import { benefitHead } from '@/lib/benefits/seo'
import { xRobotsNoindexHeaders } from '@/lib/seo'

const LazyBenefitPageShell = lazy(() =>
  import('@/components/benefits/BenefitPageShell').then((m) => ({ default: m.BenefitPageShell })),
)

export const Route = createFileRoute('/benefits/$slug')({
  loader: async ({ params }) => {
    const page = await loadBenefitPage(params.slug)
    if (!page) throw notFound()
    return { page }
  },
  headers: ({ loaderData }) => (loaderData?.page.indexed ? {} : xRobotsNoindexHeaders()),
  head: ({ loaderData }) => (loaderData ? benefitHead(loaderData.page) : {}),
  component: BenefitRoute,
})

function BenefitRoute() {
  const { page } = Route.useLoaderData()
  return (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyBenefitPageShell page={page} />
    </Suspense>
  )
}
