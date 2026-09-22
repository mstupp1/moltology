import { createFileRoute } from '@tanstack/react-router'
import { AcademyCourseView } from '@/components/academy/AcademyCourseView'
import { AcademyFrame, AcademyMissing } from '@/components/academy/AcademyChrome'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { ACADEMY_COPY } from '@/lib/academy'
import { seo } from '@/lib/seo'
import { getAcademyCourseFn } from '@/lib/server/academy-api'

export const Route = createFileRoute('/_hud/lectures/courses/$slug/')({
  loader: async ({ params }) => {
    try {
      const course = await getAcademyCourseFn({ data: { slug: params.slug } })
      return { course }
    } catch (error) {
      console.warn('Academy course loader error:', error)
      return { course: null }
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      ...seo({
        title: loaderData?.course
          ? `${loaderData.course.title} | Molt Academy`
          : 'Course | Molt Academy',
        description: loaderData?.course?.description ?? 'A Molt Academy course.',
        canonical: `https://moltology.org/lectures/courses/${loaderData?.course?.slug ?? ''}`,
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
  }),
  component: AcademyCourseRoute,
  pendingComponent: HudWorkspaceGhost,
})

function AcademyCourseRoute() {
  const { course } = Route.useLoaderData()
  if (!course) return <AcademyMissing message={ACADEMY_COPY.missingCourse} />
  return (
    <AcademyFrame>
      <AcademyCourseView course={course} />
    </AcademyFrame>
  )
}
