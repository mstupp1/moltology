import { and, asc, eq, inArray } from 'drizzle-orm'
import { getDb } from '../../db'
import {
  academyCertificateAwards,
  academyCertificates,
  academyCourses,
  academyEnrollments,
  academyLessonProgress,
  academyLessons,
  academyModules,
  academyQuizQuestions,
  academyTrackCourses,
  academyTracks,
  profiles,
} from '../../db/schema'
import {
  ACADEMY_COPY,
  assembleAcademyHome,
  assembleCourseDetail,
  assembleLessonDetail,
  assembleTrackDetail,
  gradeQuiz,
  mintCredentialId,
  planCredentialAwards,
  type AcademyAwardRow,
  type AcademyCertificateRow,
  type AcademyCourseDetail,
  type AcademyCourseRow,
  type AcademyEnrollmentRow,
  type AcademyHomePayload,
  type AcademyLessonDetail,
  type AcademyLessonRow,
  type AcademyModuleRow,
  type AcademyProgressRow,
  type AcademyQuizQuestionRow,
  type AcademyTrackDetail,
  type AcademyTrackLinkRow,
  type AcademyTrackRow,
  type AcademyCredentialView,
  type QuizGradeResult,
} from '../academy'
import type {
  AcademyCertificateScope,
  AcademyEnrollmentStatus,
  AcademyLessonKind,
  AcademyLevel,
  AcademyProgressStatus,
  AcademyVideoProvider,
} from '../academy-types'
import { ensureUserProfile } from '../user-sync'
import { resolveWriteAuth, type WriteAuthContext, type WriteAuthData } from './write-auth'

type ReadContext = {
  user?: { sub?: string; id?: string; name?: string } | null
} | null | undefined

function readerId(context: ReadContext): string | null {
  return context?.user?.sub || context?.user?.id || null
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return value
}

function asLevel(value: string): AcademyLevel {
  if (value === 'intermediate' || value === 'advanced') return value
  return 'beginner'
}

function isDuplicate(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  const message = String((error as { message?: string } | null)?.message || error || '')
  return code === '23505' || /duplicate key/i.test(message)
}

function mapTrack(row: typeof academyTracks.$inferSelect): AcademyTrackRow {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    level: asLevel(row.level),
    estimatedHours: row.estimatedHours,
    outcomes: row.outcomes ?? [],
    coverImageUrl: row.coverImageUrl,
    sortOrder: row.sortOrder,
  }
}

function mapCourse(row: typeof academyCourses.$inferSelect): AcademyCourseRow {
  return {
    id: row.id,
    slug: row.slug,
    code: row.code,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    category: row.category,
    level: asLevel(row.level),
    instructorName: row.instructorName,
    instructorTitle: row.instructorTitle,
    estimatedMinutes: row.estimatedMinutes,
    outcomes: row.outcomes ?? [],
    coverImageUrl: row.coverImageUrl,
    sortOrder: row.sortOrder,
  }
}

function mapModule(row: typeof academyModules.$inferSelect): AcademyModuleRow {
  return {
    id: row.id,
    courseId: row.courseId,
    title: row.title,
    summary: row.summary,
    sortOrder: row.sortOrder,
  }
}

function mapLesson(row: typeof academyLessons.$inferSelect): AcademyLessonRow {
  return {
    id: row.id,
    courseId: row.courseId,
    moduleId: row.moduleId,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    kind: row.kind as AcademyLessonKind,
    durationSeconds: row.durationSeconds,
    videoUrl: row.videoUrl,
    videoProvider: (row.videoProvider as AcademyVideoProvider | null) ?? null,
    posterUrl: row.posterUrl,
    body: row.body,
    isPreview: row.isPreview,
    passingScore: row.passingScore,
    sortOrder: row.sortOrder,
  }
}

function mapQuestion(row: typeof academyQuizQuestions.$inferSelect): AcademyQuizQuestionRow {
  return {
    id: row.id,
    lessonId: row.lessonId,
    prompt: row.prompt,
    choices: row.choices ?? [],
    correctIndex: row.correctIndex,
    explanation: row.explanation,
    sortOrder: row.sortOrder,
  }
}

function mapEnrollment(row: typeof academyEnrollments.$inferSelect): AcademyEnrollmentRow {
  return {
    courseId: row.courseId,
    status: row.status as AcademyEnrollmentStatus,
    enrolledAt: iso(row.enrolledAt),
    completedAt: iso(row.completedAt),
  }
}

function mapProgress(row: typeof academyLessonProgress.$inferSelect): AcademyProgressRow {
  return {
    lessonId: row.lessonId,
    courseId: row.courseId,
    status: row.status as AcademyProgressStatus,
    progressPercent: row.progressPercent,
    lastPositionSeconds: row.lastPositionSeconds,
    quizScore: row.quizScore,
    quizPassed: row.quizPassed,
    note: row.note,
  }
}

function mapCertificate(row: typeof academyCertificates.$inferSelect): AcademyCertificateRow {
  return {
    id: row.id,
    slug: row.slug,
    scope: row.scope as AcademyCertificateScope,
    courseId: row.courseId,
    trackId: row.trackId,
    title: row.title,
    description: row.description,
  }
}

function mapAward(row: typeof academyCertificateAwards.$inferSelect, holderName?: string | null): AcademyAwardRow {
  return {
    certificateId: row.certificateId,
    credentialId: row.credentialId,
    issuedAt: iso(row.issuedAt) ?? new Date(0).toISOString(),
    holderName,
  }
}

async function publishedCatalog(db: ReturnType<typeof getDb>) {
  const [tracks, courses, links, modules, lessons, certificates] = await Promise.all([
    db.select().from(academyTracks).where(eq(academyTracks.status, 'published')).orderBy(asc(academyTracks.sortOrder)),
    db.select().from(academyCourses).where(eq(academyCourses.status, 'published')).orderBy(asc(academyCourses.sortOrder)),
    db.select().from(academyTrackCourses).orderBy(asc(academyTrackCourses.sortOrder)),
    db.select().from(academyModules).orderBy(asc(academyModules.sortOrder)),
    db.select().from(academyLessons).orderBy(asc(academyLessons.sortOrder)),
    db.select().from(academyCertificates),
  ])
  const publishedCourseIds = new Set(courses.map((course) => course.id))
  const publishedTrackIds = new Set(tracks.map((track) => track.id))
  return {
    tracks: tracks.map(mapTrack),
    courses: courses.map(mapCourse),
    links: links
      .filter((link) => publishedTrackIds.has(link.trackId) && publishedCourseIds.has(link.courseId))
      .map((link): AcademyTrackLinkRow => ({
        trackId: link.trackId,
        courseId: link.courseId,
        sortOrder: link.sortOrder,
        required: link.required,
      })),
    modules: modules.filter((module) => publishedCourseIds.has(module.courseId)).map(mapModule),
    lessons: lessons.filter((lesson) => publishedCourseIds.has(lesson.courseId)).map(mapLesson),
    certificates: certificates
      .filter((certificate) => {
        if (certificate.courseId) return publishedCourseIds.has(certificate.courseId)
        if (certificate.trackId) return publishedTrackIds.has(certificate.trackId)
        return false
      })
      .map(mapCertificate),
  }
}

async function learnerState(db: ReturnType<typeof getDb>, userId: string | null) {
  if (!userId) {
    return { enrollments: [] as AcademyEnrollmentRow[], progress: [] as AcademyProgressRow[], awards: [] as AcademyAwardRow[] }
  }
  const [enrollments, progress, awards] = await Promise.all([
    db.select().from(academyEnrollments).where(eq(academyEnrollments.userId, userId)),
    db.select().from(academyLessonProgress).where(eq(academyLessonProgress.userId, userId)),
    db.select().from(academyCertificateAwards).where(eq(academyCertificateAwards.userId, userId)),
  ])
  return {
    enrollments: enrollments.map(mapEnrollment),
    progress: progress.map(mapProgress),
    awards: awards.map((row) => mapAward(row)),
  }
}

export async function getAcademyHomeHandler(args: { context?: ReadContext }): Promise<AcademyHomePayload> {
  const db = getDb()
  const userId = readerId(args.context)
  const [catalog, learner] = await Promise.all([publishedCatalog(db), learnerState(db, userId)])
  return assembleAcademyHome({ ...catalog, ...learner })
}

async function courseBySlug(db: ReturnType<typeof getDb>, slug: string) {
  const [course] = await db
    .select()
    .from(academyCourses)
    .where(and(eq(academyCourses.slug, slug), eq(academyCourses.status, 'published')))
    .limit(1)
  return course ?? null
}

export async function getAcademyCourseHandler(args: {
  data: { slug: string }
  context?: ReadContext
}): Promise<AcademyCourseDetail | null> {
  const db = getDb()
  const course = await courseBySlug(db, args.data.slug)
  if (!course) return null
  const userId = readerId(args.context)
  const [modules, lessons, links, certificates, enrollmentRows, progressRows, awardRows] = await Promise.all([
    db.select().from(academyModules).where(eq(academyModules.courseId, course.id)).orderBy(asc(academyModules.sortOrder)),
    db.select().from(academyLessons).where(eq(academyLessons.courseId, course.id)).orderBy(asc(academyLessons.sortOrder)),
    db.select().from(academyTrackCourses).where(eq(academyTrackCourses.courseId, course.id)),
    db.select().from(academyCertificates).where(eq(academyCertificates.courseId, course.id)),
    userId
      ? db.select().from(academyEnrollments).where(and(eq(academyEnrollments.userId, userId), eq(academyEnrollments.courseId, course.id)))
      : Promise.resolve([]),
    userId
      ? db.select().from(academyLessonProgress).where(and(eq(academyLessonProgress.userId, userId), eq(academyLessonProgress.courseId, course.id)))
      : Promise.resolve([]),
    userId
      ? db.select().from(academyCertificateAwards).where(eq(academyCertificateAwards.userId, userId))
      : Promise.resolve([]),
  ])
  const trackIds = links.map((link) => link.trackId)
  const tracks = trackIds.length
    ? await db.select().from(academyTracks).where(and(inArray(academyTracks.id, trackIds), eq(academyTracks.status, 'published')))
    : []
  const certificate = certificates[0] ? mapCertificate(certificates[0]) : null
  const award = certificate ? awardRows.find((row) => row.certificateId === certificate.id) : undefined
  return assembleCourseDetail({
    course: mapCourse(course),
    modules: modules.map(mapModule),
    lessons: lessons.map(mapLesson),
    tracks: tracks.map(mapTrack),
    links: links.map((link) => ({
      trackId: link.trackId,
      courseId: link.courseId,
      sortOrder: link.sortOrder,
      required: link.required,
    })),
    enrollment: enrollmentRows[0] ? mapEnrollment(enrollmentRows[0]) : null,
    progress: progressRows.map(mapProgress),
    certificate,
    award: award ? mapAward(award) : null,
  })
}

export async function getAcademyTrackHandler(args: {
  data: { slug: string }
  context?: ReadContext
}): Promise<AcademyTrackDetail | null> {
  const db = getDb()
  const [track] = await db
    .select()
    .from(academyTracks)
    .where(and(eq(academyTracks.slug, args.data.slug), eq(academyTracks.status, 'published')))
    .limit(1)
  if (!track) return null
  const userId = readerId(args.context)
  const links = await db.select().from(academyTrackCourses).where(eq(academyTrackCourses.trackId, track.id))
  const courseIds = links.map((link) => link.courseId)
  const [courses, lessons, certificates] = await Promise.all([
    courseIds.length
      ? db.select().from(academyCourses).where(and(inArray(academyCourses.id, courseIds), eq(academyCourses.status, 'published')))
      : Promise.resolve([]),
    courseIds.length
      ? db.select().from(academyLessons).where(inArray(academyLessons.courseId, courseIds))
      : Promise.resolve([]),
    db.select().from(academyCertificates).where(eq(academyCertificates.trackId, track.id)),
  ])
  const learner = await learnerState(db, userId)
  const certificate = certificates[0] ? mapCertificate(certificates[0]) : null
  const award = certificate ? learner.awards.find((row) => row.certificateId === certificate.id) : undefined
  return assembleTrackDetail({
    track: mapTrack(track),
    courses: courses.map(mapCourse),
    links: links.map((link) => ({
      trackId: link.trackId,
      courseId: link.courseId,
      sortOrder: link.sortOrder,
      required: link.required,
    })),
    lessons: lessons.map(mapLesson),
    enrollments: learner.enrollments,
    progress: learner.progress,
    certificate,
    award: award ?? null,
  })
}

export async function getAcademyLessonHandler(args: {
  data: { courseSlug: string; lessonSlug: string }
  context?: ReadContext
}): Promise<AcademyLessonDetail | null> {
  const db = getDb()
  const course = await courseBySlug(db, args.data.courseSlug)
  if (!course) return null
  const [lesson] = await db
    .select()
    .from(academyLessons)
    .where(and(eq(academyLessons.courseId, course.id), eq(academyLessons.slug, args.data.lessonSlug)))
    .limit(1)
  if (!lesson) return null
  const userId = readerId(args.context)
  const [modules, lessons, questions, enrollmentRows, progressRows] = await Promise.all([
    db.select().from(academyModules).where(eq(academyModules.courseId, course.id)),
    db.select().from(academyLessons).where(eq(academyLessons.courseId, course.id)),
    db.select().from(academyQuizQuestions).where(eq(academyQuizQuestions.lessonId, lesson.id)),
    userId
      ? db.select().from(academyEnrollments).where(and(eq(academyEnrollments.userId, userId), eq(academyEnrollments.courseId, course.id)))
      : Promise.resolve([]),
    userId
      ? db.select().from(academyLessonProgress).where(and(eq(academyLessonProgress.userId, userId), eq(academyLessonProgress.courseId, course.id)))
      : Promise.resolve([]),
  ])
  return assembleLessonDetail({
    course: mapCourse(course),
    modules: modules.map(mapModule),
    lessons: lessons.map(mapLesson),
    lesson: mapLesson(lesson),
    questions: questions.map(mapQuestion),
    enrolled: enrollmentRows.length > 0,
    progressRows: progressRows.map(mapProgress),
  })
}

export async function getAcademyCertificateHandler(args: {
  data: { credentialId: string }
}): Promise<AcademyCredentialView | null> {
  const db = getDb()
  const [award] = await db
    .select()
    .from(academyCertificateAwards)
    .where(eq(academyCertificateAwards.credentialId, args.data.credentialId))
    .limit(1)
  if (!award) return null
  const [certificate] = await db
    .select()
    .from(academyCertificates)
    .where(eq(academyCertificates.id, award.certificateId))
    .limit(1)
  if (!certificate) return null
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, award.userId)).limit(1)
  let subjectTitle = 'Molt Academy'
  let subjectSlug = ''
  if (certificate.courseId) {
    const [course] = await db.select().from(academyCourses).where(eq(academyCourses.id, certificate.courseId)).limit(1)
    if (course) {
      subjectTitle = course.title
      subjectSlug = course.slug
    }
  } else if (certificate.trackId) {
    const [track] = await db.select().from(academyTracks).where(eq(academyTracks.id, certificate.trackId)).limit(1)
    if (track) {
      subjectTitle = track.title
      subjectSlug = track.slug
    }
  }
  return {
    credentialId: award.credentialId,
    title: certificate.title,
    description: certificate.description,
    scope: certificate.scope as AcademyCertificateScope,
    issuedAt: iso(award.issuedAt) ?? new Date(0).toISOString(),
    holderName: profile?.handle || profile?.larvaId || 'Member',
    subjectTitle,
    subjectSlug,
  }
}

async function requireCourse(db: ReturnType<typeof getDb>, slug: string) {
  const course = await courseBySlug(db, slug)
  if (!course) throw new Error(ACADEMY_COPY.missingCourse)
  return course
}

async function enrollUser(db: ReturnType<typeof getDb>, userId: string, courseId: string) {
  const [existing] = await db
    .select()
    .from(academyEnrollments)
    .where(and(eq(academyEnrollments.userId, userId), eq(academyEnrollments.courseId, courseId)))
    .limit(1)
  if (existing) return existing
  try {
    const [created] = await db
      .insert(academyEnrollments)
      .values({ userId, courseId, status: 'active' })
      .returning()
    return created
  } catch (error) {
    if (!isDuplicate(error)) throw error
    const [retry] = await db
      .select()
      .from(academyEnrollments)
      .where(and(eq(academyEnrollments.userId, userId), eq(academyEnrollments.courseId, courseId)))
      .limit(1)
    if (!retry) throw error
    return retry
  }
}

async function syncCredentials(db: ReturnType<typeof getDb>, userId: string, courseId: string) {
  const [lessons, progress, courseCertificates, links, awards, enrollments] = await Promise.all([
    db.select({ id: academyLessons.id }).from(academyLessons).where(eq(academyLessons.courseId, courseId)),
    db.select().from(academyLessonProgress).where(and(eq(academyLessonProgress.userId, userId), eq(academyLessonProgress.courseId, courseId))),
    db.select().from(academyCertificates).where(eq(academyCertificates.courseId, courseId)),
    db.select().from(academyTrackCourses).where(eq(academyTrackCourses.courseId, courseId)),
    db.select().from(academyCertificateAwards).where(eq(academyCertificateAwards.userId, userId)),
    db.select().from(academyEnrollments).where(eq(academyEnrollments.userId, userId)),
  ])
  const trackIds = links.map((link) => link.trackId)
  const trackLinks = trackIds.length
    ? await db.select().from(academyTrackCourses).where(inArray(academyTrackCourses.trackId, trackIds))
    : []
  const trackCertificates = trackIds.length
    ? await db.select().from(academyCertificates).where(inArray(academyCertificates.trackId, trackIds))
    : []
  const completedCourseIds = enrollments.filter((row) => row.status === 'completed').map((row) => row.courseId)
  const decision = planCredentialAwards({
    courseId,
    courseLessonIds: lessons.map((lesson) => lesson.id),
    completedLessonIds: progress.filter((row) => row.status === 'completed').map((row) => row.lessonId),
    courseCertificateId: courseCertificates[0]?.id ?? null,
    completedCourseIds,
    alreadyAwardedIds: awards.map((row) => row.certificateId),
    tracks: trackIds.map((trackId) => ({
      certificateId: trackCertificates.find((certificate) => certificate.trackId === trackId)?.id ?? null,
      requiredCourseIds: trackLinks.filter((link) => link.trackId === trackId && link.required).map((link) => link.courseId),
    })),
  })
  if (decision.courseComplete) {
    await db
      .update(academyEnrollments)
      .set({ status: 'completed', completedAt: new Date() })
      .where(and(eq(academyEnrollments.userId, userId), eq(academyEnrollments.courseId, courseId)))
  }
  const awarded: string[] = []
  for (const certificateId of decision.awardCertificateIds) {
    try {
      const [created] = await db
        .insert(academyCertificateAwards)
        .values({
          userId,
          certificateId,
          credentialId: mintCredentialId(),
        })
        .returning()
      if (created) awarded.push(created.credentialId)
    } catch (error) {
      if (!isDuplicate(error)) throw error
    }
  }
  return awarded
}

async function resolveActor(args: { data?: WriteAuthData | null; context?: WriteAuthContext | null }) {
  const auth = await resolveWriteAuth({ data: args.data, context: args.context })
  if (!auth) throw new Error('Unauthenticated: Authentication required.')
  await ensureUserProfile(auth.userId)
  return auth
}

export async function enrollAcademyCourseHandler(args: {
  data: { slug: string; token?: string; userId?: string }
  context?: WriteAuthContext | null
}): Promise<AcademyCourseDetail> {
  const auth = await resolveActor(args)
  const course = await requireCourse(auth.dbClient, args.data.slug)
  await enrollUser(auth.dbClient, auth.userId, course.id)
  const detail = await getAcademyCourseHandler({
    data: { slug: course.slug },
    context: { user: { sub: auth.userId } },
  })
  if (!detail) throw new Error(ACADEMY_COPY.missingCourse)
  return detail
}

export async function enrollAcademyTrackHandler(args: {
  data: { slug: string; token?: string; userId?: string }
  context?: WriteAuthContext | null
}): Promise<AcademyTrackDetail> {
  const auth = await resolveActor(args)
  const detailBefore = await getAcademyTrackHandler({
    data: { slug: args.data.slug },
    context: { user: { sub: auth.userId } },
  })
  if (!detailBefore) throw new Error(ACADEMY_COPY.missingTrack)
  const [track] = await auth.dbClient
    .select()
    .from(academyTracks)
    .where(eq(academyTracks.slug, args.data.slug))
    .limit(1)
  if (!track) throw new Error(ACADEMY_COPY.missingTrack)
  const links = await auth.dbClient.select().from(academyTrackCourses).where(eq(academyTrackCourses.trackId, track.id))
  for (const link of links) {
    await enrollUser(auth.dbClient, auth.userId, link.courseId)
  }
  const detail = await getAcademyTrackHandler({
    data: { slug: args.data.slug },
    context: { user: { sub: auth.userId } },
  })
  if (!detail) throw new Error(ACADEMY_COPY.missingTrack)
  return detail
}

export async function saveAcademyLessonHandler(args: {
  data: {
    courseSlug: string
    lessonSlug: string
    action: 'complete' | 'position' | 'note'
    lastPositionSeconds?: number
    note?: string
    token?: string
    userId?: string
  }
  context?: WriteAuthContext | null
}): Promise<{ lesson: AcademyLessonDetail; awardedCredentialIds: string[] }> {
  const auth = await resolveActor(args)
  const course = await requireCourse(auth.dbClient, args.data.courseSlug)
  const [lesson] = await auth.dbClient
    .select()
    .from(academyLessons)
    .where(and(eq(academyLessons.courseId, course.id), eq(academyLessons.slug, args.data.lessonSlug)))
    .limit(1)
  if (!lesson) throw new Error(ACADEMY_COPY.missingLesson)
  await enrollUser(auth.dbClient, auth.userId, course.id)
  const [existing] = await auth.dbClient
    .select()
    .from(academyLessonProgress)
    .where(and(eq(academyLessonProgress.userId, auth.userId), eq(academyLessonProgress.lessonId, lesson.id)))
    .limit(1)

  const alreadyComplete = existing?.status === 'completed'
  let status: AcademyProgressStatus = existing?.status ?? 'in_progress'
  let progressPercent = existing?.progressPercent ?? 0
  let completedAt = existing?.completedAt ?? null
  let lastPositionSeconds = existing?.lastPositionSeconds ?? 0
  let note = existing?.note ?? null

  if (args.data.action === 'complete') {
    if (lesson.kind === 'quiz' && !existing?.quizPassed) {
      throw new Error('Pass the quiz to complete this lesson.')
    }
    status = 'completed'
    progressPercent = 100
    completedAt = existing?.completedAt ?? new Date()
  } else if (args.data.action === 'position') {
    lastPositionSeconds = Math.max(0, Math.floor(args.data.lastPositionSeconds ?? 0))
    if (!alreadyComplete) {
      status = 'in_progress'
      progressPercent = Math.max(progressPercent, 1)
    }
  } else {
    note = (args.data.note ?? '').slice(0, 4000)
  }

  if (existing) {
    await auth.dbClient
      .update(academyLessonProgress)
      .set({
        status,
        progressPercent,
        lastPositionSeconds,
        note,
        completedAt,
        updatedAt: new Date(),
      })
      .where(eq(academyLessonProgress.id, existing.id))
  } else {
    await auth.dbClient.insert(academyLessonProgress).values({
      userId: auth.userId,
      lessonId: lesson.id,
      courseId: course.id,
      status,
      progressPercent,
      lastPositionSeconds,
      note,
      completedAt,
      quizPassed: false,
    })
  }

  const awardedCredentialIds = status === 'completed'
    ? await syncCredentials(auth.dbClient, auth.userId, course.id)
    : []
  const lessonDetail = await getAcademyLessonHandler({
    data: { courseSlug: course.slug, lessonSlug: lesson.slug },
    context: { user: { sub: auth.userId } },
  })
  if (!lessonDetail) throw new Error(ACADEMY_COPY.missingLesson)
  return { lesson: lessonDetail, awardedCredentialIds }
}

export async function submitAcademyQuizHandler(args: {
  data: {
    courseSlug: string
    lessonSlug: string
    answers: Record<string, number>
    token?: string
    userId?: string
  }
  context?: WriteAuthContext | null
}): Promise<{ lesson: AcademyLessonDetail; grade: QuizGradeResult; awardedCredentialIds: string[] }> {
  const auth = await resolveActor(args)
  const course = await requireCourse(auth.dbClient, args.data.courseSlug)
  const [lesson] = await auth.dbClient
    .select()
    .from(academyLessons)
    .where(and(eq(academyLessons.courseId, course.id), eq(academyLessons.slug, args.data.lessonSlug)))
    .limit(1)
  if (!lesson || lesson.kind !== 'quiz') throw new Error(ACADEMY_COPY.missingLesson)
  await enrollUser(auth.dbClient, auth.userId, course.id)
  const questions = await auth.dbClient
    .select()
    .from(academyQuizQuestions)
    .where(eq(academyQuizQuestions.lessonId, lesson.id))
    .orderBy(asc(academyQuizQuestions.sortOrder))
  const grade = gradeQuiz(
    questions.map((question) => ({
      id: question.id,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
    })),
    args.data.answers,
    lesson.passingScore,
  )
  const [existing] = await auth.dbClient
    .select()
    .from(academyLessonProgress)
    .where(and(eq(academyLessonProgress.userId, auth.userId), eq(academyLessonProgress.lessonId, lesson.id)))
    .limit(1)
  const passed = grade.passed || Boolean(existing?.quizPassed)
  const status: AcademyProgressStatus = passed ? 'completed' : 'in_progress'
  const values = {
    status,
    progressPercent: passed ? 100 : grade.scorePercent,
    quizScore: grade.passed ? grade.scorePercent : existing?.quizScore ?? grade.scorePercent,
    quizPassed: passed,
    completedAt: passed ? existing?.completedAt ?? new Date() : null,
    updatedAt: new Date(),
  }
  if (existing) {
    await auth.dbClient.update(academyLessonProgress).set(values).where(eq(academyLessonProgress.id, existing.id))
  } else {
    await auth.dbClient.insert(academyLessonProgress).values({
      userId: auth.userId,
      lessonId: lesson.id,
      courseId: course.id,
      lastPositionSeconds: 0,
      ...values,
    })
  }
  const awardedCredentialIds = passed ? await syncCredentials(auth.dbClient, auth.userId, course.id) : []
  const lessonDetail = await getAcademyLessonHandler({
    data: { courseSlug: course.slug, lessonSlug: lesson.slug },
    context: { user: { sub: auth.userId } },
  })
  if (!lessonDetail) throw new Error(ACADEMY_COPY.missingLesson)
  return { lesson: lessonDetail, grade, awardedCredentialIds }
}
