import { createFileRoute } from '@tanstack/react-router'
import { AcademyCertificateIndex } from '@/components/academy/AcademyCertificateViews'
import { AcademyFrame } from '@/components/academy/AcademyChrome'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { EMPTY_ACADEMY_HOME } from '@/lib/academy'
import { seo } from '@/lib/seo'
import { getAcademyHomeFn } from '@/lib/server/academy-api'

export const Route = createFileRoute('/_hud/lectures/certificates/')({
  loader: async () => {
    try {
      const home = await getAcademyHomeFn()
      return { home: home ?? EMPTY_ACADEMY_HOME }
    } catch (error) {
      console.warn('Academy certificates loader error:', error)
      return { home: EMPTY_ACADEMY_HOME }
    }
  },
  head: () => ({
    meta: [
      ...seo({
        title: 'Certifications | Molt Academy',
        description: 'Course and track certifications issued by Molt Academy.',
        canonical: 'https://moltology.org/lectures/certificates',
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
    links: [{ rel: 'canonical', href: 'https://moltology.org/lectures/certificates' }],
  }),
  component: AcademyCertificatesRoute,
  pendingComponent: HudWorkspaceGhost,
})

function AcademyCertificatesRoute() {
  const { home } = Route.useLoaderData()
  return (
    <AcademyFrame>
      <AcademyCertificateIndex data={home} />
    </AcademyFrame>
  )
}
