import { describe, expect, it } from 'vitest'
import { ACADEMY_COURSES, ACADEMY_TRACKS } from './academy-catalog'
import {
  assembleAcademyHome,
  courseProgressPercent,
  filterCourseCards,
  formatIssuedDate,
  formatLessonDuration,
  gradeQuiz,
  mintCredentialId,
  planCredentialAwards,
  resumeLessonSlug,
  vimeoEmbedUrl,
  youtubeEmbedUrl,
  type AcademyCourseRow,
  type AcademyLessonRow,
  type AcademyModuleRow,
  type AcademyTrackRow,
} from './academy'

function catalogFixture() {
  const courses: AcademyCourseRow[] = ACADEMY_COURSES.map((course) => ({
    id: course.id,
    slug: course.slug,
    code: course.code,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    category: course.category,
    level: course.level,
    instructorName: course.instructorName,
    instructorTitle: course.instructorTitle,
    estimatedMinutes: course.estimatedMinutes,
    outcomes: course.outcomes,
    coverImageUrl: course.coverImageUrl,
    sortOrder: course.sortOrder,
  }))
  const tracks: AcademyTrackRow[] = ACADEMY_TRACKS.map((track) => ({
    id: track.id,
    slug: track.slug,
    title: track.title,
    subtitle: track.subtitle,
    description: track.description,
    level: track.level,
    estimatedHours: track.estimatedHours,
    outcomes: track.outcomes,
    coverImageUrl: track.coverImageUrl,
    sortOrder: track.sortOrder,
  }))
  const modules: AcademyModuleRow[] = ACADEMY_COURSES.flatMap((course, courseIndex) =>
    course.modules.map((module, moduleIndex) => ({
      id: module.id,
      courseId: course.id,
      title: module.title,
      summary: module.summary,
      sortOrder: courseIndex * 10 + moduleIndex + 1,
    })),
  )
  const lessons: AcademyLessonRow[] = ACADEMY_COURSES.flatMap((course) =>
    course.modules.flatMap((module, moduleIndex) =>
      module.lessons.map((lesson, lessonIndex) => ({
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
        sortOrder: moduleIndex * 10 + lessonIndex + 1,
      })),
    ),
  )
  const links = ACADEMY_TRACKS.flatMap((track) =>
    track.courseIds.map((courseId, index) => ({
      trackId: track.id,
      courseId,
      sortOrder: index + 1,
      required: true,
    })),
  )
  const certificates = [
    ...ACADEMY_COURSES.map((course) => ({
      id: course.certificate.id,
      slug: course.certificate.slug,
      scope: 'course' as const,
      courseId: course.id,
      trackId: null,
      title: course.certificate.title,
      description: course.certificate.description,
    })),
    ...ACADEMY_TRACKS.map((track) => ({
      id: track.certificate.id,
      slug: track.certificate.slug,
      scope: 'track' as const,
      courseId: null,
      trackId: track.id,
      title: track.certificate.title,
      description: track.certificate.description,
    })),
  ]
  return { courses, tracks, modules, lessons, links, certificates }
}

describe('academy catalog rules', () => {
  it('assembles the placeholder catalog into tracks, courses, and certifications', () => {
    const fixture = catalogFixture()
    const home = assembleAcademyHome({
      ...fixture,
      enrollments: [],
      progress: [],
      awards: [],
    })
    expect(home.tracks.map((track) => track.slug)).toEqual(['first-shell', 'abyssal-systems'])
    expect(home.courses).toHaveLength(4)
    expect(home.courses[0]?.code).toBe('MOLT-101')
    expect(home.courses.every((course) => course.lessonCount > 0)).toBe(true)
    expect(home.certificates).toHaveLength(6)
    expect(home.continueLearning).toEqual([])
    expect(home.categories).toEqual(['Armor', 'Attention', 'Foundations', 'Systems'])
  })

  it('puts an in-progress enrollment on continue learning and resumes the next lesson', () => {
    const fixture = catalogFixture()
    const course = fixture.courses[0]!
    const courseLessons = fixture.lessons.filter((lesson) => lesson.courseId === course.id)
    const home = assembleAcademyHome({
      ...fixture,
      enrollments: [{ courseId: course.id, status: 'active', enrolledAt: '2026-09-01T00:00:00.000Z', completedAt: null }],
      progress: [{
        lessonId: courseLessons[0]!.id,
        courseId: course.id,
        status: 'completed',
        progressPercent: 100,
        lastPositionSeconds: 0,
        quizScore: null,
        quizPassed: false,
        note: null,
      }],
      awards: [],
    })
    expect(home.continueLearning).toHaveLength(1)
    expect(home.continueLearning[0]?.slug).toBe(course.slug)
    expect(home.continueLearning[0]?.resumeLessonSlug).toBe(courseLessons[1]?.slug)
    expect(home.continueLearning[0]?.progressPercent).toBe(courseProgressPercent(
      courseLessons.map((lesson) => lesson.id),
      [courseLessons[0]!.id],
    ))
  })

  it('filters the course grid by level, subject, and search text', () => {
    const fixture = catalogFixture()
    const home = assembleAcademyHome({ ...fixture, enrollments: [], progress: [], awards: [] })
    expect(filterCourseCards(home.courses, { level: 'advanced' }).map((course) => course.code)).toEqual(['MOLT-305'])
    expect(filterCourseCards(home.courses, { category: 'Foundations' })).toHaveLength(1)
    expect(filterCourseCards(home.courses, { q: 'vess' }).map((course) => course.code)).toEqual(['MOLT-101'])
    expect(filterCourseCards(home.courses, { q: 'no-such-course' })).toHaveLength(0)
  })

  it('grades a quiz against the lesson pass mark', () => {
    const questions = [
      { id: 'q1', correctIndex: 1, explanation: 'One habit.' },
      { id: 'q2', correctIndex: 0, explanation: 'Room to harden.' },
    ]
    const passed = gradeQuiz(questions, { q1: 1, q2: 0 }, 80)
    expect(passed.passed).toBe(true)
    expect(passed.scorePercent).toBe(100)
    const failed = gradeQuiz(questions, { q1: 0 }, 80)
    expect(failed.passed).toBe(false)
    expect(failed.correctCount).toBe(0)
    expect(failed.results[1]?.selectedIndex).toBeNull()
  })

  it('issues a course credential, then a track credential when every required course is done', () => {
    const courseOnly = planCredentialAwards({
      courseId: 'course-a',
      courseLessonIds: ['l1', 'l2'],
      completedLessonIds: ['l1', 'l2'],
      courseCertificateId: 'cert-a',
      completedCourseIds: [],
      alreadyAwardedIds: [],
      tracks: [{ certificateId: 'cert-track', requiredCourseIds: ['course-a', 'course-b'] }],
    })
    expect(courseOnly.courseComplete).toBe(true)
    expect(courseOnly.awardCertificateIds).toEqual(['cert-a'])

    const trackDone = planCredentialAwards({
      courseId: 'course-b',
      courseLessonIds: ['l3'],
      completedLessonIds: ['l3'],
      courseCertificateId: 'cert-b',
      completedCourseIds: ['course-a'],
      alreadyAwardedIds: ['cert-a'],
      tracks: [{ certificateId: 'cert-track', requiredCourseIds: ['course-a', 'course-b'] }],
    })
    expect(trackDone.awardCertificateIds).toEqual(['cert-b', 'cert-track'])

    const repeat = planCredentialAwards({
      courseId: 'course-b',
      courseLessonIds: ['l3'],
      completedLessonIds: ['l3'],
      courseCertificateId: 'cert-b',
      completedCourseIds: ['course-a', 'course-b'],
      alreadyAwardedIds: ['cert-b', 'cert-track'],
      tracks: [{ certificateId: 'cert-track', requiredCourseIds: ['course-a', 'course-b'] }],
    })
    expect(repeat.awardCertificateIds).toEqual([])
  })

  it('formats durations, dates, resume order, and video embeds', () => {
    expect(formatLessonDuration(12 * 60)).toBe('12 min')
    expect(formatLessonDuration(90 * 60)).toBe('1 hr 30 min')
    expect(formatIssuedDate('2026-09-01T12:00:00.000Z')).toBe('September 1, 2026')
    expect(resumeLessonSlug([
      { id: 'b', slug: 'second', courseId: 'c', moduleSort: 1, lessonSort: 2 },
      { id: 'a', slug: 'first', courseId: 'c', moduleSort: 1, lessonSort: 1 },
    ], ['a'])).toBe('second')
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=abc123')).toBe('https://www.youtube-nocookie.com/embed/abc123')
    expect(youtubeEmbedUrl('https://youtu.be/xyz')).toBe('https://www.youtube-nocookie.com/embed/xyz')
    expect(vimeoEmbedUrl('https://vimeo.com/123456')).toBe('https://player.vimeo.com/video/123456')
    expect(youtubeEmbedUrl('not a url')).toBeNull()
    expect(mintCredentialId(() => 0)).toBe('MOLT-AAAAAAAA')
  })
})
