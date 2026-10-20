/**
 * Markdown course format for Molt Academy (content/academy/).
 *
 * A course is a folder: `course.md` (course facts, modules, lesson order, certificate) plus
 * `lessons/<slug>.md` (one file per lesson). A track is `tracks/<slug>.md`. This module turns
 * parsed frontmatter into normalized records and lists every problem it finds, without touching
 * the filesystem or the database, so the CLI, the skill and the tests share one set of rules.
 * The format is documented in content/academy/README.md.
 */
import {
  ACADEMY_LEVELS,
  ACADEMY_QUIZ_PASS_PERCENT,
  type AcademyLessonKind,
  type AcademyLevel,
  type AcademyPublishStatus,
  type AcademyVideoProvider,
} from './academy-types'

export const ACADEMY_CONTENT_STATUSES: AcademyPublishStatus[] = ['draft', 'published']
const LESSON_KINDS: AcademyLessonKind[] = ['video', 'reading', 'quiz']
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CODE_PATTERN = /^[A-Z][A-Z0-9]*-\d{3}$/

export interface AcademyContentQuestion {
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
}

export interface AcademyContentVideo {
  /** An https URL, a bucket key (videos/…), or a local file path relative to the lesson file. */
  source: string
  provider: AcademyVideoProvider
}

export interface AcademyContentLesson {
  slug: string
  title: string
  summary: string
  kind: AcademyLessonKind
  durationSeconds: number
  video: AcademyContentVideo | null
  poster: string | null
  body: string | null
  isPreview: boolean
  passingScore: number
  questions: AcademyContentQuestion[]
  sourcePath: string
}

export interface AcademyContentModule {
  title: string
  summary: string
  lessons: AcademyContentLesson[]
}

export interface AcademyContentCertificate {
  slug: string
  title: string
  description: string
}

export interface AcademyContentCourse {
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
  cover: string | null
  status: AcademyPublishStatus
  sortOrder: number
  certificate: AcademyContentCertificate | null
  modules: AcademyContentModule[]
  sourcePath: string
}

export interface AcademyContentTrack {
  slug: string
  title: string
  subtitle: string
  description: string
  level: AcademyLevel
  estimatedHours: number
  outcomes: string[]
  cover: string | null
  status: AcademyPublishStatus
  sortOrder: number
  courses: { slug: string; required: boolean }[]
  certificate: AcademyContentCertificate | null
  sourcePath: string
}

/** A parsed Markdown file: YAML frontmatter plus the body below it. */
export interface AcademyContentFile {
  path: string
  data: Record<string, unknown>
  body: string
}

export interface AcademyContentIssue {
  path: string
  message: string
  /** Warnings are reported but do not stop an ingest. */
  severity: 'error' | 'warning'
}

export interface AcademyContentResult<T> {
  value: T | null
  issues: AcademyContentIssue[]
}

class IssueList {
  readonly items: AcademyContentIssue[] = []
  error(path: string, message: string) {
    this.items.push({ path, message, severity: 'error' })
  }
  warn(path: string, message: string) {
    this.items.push({ path, message, severity: 'warning' })
  }
  get hasErrors() {
    return this.items.some((item) => item.severity === 'error')
  }
}

function text(value: unknown): string {
  if (value == null) return ''
  return String(value).trim()
}

function requiredText(data: Record<string, unknown>, key: string, path: string, issues: IssueList): string {
  const value = text(data[key])
  if (!value) issues.error(path, `Missing "${key}".`)
  return value
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => text(item)).filter(Boolean)
}

function optionalNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function level(value: unknown, path: string, issues: IssueList): AcademyLevel {
  const raw = text(value).toLowerCase()
  if ((ACADEMY_LEVELS as readonly string[]).includes(raw)) return raw as AcademyLevel
  issues.error(path, `"level" must be one of ${ACADEMY_LEVELS.join(', ')}.`)
  return 'beginner'
}

function status(value: unknown, path: string, issues: IssueList): AcademyPublishStatus {
  if (value == null || value === '') return 'draft'
  const raw = text(value).toLowerCase()
  if ((ACADEMY_CONTENT_STATUSES as string[]).includes(raw)) return raw as AcademyPublishStatus
  issues.error(path, `"status" must be one of ${ACADEMY_CONTENT_STATUSES.join(', ')}.`)
  return 'draft'
}

function certificate(
  value: unknown,
  fallbackSlug: string,
  path: string,
  issues: IssueList,
): AcademyContentCertificate | null {
  if (value == null || value === false) return null
  if (typeof value !== 'object') {
    issues.error(path, '"certificate" needs a title and a description.')
    return null
  }
  const data = value as Record<string, unknown>
  const title = text(data.title)
  const description = text(data.description)
  if (!title || !description) {
    issues.error(path, '"certificate" needs a title and a description.')
    return null
  }
  const slug = text(data.slug) || fallbackSlug
  if (!SLUG_PATTERN.test(slug)) issues.error(path, `Certificate slug "${slug}" must be lowercase words joined by hyphens.`)
  return { slug, title, description }
}

/**
 * Accepts `12` (minutes), `"12:30"` (minutes:seconds), `"1:02:00"` (h:m:s) or `"90s"`.
 * Returns null when the value cannot be read.
 */
export function parseLessonDuration(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? Math.round(value * 60) : null
  const raw = String(value).trim().toLowerCase()
  const seconds = raw.match(/^(\d+)\s*s(?:ec(?:onds?)?)?$/)
  if (seconds) return Number(seconds[1])
  const minutes = raw.match(/^(\d+(?:\.\d+)?)\s*(?:m|min|mins|minutes?)?$/)
  if (minutes) return Math.round(Number(minutes[1]) * 60)
  const clock = raw.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/)
  if (clock) return Number(clock[1] ?? 0) * 3600 + Number(clock[2]) * 60 + Number(clock[3])
  return null
}

/** Works out who hosts a video from its address. Local files and bucket keys are served as files. */
export function inferVideoProvider(source: string): AcademyVideoProvider {
  if (!/^https?:\/\//i.test(source)) return 'file'
  let host = ''
  try {
    host = new URL(source).hostname.replace(/^www\./, '')
  } catch {
    return 'embed'
  }
  if (host === 'youtu.be' || host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) return 'youtube'
  if (host.endsWith('vimeo.com')) return 'vimeo'
  if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(source)) return 'file'
  return 'embed'
}

function video(value: unknown, path: string, issues: IssueList): AcademyContentVideo | null {
  if (value == null || value === '') return null
  if (typeof value === 'string') return { source: value.trim(), provider: inferVideoProvider(value.trim()) }
  if (typeof value === 'object') {
    const data = value as Record<string, unknown>
    const source = text(data.url ?? data.src ?? data.file)
    if (!source) {
      issues.error(path, '"video" needs a url.')
      return null
    }
    const provider = text(data.provider).toLowerCase()
    if (provider && !['file', 'youtube', 'vimeo', 'embed'].includes(provider)) {
      issues.error(path, '"video.provider" must be file, youtube, vimeo, or embed.')
    }
    return { source, provider: (provider as AcademyVideoProvider) || inferVideoProvider(source) }
  }
  issues.error(path, '"video" must be a url or { url, provider }.')
  return null
}

function questions(value: unknown, path: string, issues: IssueList): AcademyContentQuestion[] {
  if (value == null) return []
  if (!Array.isArray(value)) {
    issues.error(path, '"questions" must be a list.')
    return []
  }
  return value.flatMap((item, index) => {
    const label = `Question ${index + 1}`
    if (!item || typeof item !== 'object') {
      issues.error(path, `${label} must have a prompt, choices, and an answer.`)
      return []
    }
    const data = item as Record<string, unknown>
    const prompt = text(data.prompt ?? data.question)
    const choices = stringList(data.choices)
    if (!prompt) issues.error(path, `${label} is missing "prompt".`)
    if (choices.length < 2) issues.error(path, `${label} needs at least two choices.`)
    if (new Set(choices).size !== choices.length) issues.error(path, `${label} has the same choice twice.`)
    let correctIndex = -1
    const answer = data.answer
    if (typeof answer === 'number') {
      correctIndex = answer
    } else if (typeof answer === 'string') {
      correctIndex = choices.indexOf(answer.trim())
    }
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= choices.length) {
      issues.error(path, `${label}: "answer" must be the text of one choice or its position, counting from 0.`)
      correctIndex = 0
    }
    return [{ prompt, choices, correctIndex, explanation: text(data.explanation) }]
  })
}

/** Normalizes one lesson file. `fallbackSlug` is the file name without `.md`. */
export function parseAcademyLesson(file: AcademyContentFile, fallbackSlug: string): AcademyContentResult<AcademyContentLesson> {
  const issues = new IssueList()
  const { data, path } = file
  const slug = text(data.slug) || fallbackSlug
  if (!SLUG_PATTERN.test(slug)) issues.error(path, `Lesson slug "${slug}" must be lowercase words joined by hyphens.`)
  const title = requiredText(data, 'title', path, issues)
  const parsedVideo = video(data.video, path, issues)
  const parsedQuestions = questions(data.questions, path, issues)
  const body = file.body.trim() || null

  const declaredKind = text(data.kind).toLowerCase()
  let kind: AcademyLessonKind
  if (declaredKind) {
    if (!(LESSON_KINDS as string[]).includes(declaredKind)) {
      issues.error(path, `"kind" must be one of ${LESSON_KINDS.join(', ')}.`)
    }
    kind = (LESSON_KINDS as string[]).includes(declaredKind) ? (declaredKind as AcademyLessonKind) : 'reading'
  } else {
    kind = parsedQuestions.length > 0 ? 'quiz' : parsedVideo ? 'video' : 'reading'
  }

  if (kind === 'quiz' && parsedQuestions.length === 0) issues.error(path, 'A quiz lesson needs at least one question.')
  if (kind !== 'quiz' && parsedQuestions.length > 0) issues.warn(path, `Questions are ignored on a ${kind} lesson.`)
  if (kind === 'video' && !parsedVideo) issues.warn(path, 'Video lesson has no "video" yet. Members will see a "not up yet" notice.')
  if (kind === 'reading' && !body) issues.error(path, 'A reading lesson needs text below the frontmatter.')

  const duration = parseLessonDuration(data.duration)
  if (data.duration != null && duration == null) issues.error(path, `Could not read "duration": ${String(data.duration)}.`)
  if (duration == null) issues.error(path, 'Missing "duration" (minutes, or mm:ss).')

  const passingScore = optionalNumber(data.passingScore) ?? ACADEMY_QUIZ_PASS_PERCENT
  if (passingScore < 1 || passingScore > 100) issues.error(path, '"passingScore" must be between 1 and 100.')

  if (issues.hasErrors) return { value: null, issues: issues.items }
  return {
    value: {
      slug,
      title,
      summary: text(data.summary),
      kind,
      durationSeconds: duration ?? 0,
      video: kind === 'video' ? parsedVideo : null,
      poster: text(data.poster) || null,
      body,
      isPreview: data.preview === true,
      passingScore,
      questions: kind === 'quiz' ? parsedQuestions : [],
      sourcePath: path,
    },
    issues: issues.items,
  }
}

/**
 * Normalizes a course folder. `lessonFiles` maps each lesson file's fallback slug (file name)
 * to its parsed file. Lesson order comes from `modules[].lessons` in course.md.
 */
export function parseAcademyCourse(
  file: AcademyContentFile,
  folderSlug: string,
  lessonFiles: Map<string, AcademyContentFile>,
): AcademyContentResult<AcademyContentCourse> {
  const issues = new IssueList()
  const { data, path } = file
  const slug = text(data.slug) || folderSlug
  if (!SLUG_PATTERN.test(slug)) issues.error(path, `Course slug "${slug}" must be lowercase words joined by hyphens.`)
  const code = requiredText(data, 'code', path, issues).toUpperCase()
  if (code && !CODE_PATTERN.test(code)) issues.error(path, `"code" should look like MOLT-101.`)
  const title = requiredText(data, 'title', path, issues)
  const subtitle = requiredText(data, 'subtitle', path, issues)
  const category = requiredText(data, 'category', path, issues)
  const instructor = (data.instructor ?? {}) as Record<string, unknown>
  const instructorName = text(instructor.name ?? data.instructorName)
  const instructorTitle = text(instructor.title ?? data.instructorTitle)
  if (!instructorName) issues.error(path, 'Missing "instructor.name".')
  if (!instructorTitle) issues.error(path, 'Missing "instructor.title".')
  const description = file.body.trim() || text(data.description)
  if (!description) issues.error(path, 'Add a course description below the frontmatter.')

  const parsedLessons = new Map<string, AcademyContentLesson>()
  for (const [fallback, lessonFile] of lessonFiles) {
    const result = parseAcademyLesson(lessonFile, fallback)
    issues.items.push(...result.issues)
    if (!result.value) continue
    if (parsedLessons.has(result.value.slug)) {
      issues.error(lessonFile.path, `Two lessons use the slug "${result.value.slug}".`)
      continue
    }
    parsedLessons.set(result.value.slug, result.value)
  }

  const rawModules = Array.isArray(data.modules) ? data.modules : []
  if (rawModules.length === 0) issues.error(path, 'List at least one module with its lessons under "modules".')
  const used = new Set<string>()
  const modules: AcademyContentModule[] = []
  rawModules.forEach((raw, index) => {
    const module = (raw ?? {}) as Record<string, unknown>
    const moduleTitle = text(module.title)
    if (!moduleTitle) issues.error(path, `Module ${index + 1} is missing "title".`)
    const slugs = stringList(module.lessons)
    if (slugs.length === 0) issues.error(path, `Module "${moduleTitle || index + 1}" lists no lessons.`)
    const lessons: AcademyContentLesson[] = []
    for (const lessonSlug of slugs) {
      if (used.has(lessonSlug)) {
        issues.error(path, `Lesson "${lessonSlug}" is listed twice.`)
        continue
      }
      used.add(lessonSlug)
      const lesson = parsedLessons.get(lessonSlug)
      if (lesson) lessons.push(lesson)
      else if (![...lessonFiles.keys()].includes(lessonSlug)) issues.error(path, `Lesson "${lessonSlug}" has no file at lessons/${lessonSlug}.md.`)
    }
    modules.push({ title: moduleTitle, summary: text(module.summary), lessons })
  })
  if (new Set(modules.map((module) => module.title)).size !== modules.length) {
    issues.error(path, 'Two modules share a title. Module titles must be unique within a course.')
  }
  for (const lessonSlug of parsedLessons.keys()) {
    if (!used.has(lessonSlug)) issues.warn(path, `lessons/${lessonSlug}.md is not listed in any module, so it is skipped.`)
  }

  const allLessons = modules.flatMap((module) => module.lessons)
  const computedMinutes = Math.max(1, Math.ceil(allLessons.reduce((sum, lesson) => sum + lesson.durationSeconds, 0) / 60))
  const outcomes = stringList(data.outcomes)
  if (outcomes.length === 0) issues.warn(path, 'No "outcomes" listed. The course page will skip "What you will practice".')
  const parsedStatus = status(data.status, path, issues)
  const parsedCertificate = certificate(data.certificate, slug, path, issues)
  if (!parsedCertificate) issues.warn(path, 'No "certificate". Finishing this course will not issue one.')
  const parsedLevel = level(data.level, path, issues)

  if (issues.hasErrors) return { value: null, issues: issues.items }
  return {
    value: {
      slug,
      code,
      title,
      subtitle,
      description,
      category,
      level: parsedLevel,
      instructorName,
      instructorTitle,
      estimatedMinutes: optionalNumber(data.minutes) ?? computedMinutes,
      outcomes,
      cover: text(data.cover) || null,
      status: parsedStatus,
      sortOrder: optionalNumber(data.order) ?? 0,
      certificate: parsedCertificate,
      modules,
      sourcePath: path,
    },
    issues: issues.items,
  }
}

/** Normalizes a track file. Course slugs are checked against the database at ingest time. */
export function parseAcademyTrack(file: AcademyContentFile, fallbackSlug: string): AcademyContentResult<AcademyContentTrack> {
  const issues = new IssueList()
  const { data, path } = file
  const slug = text(data.slug) || fallbackSlug
  if (!SLUG_PATTERN.test(slug)) issues.error(path, `Track slug "${slug}" must be lowercase words joined by hyphens.`)
  const title = requiredText(data, 'title', path, issues)
  const subtitle = requiredText(data, 'subtitle', path, issues)
  const description = file.body.trim() || text(data.description)
  if (!description) issues.error(path, 'Add a track description below the frontmatter.')
  const courses = (Array.isArray(data.courses) ? data.courses : []).flatMap((item) => {
    if (typeof item === 'string') return [{ slug: item.trim(), required: true }]
    if (item && typeof item === 'object') {
      const entry = item as Record<string, unknown>
      return [{ slug: text(entry.slug), required: entry.required !== false }]
    }
    return []
  })
  if (courses.length === 0) issues.error(path, 'List the track\'s courses in order under "courses".')
  if (courses.some((course) => !course.slug)) issues.error(path, 'Every entry under "courses" needs a slug.')
  if (new Set(courses.map((course) => course.slug)).size !== courses.length) issues.error(path, 'A course is listed twice.')
  const hours = optionalNumber(data.hours)
  if (hours == null) issues.error(path, 'Missing "hours" (rough total, whole hours).')
  const parsedLevel = level(data.level, path, issues)
  const parsedStatus = status(data.status, path, issues)
  const parsedCertificate = certificate(data.certificate, `${slug}-path`, path, issues)

  if (issues.hasErrors) return { value: null, issues: issues.items }
  return {
    value: {
      slug,
      title,
      subtitle,
      description,
      level: parsedLevel,
      estimatedHours: Math.max(1, Math.round(hours ?? 1)),
      outcomes: stringList(data.outcomes),
      cover: text(data.cover) || null,
      status: parsedStatus,
      sortOrder: optionalNumber(data.order) ?? 0,
      courses,
      certificate: parsedCertificate,
      sourcePath: path,
    },
    issues: issues.items,
  }
}

export interface AcademyLessonSyncPlan {
  /** Existing lesson ids kept (progress survives), keyed by slug. */
  keep: Map<string, string>
  insert: string[]
  /** Lessons in the database that the content no longer lists. Removing them deletes member progress. */
  removed: { id: string; slug: string }[]
}

/** Matches incoming lessons to existing rows by slug so lesson ids, and member progress, survive edits. */
export function planLessonSync(existing: { id: string; slug: string }[], incoming: string[]): AcademyLessonSyncPlan {
  const bySlug = new Map(existing.map((row) => [row.slug, row.id]))
  const wanted = new Set(incoming)
  const keep = new Map<string, string>()
  const insert: string[] = []
  for (const slug of incoming) {
    const id = bySlug.get(slug)
    if (id) keep.set(slug, id)
    else insert.push(slug)
  }
  const removed = existing.filter((row) => !wanted.has(row.slug)).map((row) => ({ id: row.id, slug: row.slug }))
  return { keep, insert, removed }
}

/** Is this a local file the ingest should upload, as opposed to a URL or an existing bucket key? */
export function isLocalMediaPath(source: string): boolean {
  if (/^https?:\/\//i.test(source)) return false
  if (/^(images|videos|audio)\//.test(source)) return false
  return true
}
