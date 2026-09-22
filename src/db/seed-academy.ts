import { ACADEMY_COURSES, ACADEMY_TRACKS } from '../lib/academy-catalog'
import * as schema from './schema'

type AcademySeedDb = {
  insert: (table: any) => any
  delete: (table: any) => any
}

/**
 * Inserts the placeholder academy catalog.
 * Existing slugs are left untouched so later content edits in the database survive a re-seed.
 */
export async function seedAcademyCatalog(db: AcademySeedDb) {
  for (const course of ACADEMY_COURSES) {
    await db
      .insert(schema.academyCourses)
      .values({
        id: course.id,
        slug: course.slug,
        code: course.code,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        category: course.category,
        level: course.level,
        coverImageUrl: course.coverImageUrl,
        instructorName: course.instructorName,
        instructorTitle: course.instructorTitle,
        estimatedMinutes: course.estimatedMinutes,
        outcomes: course.outcomes,
        status: 'published',
        sortOrder: course.sortOrder,
        publishedAt: new Date('2026-09-01T00:00:00.000Z'),
      })
      .onConflictDoNothing({ target: schema.academyCourses.slug })

    let moduleOrder = 0
    for (const module of course.modules) {
      moduleOrder += 1
      await db
        .insert(schema.academyModules)
        .values({
          id: module.id,
          courseId: course.id,
          title: module.title,
          summary: module.summary,
          sortOrder: moduleOrder,
        })
        .onConflictDoNothing({ target: schema.academyModules.id })

      let lessonOrder = 0
      for (const lesson of module.lessons) {
        lessonOrder += 1
        await db
          .insert(schema.academyLessons)
          .values({
            id: lesson.id,
            courseId: course.id,
            moduleId: module.id,
            slug: lesson.slug,
            title: lesson.title,
            summary: lesson.summary,
            kind: lesson.kind,
            durationSeconds: lesson.durationSeconds,
            videoUrl: lesson.videoUrl ?? null,
            videoProvider: lesson.videoProvider ?? null,
            posterUrl: lesson.posterUrl ?? null,
            body: lesson.body ?? null,
            isPreview: lesson.isPreview ?? false,
            passingScore: lesson.passingScore ?? 80,
            sortOrder: lessonOrder,
          })
          .onConflictDoNothing({ target: schema.academyLessons.id })

        let questionOrder = 0
        for (const question of lesson.questions ?? []) {
          questionOrder += 1
          await db
            .insert(schema.academyQuizQuestions)
            .values({
              id: question.id,
              lessonId: lesson.id,
              prompt: question.prompt,
              choices: question.choices,
              correctIndex: question.correctIndex,
              explanation: question.explanation,
              sortOrder: questionOrder,
            })
            .onConflictDoNothing({ target: schema.academyQuizQuestions.id })
        }
      }
    }

    await db
      .insert(schema.academyCertificates)
      .values({
        id: course.certificate.id,
        slug: course.certificate.slug,
        scope: 'course',
        courseId: course.id,
        trackId: null,
        title: course.certificate.title,
        description: course.certificate.description,
      })
      .onConflictDoNothing({ target: schema.academyCertificates.slug })
  }

  for (const track of ACADEMY_TRACKS) {
    await db
      .insert(schema.academyTracks)
      .values({
        id: track.id,
        slug: track.slug,
        title: track.title,
        subtitle: track.subtitle,
        description: track.description,
        level: track.level,
        coverImageUrl: track.coverImageUrl,
        estimatedHours: track.estimatedHours,
        outcomes: track.outcomes,
        status: 'published',
        sortOrder: track.sortOrder,
      })
      .onConflictDoNothing({ target: schema.academyTracks.slug })

    let order = 0
    for (const courseId of track.courseIds) {
      order += 1
      await db
        .insert(schema.academyTrackCourses)
        .values({
          trackId: track.id,
          courseId,
          sortOrder: order,
          required: true,
        })
        .onConflictDoNothing({ target: [schema.academyTrackCourses.trackId, schema.academyTrackCourses.courseId] })
    }

    await db
      .insert(schema.academyCertificates)
      .values({
        id: track.certificate.id,
        slug: track.certificate.slug,
        scope: 'track',
        courseId: null,
        trackId: track.id,
        title: track.certificate.title,
        description: track.certificate.description,
      })
      .onConflictDoNothing({ target: schema.academyCertificates.slug })
  }

  return {
    courses: ACADEMY_COURSES.length,
    tracks: ACADEMY_TRACKS.length,
  }
}
