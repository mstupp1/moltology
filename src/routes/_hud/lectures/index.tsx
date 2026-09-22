import { createFileRoute } from '@tanstack/react-router'
import { AcademyHome } from '@/components/academy/AcademyHome'
import { AcademyFrame } from '@/components/academy/AcademyChrome'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { EMPTY_ACADEMY_HOME } from '@/lib/academy'
import { seo } from '@/lib/seo'
import { getAcademyHomeFn } from '@/lib/server/academy-api'

export const Route = createFileRoute('/_hud/lectures/')({
  loader: async () => {
    try {
      const home = await getAcademyHomeFn()
      return { home: home ?? EMPTY_ACADEMY_HOME }
    } catch (error) {
      console.warn('Academy home loader error:', error)
      return { home: EMPTY_ACADEMY_HOME }
    }
  },
  head: () => ({
    meta: [
      ...seo({
        title: 'Molt Academy | Courses, Tracks, and Certifications',
        description: 'Browse Molt Academy tracks and courses. Watch lectures, finish lessons, and earn certifications.',
        canonical: 'https://moltology.org/lectures',
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
    links: [{ rel: 'canonical', href: 'https://moltology.org/lectures' }],
  }),
  component: AcademyHomeRoute,
  pendingComponent: HudWorkspaceGhost,
})

function AcademyHomeRoute() {
  const { home } = Route.useLoaderData()
  return (
    <AcademyFrame>
      <AcademyHome data={home} />
    </AcademyFrame>
  )
}
