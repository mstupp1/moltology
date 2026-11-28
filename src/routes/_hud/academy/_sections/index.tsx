import { createFileRoute } from '@tanstack/react-router'
import { AcademyHome } from '@/components/academy/AcademyHome'
import { AcademyFrame } from '@/components/academy/AcademyChrome'
import { HudSectionGhost } from '@/components/hud/HudGhostSkeletons'
import { EMPTY_ACADEMY_HOME } from '@/lib/academy'
import { seo } from '@/lib/seo'
import { getAcademyHomeFn } from '@/lib/server/academy-api'

export const Route = createFileRoute('/_hud/academy/_sections/')({
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
        title: 'Academy: courses and certificates | Moltology',
        description: 'Browse Molt Academy tracks and courses. Watch lectures, finish lessons, and earn certificates.',
        canonical: 'https://moltology.org/academy',
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
    links: [{ rel: 'canonical', href: 'https://moltology.org/academy' }],
  }),
  component: AcademyHomeRoute,
  pendingComponent: HudSectionGhost,
})

function AcademyHomeRoute() {
  const { home } = Route.useLoaderData()
  return (
    <AcademyFrame>
      <AcademyHome data={home} />
    </AcademyFrame>
  )
}
