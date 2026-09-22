import { createFileRoute } from '@tanstack/react-router'
import { AcademyLessonView } from '@/components/academy/AcademyLessonView'
import { AcademyFrame, AcademyMissing } from '@/components/academy/AcademyChrome'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { ACADEMY_COPY } from '@/lib/academy'
import { seo } from '@/lib/seo'
import { getAcademyLessonFn } from '@/lib/server/academy-api'

export const Route = createFileRoute('/_hud/lectures/courses/$slug/lessons/$lessonSlug')({
  loader: async ({ params }) => {
    try {
      const lesson = await getAcademyLessonFn({
        data: { courseSlug: params.slug, lessonSlug: params.lessonSlug },
      })
      return { lesson }
    } catch (error) {
      console.warn('Academy lesson loader error:', error)
      return { lesson: null }
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      ...seo({
        title: loaderData?.lesson
          ? `${loaderData.lesson.title} | Molt Academy`
          : 'Lesson | Molt Academy',
        description: loaderData?.lesson?.summary ?? 'A Molt Academy lesson.',
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
  }),
  component: AcademyLessonRoute,
  pendingComponent: HudWorkspaceGhost,
})

function AcademyLessonRoute() {
  const { lesson } = Route.useLoaderData()
  if (!lesson) return <AcademyMissing message={ACADEMY_COPY.missingLesson} />
  return (
    <AcademyFrame>
      <AcademyLessonView lesson={lesson} />
    </AcademyFrame>
  )
}
