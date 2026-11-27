import React, { Suspense, lazy } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'
import '@/components/benefits/benefits.css'
import arcadeStyles from '@/components/benefits/kits/arcade/arcade.css?url'
import atelierStyles from '@/components/benefits/kits/atelier/atelier.css?url'
import canStyles from '@/components/benefits/kits/can/can.css?url'
import clinicStyles from '@/components/benefits/kits/clinic/clinic.css?url'
import ledgerStyles from '@/components/benefits/kits/ledger/ledger.css?url'
import lockerStyles from '@/components/benefits/kits/locker/locker.css?url'
import networkStyles from '@/components/benefits/kits/network/network.css?url'
import platformStyles from '@/components/benefits/kits/platform/platform.css?url'
import retreatStyles from '@/components/benefits/kits/retreat/retreat.css?url'
import seminarStyles from '@/components/benefits/kits/seminar/seminar.css?url'
import { loadBenefitPage } from '@/lib/benefits/registry'
import { benefitHead } from '@/lib/benefits/seo'
import type { BenefitKit } from '@/lib/benefits/types'
import { xRobotsNoindexHeaders } from '@/lib/seo'

const kitStyles = {
  arcade: arcadeStyles,
  atelier: atelierStyles,
  can: canStyles,
  clinic: clinicStyles,
  ledger: ledgerStyles,
  locker: lockerStyles,
  network: networkStyles,
  platform: platformStyles,
  retreat: retreatStyles,
  seminar: seminarStyles,
} satisfies Record<BenefitKit, string>

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
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { page } = loaderData
    const head = benefitHead(page)
    // Load the active theme with the HTML, before its lazy component hydrates.
    return {
      ...head,
      links: [
        ...head.links,
        { rel: 'stylesheet', href: kitStyles[page.kit] },
      ],
    }
  },
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
