import React, { Suspense, lazy } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { searchPageSeo, xRobotsNoindexHeaders } from '@/lib/seo'
import { parseSearchTab, type SearchTab } from '@/lib/command-catalog'

const LazySearchPage = lazy(() =>
  import('@/components/hud/search/SearchPage').then((m) => ({ default: m.SearchPage })),
)

const searchParamsSchema = z.object({
  q: z.string().optional().catch(''),
  type: z.enum(['people', 'pages']).optional().catch('people'),
})

export type HudSearchParams = {
  q: string
  type: SearchTab
}

function SearchRoute() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const q = search.q ?? ''
  const type = parseSearchTab(search.type)

  return (
    <Suspense fallback={<HudWorkspaceGhost />}>
      <LazySearchPage
        query={q}
        type={type}
        onQueryChange={(next) =>
          navigate({ to: '/search', search: { q: next, type }, replace: true })
        }
        onTypeChange={(next) =>
          navigate({ to: '/search', search: { q, type: next }, replace: true })
        }
      />
    </Suspense>
  )
}

export const Route = createFileRoute('/_hud/search')({
  validateSearch: (search: Record<string, unknown>): HudSearchParams => {
    const parsed = searchParamsSchema.parse(search)
    return {
      q: parsed.q ?? '',
      type: parseSearchTab(parsed.type),
    }
  },
  headers: () => xRobotsNoindexHeaders(),
  head: ({ search }) => ({
    meta: [...searchPageSeo(typeof search?.q === 'string' ? search.q : '')],
  }),
  component: SearchRoute,
  pendingComponent: HudWorkspaceGhost,
})
