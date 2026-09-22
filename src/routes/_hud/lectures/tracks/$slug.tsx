import { createFileRoute } from '@tanstack/react-router'
import { AcademyTrackView } from '@/components/academy/AcademyTrackView'
import { AcademyFrame, AcademyMissing } from '@/components/academy/AcademyChrome'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { ACADEMY_COPY } from '@/lib/academy'
import { seo } from '@/lib/seo'
import { getAcademyTrackFn } from '@/lib/server/academy-api'

export const Route = createFileRoute('/_hud/lectures/tracks/$slug')({
  loader: async ({ params }) => {
    try {
      const track = await getAcademyTrackFn({ data: { slug: params.slug } })
      return { track }
    } catch (error) {
      console.warn('Academy track loader error:', error)
      return { track: null }
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      ...seo({
        title: loaderData?.track ? `${loaderData.track.title} | Molt Academy` : 'Track | Molt Academy',
        description: loaderData?.track?.description ?? 'A Molt Academy track.',
        canonical: `https://moltology.org/lectures/tracks/${loaderData?.track?.slug ?? ''}`,
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
  }),
  component: AcademyTrackRoute,
  pendingComponent: HudWorkspaceGhost,
})

function AcademyTrackRoute() {
  const { track } = Route.useLoaderData()
  if (!track) return <AcademyMissing message={ACADEMY_COPY.missingTrack} />
  return (
    <AcademyFrame>
      <AcademyTrackView track={track} />
    </AcademyFrame>
  )
}
