import {
  ACADEMY_QUIZ_PASS_PERCENT,
  type AcademyCertificateScope,
  type AcademyEnrollmentStatus,
  type AcademyLessonKind,
  type AcademyLevel,
  type AcademyProgressStatus,
  type AcademyVideoProvider,
} from './academy-types'

export {
  ACADEMY_LEVELS,
  ACADEMY_QUIZ_PASS_PERCENT,
  type AcademyCertificateScope,
  type AcademyEnrollmentStatus,
  type AcademyLessonKind,
  type AcademyLevel,
  type AcademyProgressStatus,
  type AcademyPublishStatus,
  type AcademyVideoProvider,
} from './academy-types'

export const ACADEMY_COPY = {
  emptyCatalog: 'No courses are published yet. Add a course to the catalog and it will show up here.',
  emptyTracks: 'No tracks are published yet. A track is a path that groups courses in order.',
  emptyCertificates: 'No certifications are published yet.',
  emptyEarned: 'You have not earned a certification yet. Finish a course and it will be issued here.',
  enrollSuccess: 'You are enrolled. Start with the first lesson whenever you are ready.',
  enrollError: 'Could not enroll you. Please try again.',
  progressError: 'Could not save your progress. Please try again.',
  progressSaved: 'Progress saved.',
  quizPass: 'Quiz passed. This lesson is complete.',
  quizFail: 'Not quite. Review the lesson and try the quiz again.',
  missingCourse: 'This course is not in the catalog.',
  missingLesson: 'This lesson is not in the catalog.',
  missingTrack: 'This track is not in the catalog.',
  missingCertificate: 'This certification could not be found.',
  lessonLocked: 'Enroll in this course to open the lesson.',
  videoWaiting: 'This lecture is waiting for a video. Drop a file URL on the lesson and it will play here.',
  guestLock: 'Courses, tracks, and certifications need a free account. Sign up to enroll and keep your progress.',
} as const

export interface AcademyTrackRow {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  level: AcademyLevel
  estimatedHours: number
  outcomes: string[]
  coverImageUrl: string | null
  sortOrder: number
}

export interface AcademyCourseRow {
  id: string
  slug: string
  code: string
  title: string
  subtitle: string
  description: string
  category: string
  level: AcademyLevel
  instructorName: string
  instructorTitle: string
  estimatedMinutes: number
  outcomes: string[]
  coverImageUrl: string | null
  sortOrder: number
}

export interface AcademyTrackLinkRow {
  trackId: string
  courseId: string
  sortOrder: number
  required: boolean
}

export interface AcademyModuleRow {
  id: string
  courseId: string
  title: string
  summary: string
  sortOrder: number
}

export interface AcademyLessonRow {
  id: string
  courseId: string
  moduleId: string
  slug: string
  title: string
  summary: string
  kind: AcademyLessonKind
  durationSeconds: number
  videoUrl: string | null
  videoProvider: AcademyVideoProvider | null
  posterUrl: string | null
  body: string | null
  isPreview: boolean
  passingScore: number
  sortOrder: number
}

export interface AcademyQuizQuestionRow {
  id: string
  lessonId: string
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
  sortOrder: number
}

export interface AcademyEnrollmentRow {
  courseId: string
  status: AcademyEnrollmentStatus
  enrolledAt: string | null
  completedAt: string | null
}

export interface AcademyProgressRow {
  lessonId: string
  courseId: string
  status: AcademyProgressStatus
  progressPercent: number
  lastPositionSeconds: number
  quizScore: number | null
  quizPassed: boolean
  note: string | null
}

export interface AcademyCertificateRow {
  id: string
  slug: string
  scope: AcademyCertificateScope
  courseId: string | null
  trackId: string | null
  title: string
  description: string
}

export interface AcademyAwardRow {
  certificateId: string
  credentialId: string
  issuedAt: string
  holderName?: string | null
}

export interface AcademyCourseCard {
  slug: string
  code: string
  title: string
  subtitle: string
  description: string
  category: string
  level: AcademyLevel
  instructorName: string
  instructorTitle: string
  lessonCount: number
  estimatedMinutes: number
  coverImageUrl: string | null
  progressPercent: number
  enrolled: boolean
  completed: boolean
  resumeLessonSlug: string | null
  trackSlugs: string[]
}

export interface AcademyTrackCard {
  slug: string
  title: string
  subtitle: string
  description: string
  level: AcademyLevel
  estimatedHours: number
  courseCount: number
  outcomes: string[]
  coverImageUrl: string | null
  progressPercent: number
  completedCourseCount: number
}

export interface AcademyCertificateCard {
  slug: string
  title: string
  description: string
  scope: AcademyCertificateScope
  earned: boolean
  credentialId: string | null
  issuedAt: string | null
  subjectTitle: string | null
  subjectSlug: string | null
}

export interface AcademyHomePayload {
  tracks: AcademyTrackCard[]
  courses: AcademyCourseCard[]
  continueLearning: AcademyCourseCard[]
  certificates: AcademyCertificateCard[]
  categories: string[]
}

export const EMPTY_ACADEMY_HOME: AcademyHomePayload = {
  tracks: [],
  courses: [],
  continueLearning: [],
  certificates: [],
  categories: [],
}

export interface AcademyCredentialView {
  credentialId: string
  title: string
  description: string
  scope: AcademyCertificateScope
  issuedAt: string
  holderName: string
  subjectTitle: string
  subjectSlug: string
}

export interface AcademySyllabusLesson {
  slug: string
  title: string
  summary: string
  kind: AcademyLessonKind
  durationSeconds: number
  isPreview: boolean
  completed: boolean
  sortOrder: number
}

export interface AcademySyllabusModule {
  id: string
  title: string
  summary: string
  sortOrder: number
  lessons: AcademySyllabusLesson[]
}

export interface AcademyCourseDetail {
  slug: string
  code: string
  title: string
  subtitle: string
  description: string
  category: string
  level: AcademyLevel
  instructorName: string
  instructorTitle: string
  estimatedMinutes: number
  outcomes: string[]
  coverImageUrl: string | null
  enrolled: boolean
  completed: boolean
  progressPercent: number
  resumeLessonSlug: string | null
  modules: AcademySyllabusModule[]
  tracks: { slug: string; title: string }[]
  certificate: AcademyCertificateCard | null
}

export interface AcademyTrackCourseItem {
  slug: string
  code: string
  title: string
  subtitle: string
  level: AcademyLevel
  estimatedMinutes: number
  lessonCount: number
  required: boolean
  enrolled: boolean
  completed: boolean
  progressPercent: number
  sortOrder: number
}

export interface AcademyTrackDetail {
  slug: string
  title: string
  subtitle: string
  description: string
  level: AcademyLevel
  estimatedHours: number
  outcomes: string[]
  coverImageUrl: string | null
  progressPercent: number
  courses: AcademyTrackCourseItem[]
  certificate: AcademyCertificateCard | null
}

export interface AcademyQuizQuestionPublic {
  id: string
  prompt: string
  choices: string[]
}

export interface AcademyLessonDetail {
  courseSlug: string
  courseTitle: string
  courseCode: string
  enrolled: boolean
  locked: boolean
  slug: string
  title: string
  summary: string
  kind: AcademyLessonKind
  durationSeconds: number
  videoUrl: string | null
  videoProvider: AcademyVideoProvider | null
  posterUrl: string | null
  body: string | null
  isPreview: boolean
  passingScore: number
  completed: boolean
  lastPositionSeconds: number
  quizScore: number | null
  quizPassed: boolean
  note: string
  questions: AcademyQuizQuestionPublic[]
  modules: AcademySyllabusModule[]
  previousSlug: string | null
  nextSlug: string | null
}

export interface QuizGradeQuestion {
  id: string
  correctIndex: number
  explanation?: string
}

export interface QuizAnswerReview {
  id: string
  selectedIndex: number | null
  correctIndex: number
  correct: boolean
  explanation: string
}

export interface QuizGradeResult {
  scorePercent: number
  correctCount: number
  total: number
  passed: boolean
  results: QuizAnswerReview[]
}

export interface OrderedLessonRef {
  id: string
  slug: string
  courseId: string
  moduleSort: number
  lessonSort: number
}

const CREDENTIAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function mintCredentialId(random: () => number = Math.random): string {
  let body = ''
  for (let i = 0; i < 8; i += 1) {
    const index = Math.floor(random() * CREDENTIAL_ALPHABET.length) % CREDENTIAL_ALPHABET.length
    body += CREDENTIAL_ALPHABET[index]
  }
  return `MOLT-${body}`
}

export function levelLabel(level: AcademyLevel): string {
  if (level === 'beginner') return 'Beginner'
  if (level === 'intermediate') return 'Intermediate'
  return 'Advanced'
}

export function lessonKindLabel(kind: AcademyLessonKind): string {
  if (kind === 'video') return 'Video lecture'
  if (kind === 'reading') return 'Reading'
  return 'Quiz'
}

export function formatLessonDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(Math.max(0, seconds) / 60))
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`
}

export function formatCourseLength(minutes: number): string {
  return formatLessonDuration(Math.max(0, minutes) * 60)
}

const ISSUED_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function formatIssuedDate(iso: string | null): string {
  if (!iso) return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return iso
  const month = ISSUED_MONTHS[Number(match[2]) - 1]
  if (!month) return iso
  return `${month} ${Number(match[3])}, ${match[1]}`
}

export function courseProgressPercent(lessonIds: string[], completedLessonIds: Iterable<string>): number {
  if (lessonIds.length === 0) return 0
  const done = completedLessonIds instanceof Set ? completedLessonIds : new Set(completedLessonIds)
  const completed = lessonIds.filter((id) => done.has(id)).length
  return Math.round((completed / lessonIds.length) * 100)
}

export function orderedLessons<T extends OrderedLessonRef>(lessons: T[]): T[] {
  return [...lessons].sort(
    (a, b) => a.moduleSort - b.moduleSort || a.lessonSort - b.lessonSort || a.slug.localeCompare(b.slug),
  )
}

export function resumeLessonSlug(lessons: OrderedLessonRef[], completedLessonIds: Iterable<string>): string | null {
  const done = completedLessonIds instanceof Set ? completedLessonIds : new Set(completedLessonIds)
  const next = orderedLessons(lessons).find((lesson) => !done.has(lesson.id))
  return next?.slug ?? orderedLessons(lessons)[0]?.slug ?? null
}

export function adjacentLessonSlugs(
  lessons: OrderedLessonRef[],
  currentSlug: string,
): { previousSlug: string | null; nextSlug: string | null } {
  const ordered = orderedLessons(lessons)
  const index = ordered.findIndex((lesson) => lesson.slug === currentSlug)
  if (index < 0) return { previousSlug: null, nextSlug: null }
  return {
    previousSlug: ordered[index - 1]?.slug ?? null,
    nextSlug: ordered[index + 1]?.slug ?? null,
  }
}

export function filterCourseCards(
  courses: AcademyCourseCard[],
  query: { q?: string; level?: string; category?: string },
): AcademyCourseCard[] {
  const q = query.q?.trim().toLowerCase() ?? ''
  const level = query.level && query.level !== 'all' ? query.level : ''
  const category = query.category && query.category !== 'all' ? query.category : ''
  return courses.filter((course) => {
    if (level && course.level !== level) return false
    if (category && course.category !== category) return false
    if (!q) return true
    const haystack = [course.title, course.subtitle, course.code, course.instructorName, course.category, course.description]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

export function gradeQuiz(
  questions: QuizGradeQuestion[],
  answers: Record<string, number>,
  passingScore = ACADEMY_QUIZ_PASS_PERCENT,
): QuizGradeResult {
  const total = questions.length
  if (total === 0) {
    return { scorePercent: 0, correctCount: 0, total: 0, passed: false, results: [] }
  }
  const results = questions.map((question) => {
    const selectedIndex = Number.isInteger(answers[question.id]) ? answers[question.id] : null
    const correct = selectedIndex === question.correctIndex
    return {
      id: question.id,
      selectedIndex,
      correctIndex: question.correctIndex,
      correct,
      explanation: question.explanation ?? '',
    }
  })
  const correctCount = results.filter((result) => result.correct).length
  const scorePercent = Math.round((correctCount / total) * 100)
  return {
    scorePercent,
    correctCount,
    total,
    passed: scorePercent >= passingScore,
    results,
  }
}

export function planCredentialAwards(input: {
  courseId: string
  courseLessonIds: string[]
  completedLessonIds: Iterable<string>
  courseCertificateId: string | null
  completedCourseIds: Iterable<string>
  alreadyAwardedIds: Iterable<string>
  tracks: Array<{
    certificateId: string | null
    requiredCourseIds: string[]
  }>
}): { courseComplete: boolean; awardCertificateIds: string[] } {
  const completedLessons = input.completedLessonIds instanceof Set
    ? input.completedLessonIds
    : new Set(input.completedLessonIds)
  const courseComplete =
    input.courseLessonIds.length > 0 && input.courseLessonIds.every((id) => completedLessons.has(id))
  const completedCourses = new Set(input.completedCourseIds)
  if (courseComplete) completedCourses.add(input.courseId)
  const already = input.alreadyAwardedIds instanceof Set ? input.alreadyAwardedIds : new Set(input.alreadyAwardedIds)
  const awardCertificateIds: string[] = []
  if (courseComplete && input.courseCertificateId && !already.has(input.courseCertificateId)) {
    awardCertificateIds.push(input.courseCertificateId)
    already.add(input.courseCertificateId)
  }
  for (const track of input.tracks) {
    if (!track.certificateId || already.has(track.certificateId)) continue
    if (track.requiredCourseIds.length === 0) continue
    const trackComplete = track.requiredCourseIds.every((id) => completedCourses.has(id))
    if (trackComplete) {
      awardCertificateIds.push(track.certificateId)
      already.add(track.certificateId)
    }
  }
  return { courseComplete, awardCertificateIds }
}

export function youtubeEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw)
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const fromQuery = url.searchParams.get('v')
      if (fromQuery) return `https://www.youtube-nocookie.com/embed/${fromQuery}`
      const parts = url.pathname.split('/').filter(Boolean)
      const marker = parts.findIndex((part) => part === 'embed' || part === 'shorts')
      const id = marker >= 0 ? parts[marker + 1] : null
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
  } catch {
    return null
  }
  return null
}

export function vimeoEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw)
    const host = url.hostname.replace(/^www\./, '')
    if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null
    const id = url.pathname.split('/').filter((part) => /^\d+$/.test(part)).pop()
    return id ? `https://player.vimeo.com/video/${id}` : null
  } catch {
    return null
  }
}

function completedLessonIdSet(progress: AcademyProgressRow[]): Set<string> {
  return new Set(progress.filter((row) => row.status === 'completed').map((row) => row.lessonId))
}

function lessonRefs(
  lessons: AcademyLessonRow[],
  modules: AcademyModuleRow[],
): Array<AcademyLessonRow & OrderedLessonRef> {
  const moduleSort = new Map(modules.map((module) => [module.id, module.sortOrder]))
  return lessons.map((lesson) => ({
    ...lesson,
    moduleSort: moduleSort.get(lesson.moduleId) ?? 0,
    lessonSort: lesson.sortOrder,
  }))
}

function certificateCard(
  certificate: AcademyCertificateRow,
  award: AcademyAwardRow | undefined,
  subject: { title: string; slug: string } | null,
): AcademyCertificateCard {
  return {
    slug: certificate.slug,
    title: certificate.title,
    description: certificate.description,
    scope: certificate.scope,
    earned: Boolean(award),
    credentialId: award?.credentialId ?? null,
    issuedAt: award?.issuedAt ?? null,
    subjectTitle: subject?.title ?? null,
    subjectSlug: subject?.slug ?? null,
  }
}

export function assembleAcademyHome(input: {
  tracks: AcademyTrackRow[]
  courses: AcademyCourseRow[]
  links: AcademyTrackLinkRow[]
  modules: AcademyModuleRow[]
  lessons: AcademyLessonRow[]
  enrollments: AcademyEnrollmentRow[]
  progress: AcademyProgressRow[]
  certificates: AcademyCertificateRow[]
  awards: AcademyAwardRow[]
}): AcademyHomePayload {
  const lessonsByCourse = new Map<string, AcademyLessonRow[]>()
  for (const lesson of input.lessons) {
    const list = lessonsByCourse.get(lesson.courseId) ?? []
    list.push(lesson)
    lessonsByCourse.set(lesson.courseId, list)
  }
  const enrollmentByCourse = new Map(input.enrollments.map((row) => [row.courseId, row]))
  const done = completedLessonIdSet(input.progress)
  const awardByCertificate = new Map(input.awards.map((row) => [row.certificateId, row]))
  const courseById = new Map(input.courses.map((course) => [course.id, course]))
  const trackById = new Map(input.tracks.map((track) => [track.id, track]))
  const trackSlugsByCourse = new Map<string, string[]>()
  for (const link of input.links) {
    const track = trackById.get(link.trackId)
    if (!track) continue
    const list = trackSlugsByCourse.get(link.courseId) ?? []
    list.push(track.slug)
    trackSlugsByCourse.set(link.courseId, list)
  }

  const courses = [...input.courses]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
    .map((course): AcademyCourseCard => {
      const courseLessons = lessonsByCourse.get(course.id) ?? []
      const refs = lessonRefs(courseLessons, input.modules.filter((module) => module.courseId === course.id))
      const enrollment = enrollmentByCourse.get(course.id)
      const lessonIds = courseLessons.map((lesson) => lesson.id)
      const progressPercent = courseProgressPercent(lessonIds, done)
      const completed = enrollment?.status === 'completed' || (lessonIds.length > 0 && progressPercent === 100)
      return {
        slug: course.slug,
        code: course.code,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        category: course.category,
        level: course.level,
        instructorName: course.instructorName,
        instructorTitle: course.instructorTitle,
        lessonCount: courseLessons.length,
        estimatedMinutes: course.estimatedMinutes,
        coverImageUrl: course.coverImageUrl,
        progressPercent: completed ? 100 : progressPercent,
        enrolled: Boolean(enrollment),
        completed,
        resumeLessonSlug: resumeLessonSlug(refs, done),
        trackSlugs: trackSlugsByCourse.get(course.id) ?? [],
      }
    })

  const tracks = [...input.tracks]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
    .map((track): AcademyTrackCard => {
      const links = input.links
        .filter((link) => link.trackId === track.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
      const linkedCourses = links
        .map((link) => courseById.get(link.courseId))
        .filter((course): course is AcademyCourseRow => Boolean(course))
      const cards = linkedCourses
        .map((course) => courses.find((card) => card.slug === course.slug))
        .filter((card): card is AcademyCourseCard => Boolean(card))
      const completedCourseCount = cards.filter((card) => card.completed).length
      const progressPercent = cards.length === 0
        ? 0
        : Math.round(cards.reduce((sum, card) => sum + card.progressPercent, 0) / cards.length)
      return {
        slug: track.slug,
        title: track.title,
        subtitle: track.subtitle,
        description: track.description,
        level: track.level,
        estimatedHours: track.estimatedHours,
        courseCount: linkedCourses.length,
        outcomes: track.outcomes,
        coverImageUrl: track.coverImageUrl,
        progressPercent,
        completedCourseCount,
      }
    })

  const certificates = input.certificates.map((certificate) => {
    const course = certificate.courseId ? courseById.get(certificate.courseId) : undefined
    const track = certificate.trackId ? trackById.get(certificate.trackId) : undefined
    const subject = course
      ? { title: course.title, slug: course.slug }
      : track
        ? { title: track.title, slug: track.slug }
        : null
    return certificateCard(certificate, awardByCertificate.get(certificate.id), subject)
  })

  const continueLearning = courses
    .filter((course) => course.enrolled && !course.completed)
    .sort((a, b) => b.progressPercent - a.progressPercent || a.title.localeCompare(b.title))

  const categories = [...new Set(courses.map((course) => course.category))].sort((a, b) => a.localeCompare(b))

  return { tracks, courses, continueLearning, certificates, categories }
}

export function assembleCourseDetail(input: {
  course: AcademyCourseRow
  modules: AcademyModuleRow[]
  lessons: AcademyLessonRow[]
  tracks: AcademyTrackRow[]
  links: AcademyTrackLinkRow[]
  enrollment: AcademyEnrollmentRow | null
  progress: AcademyProgressRow[]
  certificate: AcademyCertificateRow | null
  award: AcademyAwardRow | null
}): AcademyCourseDetail {
  const done = completedLessonIdSet(input.progress)
  const modules = [...input.modules]
    .filter((module) => module.courseId === input.course.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((module): AcademySyllabusModule => ({
      id: module.id,
      title: module.title,
      summary: module.summary,
      sortOrder: module.sortOrder,
      lessons: input.lessons
        .filter((lesson) => lesson.moduleId === module.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((lesson) => ({
          slug: lesson.slug,
          title: lesson.title,
          summary: lesson.summary,
          kind: lesson.kind,
          durationSeconds: lesson.durationSeconds,
          isPreview: lesson.isPreview,
          completed: done.has(lesson.id),
          sortOrder: lesson.sortOrder,
        })),
    }))
  const refs = lessonRefs(
    input.lessons.filter((lesson) => lesson.courseId === input.course.id),
    input.modules,
  )
  const lessonIds = refs.map((lesson) => lesson.id)
  const progressPercent = courseProgressPercent(lessonIds, done)
  const completed = input.enrollment?.status === 'completed' || (lessonIds.length > 0 && progressPercent === 100)
  const linkedTrackIds = new Set(
    input.links.filter((link) => link.courseId === input.course.id).map((link) => link.trackId),
  )
  return {
    slug: input.course.slug,
    code: input.course.code,
    title: input.course.title,
    subtitle: input.course.subtitle,
    description: input.course.description,
    category: input.course.category,
    level: input.course.level,
    instructorName: input.course.instructorName,
    instructorTitle: input.course.instructorTitle,
    estimatedMinutes: input.course.estimatedMinutes,
    outcomes: input.course.outcomes,
    coverImageUrl: input.course.coverImageUrl,
    enrolled: Boolean(input.enrollment),
    completed,
    progressPercent: completed ? 100 : progressPercent,
    resumeLessonSlug: resumeLessonSlug(refs, done),
    modules,
    tracks: input.tracks
      .filter((track) => linkedTrackIds.has(track.id))
      .map((track) => ({ slug: track.slug, title: track.title })),
    certificate: input.certificate
      ? certificateCard(input.certificate, input.award ?? undefined, {
          title: input.course.title,
          slug: input.course.slug,
        })
      : null,
  }
}

export function assembleTrackDetail(input: {
  track: AcademyTrackRow
  courses: AcademyCourseRow[]
  links: AcademyTrackLinkRow[]
  lessons: AcademyLessonRow[]
  enrollments: AcademyEnrollmentRow[]
  progress: AcademyProgressRow[]
  certificate: AcademyCertificateRow | null
  award: AcademyAwardRow | null
}): AcademyTrackDetail {
  const done = completedLessonIdSet(input.progress)
  const enrollmentByCourse = new Map(input.enrollments.map((row) => [row.courseId, row]))
  const lessonsByCourse = new Map<string, string[]>()
  for (const lesson of input.lessons) {
    const list = lessonsByCourse.get(lesson.courseId) ?? []
    list.push(lesson.id)
    lessonsByCourse.set(lesson.courseId, list)
  }
  const courseById = new Map(input.courses.map((course) => [course.id, course]))
  const items = input.links
    .filter((link) => link.trackId === input.track.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((link): AcademyTrackCourseItem[] => {
      const course = courseById.get(link.courseId)
      if (!course) return []
      const lessonIds = lessonsByCourse.get(course.id) ?? []
      const enrollment = enrollmentByCourse.get(course.id)
      const progressPercent = courseProgressPercent(lessonIds, done)
      const completed = enrollment?.status === 'completed' || (lessonIds.length > 0 && progressPercent === 100)
      return [{
        slug: course.slug,
        code: course.code,
        title: course.title,
        subtitle: course.subtitle,
        level: course.level,
        estimatedMinutes: course.estimatedMinutes,
        lessonCount: lessonIds.length,
        required: link.required,
        enrolled: Boolean(enrollment),
        completed,
        progressPercent: completed ? 100 : progressPercent,
        sortOrder: link.sortOrder,
      }]
    })
  const progressPercent = items.length === 0
    ? 0
    : Math.round(items.reduce((sum, item) => sum + item.progressPercent, 0) / items.length)
  return {
    slug: input.track.slug,
    title: input.track.title,
    subtitle: input.track.subtitle,
    description: input.track.description,
    level: input.track.level,
    estimatedHours: input.track.estimatedHours,
    outcomes: input.track.outcomes,
    coverImageUrl: input.track.coverImageUrl,
    progressPercent,
    courses: items,
    certificate: input.certificate
      ? certificateCard(input.certificate, input.award ?? undefined, {
          title: input.track.title,
          slug: input.track.slug,
        })
      : null,
  }
}

export function assembleLessonDetail(input: {
  course: AcademyCourseRow
  modules: AcademyModuleRow[]
  lessons: AcademyLessonRow[]
  lesson: AcademyLessonRow
  questions: AcademyQuizQuestionRow[]
  enrolled: boolean
  progressRows: AcademyProgressRow[]
}): AcademyLessonDetail {
  const refs = lessonRefs(input.lessons, input.modules)
  const neighbors = adjacentLessonSlugs(refs, input.lesson.slug)
  const locked = !input.lesson.isPreview && !input.enrolled
  const done = completedLessonIdSet(input.progressRows)
  const currentProgress = input.progressRows.find((row) => row.lessonId === input.lesson.id) ?? null
  const modules = [...input.modules]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((module): AcademySyllabusModule => ({
      id: module.id,
      title: module.title,
      summary: module.summary,
      sortOrder: module.sortOrder,
      lessons: input.lessons
        .filter((lesson) => lesson.moduleId === module.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((lesson) => ({
          slug: lesson.slug,
          title: lesson.title,
          summary: lesson.summary,
          kind: lesson.kind,
          durationSeconds: lesson.durationSeconds,
          isPreview: lesson.isPreview,
          completed: done.has(lesson.id),
          sortOrder: lesson.sortOrder,
        })),
    }))

  return {
    courseSlug: input.course.slug,
    courseTitle: input.course.title,
    courseCode: input.course.code,
    enrolled: input.enrolled,
    locked,
    slug: input.lesson.slug,
    title: input.lesson.title,
    summary: input.lesson.summary,
    kind: input.lesson.kind,
    durationSeconds: input.lesson.durationSeconds,
    videoUrl: locked ? null : input.lesson.videoUrl,
    videoProvider: locked ? null : input.lesson.videoProvider,
    posterUrl: input.lesson.posterUrl,
    body: locked ? null : input.lesson.body,
    isPreview: input.lesson.isPreview,
    passingScore: input.lesson.passingScore,
    completed: currentProgress?.status === 'completed',
    lastPositionSeconds: currentProgress?.lastPositionSeconds ?? 0,
    quizScore: currentProgress?.quizScore ?? null,
    quizPassed: currentProgress?.quizPassed ?? false,
    note: currentProgress?.note ?? '',
    questions: locked
      ? []
      : [...input.questions]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((question) => ({
            id: question.id,
            prompt: question.prompt,
            choices: question.choices,
          })),
    modules,
    previousSlug: neighbors.previousSlug,
    nextSlug: neighbors.nextSlug,
  }
}

export function readingParagraphs(body: string | null): string[] {
  if (!body) return []
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}
