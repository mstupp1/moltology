import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { HeadObjectCommand } from '@aws-sdk/client-s3'
import { and, eq, inArray } from 'drizzle-orm'
import * as schema from '../../db/schema'
import {
  isLocalMediaPath,
  parseAcademyCourse,
  parseAcademyTrack,
  planLessonSync,
  type AcademyContentCourse,
  type AcademyContentFile,
  type AcademyContentIssue,
  type AcademyContentTrack,
} from '../academy-content'
import { getAssetUrl } from '../assets'
import { DEFAULT_BUCKET, getS3Client } from '../s3-client'
import { uploadLocalFileToS3 } from './s3-upload'

export const ACADEMY_CONTENT_ROOT = 'content/academy'

/** Folders under content/academy/courses/ starting with "_" (like _template) are examples, never ingested. */
function isIngestableName(name: string) {
  return !name.startsWith('_') && !name.startsWith('.')
}

function readContentFile(filePath: string): AcademyContentFile {
  const parsed = matter(fs.readFileSync(filePath, 'utf8'))
  return { path: filePath, data: parsed.data as Record<string, unknown>, body: parsed.content }
}

export interface AcademyContentTree {
  courses: AcademyContentCourse[]
  tracks: AcademyContentTrack[]
  issues: AcademyContentIssue[]
}

/**
 * Reads content/academy (or any folder laid out the same way). `only` limits the run to the
 * named course or track slugs.
 */
export function loadAcademyContent(root = ACADEMY_CONTENT_ROOT, only: string[] = []): AcademyContentTree {
  const tree: AcademyContentTree = { courses: [], tracks: [], issues: [] }
  const want = (slug: string) => only.length === 0 || only.includes(slug)
  const coursesDir = path.join(root, 'courses')
  if (fs.existsSync(coursesDir)) {
    for (const entry of fs.readdirSync(coursesDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory() || !isIngestableName(entry.name) || !want(entry.name)) continue
      const dir = path.join(coursesDir, entry.name)
      const courseFile = path.join(dir, 'course.md')
      if (!fs.existsSync(courseFile)) {
        tree.issues.push({ path: dir, message: 'Missing course.md.', severity: 'error' })
        continue
      }
      const lessonFiles = new Map<string, AcademyContentFile>()
      const lessonsDir = path.join(dir, 'lessons')
      if (fs.existsSync(lessonsDir)) {
        for (const name of fs.readdirSync(lessonsDir).sort()) {
          if (!name.endsWith('.md') || !isIngestableName(name)) continue
          lessonFiles.set(name.replace(/\.md$/, ''), readContentFile(path.join(lessonsDir, name)))
        }
      }
      const result = parseAcademyCourse(readContentFile(courseFile), entry.name, lessonFiles)
      tree.issues.push(...result.issues)
      if (result.value) tree.courses.push(result.value)
    }
  }
  const tracksDir = path.join(root, 'tracks')
  if (fs.existsSync(tracksDir)) {
    for (const name of fs.readdirSync(tracksDir).sort()) {
      if (!name.endsWith('.md') || !isIngestableName(name)) continue
      const slug = name.replace(/\.md$/, '')
      if (!want(slug)) continue
      const result = parseAcademyTrack(readContentFile(path.join(tracksDir, name)), slug)
      tree.issues.push(...result.issues)
      if (result.value) tree.tracks.push(result.value)
    }
  }
  const codes = new Map<string, string>()
  for (const course of tree.courses) {
    const other = codes.get(course.code)
    if (other) tree.issues.push({ path: course.sourcePath, message: `Code ${course.code} is also used by ${other}.`, severity: 'error' })
    codes.set(course.code, course.slug)
  }
  return tree
}

type Db = any

export interface AcademySyncOptions {
  dryRun?: boolean
  /** Allow deleting lessons that are no longer listed. Their member progress is deleted with them. */
  prune?: boolean
  log?: (line: string) => void
}

export interface AcademySyncReport {
  kind: 'course' | 'track'
  slug: string
  action: 'inserted' | 'updated' | 'validated'
  status: string
  notes: string[]
}

async function objectExists(key: string): Promise<boolean> {
  try {
    await getS3Client().send(new HeadObjectCommand({ Bucket: DEFAULT_BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

/**
 * Turns a cover, poster, video or inline image reference into what the database stores.
 * URLs and bucket keys pass through. A local file is uploaded once under a content-hash key,
 * so re-running the ingest never re-uploads unchanged media.
 */
async function resolveMedia(
  source: string,
  fromFile: string,
  courseSlug: string,
  options: AcademySyncOptions,
): Promise<string> {
  if (!isLocalMediaPath(source)) return source
  const local = path.isAbsolute(source) ? source : path.resolve(path.dirname(fromFile), source)
  if (!fs.existsSync(local) || !fs.statSync(local).isFile()) {
    throw new Error(`${fromFile}: media file not found: ${source}`)
  }
  const ext = path.extname(local).toLowerCase()
  const folder = ['.mp4', '.webm', '.mov', '.m4v'].includes(ext) ? 'videos' : 'images'
  const hash = crypto.createHash('sha1').update(fs.readFileSync(local)).digest('hex').slice(0, 10)
  const base = path.basename(local, ext).toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  const key = `${folder}/academy/${courseSlug}/${base}-${hash}${ext}`
  if (options.dryRun) return key
  if (await objectExists(key)) return key
  options.log?.(`    ↑ uploading ${path.relative(process.cwd(), local)} → ${key}`)
  await uploadLocalFileToS3(local, key)
  return key
}

/** Uploads local images referenced in a Markdown body and points them at the CDN path. */
async function resolveBodyImages(body: string | null, fromFile: string, courseSlug: string, options: AcademySyncOptions) {
  if (!body) return body
  let next = body
  for (const match of body.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)) {
    const src = match[2]
    if (!isLocalMediaPath(src)) continue
    const key = await resolveMedia(src, fromFile, courseSlug, options)
    next = next.replace(match[0], `![${match[1]}](${getAssetUrl(key)})`)
  }
  return next
}

async function upsertCertificate(
  db: Db,
  scope: 'course' | 'track',
  ownerId: string,
  certificate: { slug: string; title: string; description: string } | null,
) {
  if (!certificate) return
  const column = scope === 'course' ? schema.academyCertificates.courseId : schema.academyCertificates.trackId
  const [existing] = await db.select().from(schema.academyCertificates).where(eq(column, ownerId)).limit(1)
  const values = { slug: certificate.slug, title: certificate.title, description: certificate.description }
  if (existing) {
    await db.update(schema.academyCertificates).set(values).where(eq(schema.academyCertificates.id, existing.id))
  } else {
    await db.insert(schema.academyCertificates).values({
      ...values,
      scope,
      courseId: scope === 'course' ? ownerId : null,
      trackId: scope === 'track' ? ownerId : null,
    })
  }
}

export async function syncAcademyCourse(db: Db, course: AcademyContentCourse, options: AcademySyncOptions = {}): Promise<AcademySyncReport> {
  const notes: string[] = []
  const lessons = course.modules.flatMap((module) => module.lessons)
  const cover = course.cover ? await resolveMedia(course.cover, course.sourcePath, course.slug, options) : null
  const resolved = new Map<string, { videoUrl: string | null; posterUrl: string | null; body: string | null }>()
  for (const lesson of lessons) {
    resolved.set(lesson.slug, {
      videoUrl: lesson.video ? await resolveMedia(lesson.video.source, lesson.sourcePath, course.slug, options) : null,
      posterUrl: lesson.poster ? await resolveMedia(lesson.poster, lesson.sourcePath, course.slug, options) : null,
      body: await resolveBodyImages(lesson.body, lesson.sourcePath, course.slug, options),
    })
  }

  if (options.dryRun && !db) {
    return { kind: 'course', slug: course.slug, action: 'validated', status: course.status, notes }
  }

  const [existing] = await db.select().from(schema.academyCourses).where(eq(schema.academyCourses.slug, course.slug)).limit(1)
  const existingLessons: { id: string; slug: string; moduleId: string }[] = existing
    ? await db
        .select({ id: schema.academyLessons.id, slug: schema.academyLessons.slug, moduleId: schema.academyLessons.moduleId })
        .from(schema.academyLessons)
        .where(eq(schema.academyLessons.courseId, existing.id))
    : []
  const plan = planLessonSync(existingLessons, lessons.map((lesson) => lesson.slug))
  if (plan.removed.length > 0 && !options.prune) {
    throw new Error(
      `${course.slug}: ${plan.removed.map((row) => row.slug).join(', ')} ${plan.removed.length === 1 ? 'is' : 'are'} in the database but no longer listed. ` +
        'Removing a lesson deletes member progress on it. Put it back, or re-run with --prune to delete it.',
    )
  }
  if (options.dryRun) {
    notes.push(`${plan.keep.size} lessons kept, ${plan.insert.length} new, ${plan.removed.length} to remove`)
    return { kind: 'course', slug: course.slug, action: 'validated', status: course.status, notes }
  }

  const now = new Date()
  const courseValues = {
    code: course.code,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    category: course.category,
    level: course.level,
    coverImageUrl: cover,
    instructorName: course.instructorName,
    instructorTitle: course.instructorTitle,
    estimatedMinutes: course.estimatedMinutes,
    outcomes: course.outcomes,
    status: course.status,
    sortOrder: course.sortOrder,
    updatedAt: now,
  }
  let courseId: string
  if (existing) {
    courseId = existing.id
    await db
      .update(schema.academyCourses)
      .set({ ...courseValues, publishedAt: course.status === 'published' ? existing.publishedAt ?? now : existing.publishedAt })
      .where(eq(schema.academyCourses.id, courseId))
  } else {
    const [row] = await db
      .insert(schema.academyCourses)
      .values({ ...courseValues, slug: course.slug, publishedAt: course.status === 'published' ? now : null })
      .returning({ id: schema.academyCourses.id })
    courseId = row.id
  }

  // Modules are matched by title so renaming one keeps it in place; lessons by slug so ids survive.
  const existingModules: { id: string; title: string }[] = await db
    .select({ id: schema.academyModules.id, title: schema.academyModules.title })
    .from(schema.academyModules)
    .where(eq(schema.academyModules.courseId, courseId))
  const moduleIds: string[] = []
  for (const [index, module] of course.modules.entries()) {
    const match = existingModules.find((row) => row.title === module.title && !moduleIds.includes(row.id))
    if (match) {
      await db
        .update(schema.academyModules)
        .set({ summary: module.summary, sortOrder: index + 1 })
        .where(eq(schema.academyModules.id, match.id))
      moduleIds.push(match.id)
    } else {
      const [row] = await db
        .insert(schema.academyModules)
        .values({ courseId, title: module.title, summary: module.summary, sortOrder: index + 1 })
        .returning({ id: schema.academyModules.id })
      moduleIds.push(row.id)
    }
  }

  let lessonOrder = 0
  for (const [moduleIndex, module] of course.modules.entries()) {
    for (const lesson of module.lessons) {
      lessonOrder += 1
      const media = resolved.get(lesson.slug)!
      const values = {
        moduleId: moduleIds[moduleIndex],
        title: lesson.title,
        summary: lesson.summary,
        kind: lesson.kind,
        durationSeconds: lesson.durationSeconds,
        videoUrl: media.videoUrl,
        videoProvider: lesson.video?.provider ?? null,
        posterUrl: media.posterUrl,
        body: media.body,
        isPreview: lesson.isPreview,
        passingScore: lesson.passingScore,
        sortOrder: lessonOrder,
      }
      let lessonId = plan.keep.get(lesson.slug)
      if (lessonId) {
        await db.update(schema.academyLessons).set(values).where(eq(schema.academyLessons.id, lessonId))
      } else {
        const [row] = await db
          .insert(schema.academyLessons)
          .values({ ...values, courseId, slug: lesson.slug })
          .returning({ id: schema.academyLessons.id })
        lessonId = row.id as string
      }
      // Questions carry no member state (scores live on lesson progress), so they are replaced whole.
      await db.delete(schema.academyQuizQuestions).where(eq(schema.academyQuizQuestions.lessonId, lessonId))
      if (lesson.questions.length > 0) {
        await db.insert(schema.academyQuizQuestions).values(
          lesson.questions.map((question, index) => ({
            lessonId,
            prompt: question.prompt,
            choices: question.choices,
            correctIndex: question.correctIndex,
            explanation: question.explanation,
            sortOrder: index + 1,
          })),
        )
      }
    }
  }

  if (plan.removed.length > 0) {
    await db.delete(schema.academyLessons).where(inArray(schema.academyLessons.id, plan.removed.map((row) => row.id)))
    notes.push(`removed ${plan.removed.map((row) => row.slug).join(', ')}`)
  }
  const staleModules = existingModules.filter((row) => !moduleIds.includes(row.id)).map((row) => row.id)
  if (staleModules.length > 0) {
    await db
      .delete(schema.academyModules)
      .where(and(eq(schema.academyModules.courseId, courseId), inArray(schema.academyModules.id, staleModules)))
  }

  await upsertCertificate(db, 'course', courseId, course.certificate)
  notes.push(`${lessons.length} lessons in ${course.modules.length} modules`)
  return { kind: 'course', slug: course.slug, action: existing ? 'updated' : 'inserted', status: course.status, notes }
}

export async function syncAcademyTrack(db: Db, track: AcademyContentTrack, options: AcademySyncOptions = {}): Promise<AcademySyncReport> {
  const notes: string[] = []
  const cover = track.cover ? await resolveMedia(track.cover, track.sourcePath, `track-${track.slug}`, options) : null
  if (options.dryRun && !db) return { kind: 'track', slug: track.slug, action: 'validated', status: track.status, notes }

  const slugs = track.courses.map((course) => course.slug)
  const courseRows: { id: string; slug: string; status: string }[] = await db
    .select({ id: schema.academyCourses.id, slug: schema.academyCourses.slug, status: schema.academyCourses.status })
    .from(schema.academyCourses)
    .where(inArray(schema.academyCourses.slug, slugs))
  const missing = slugs.filter((slug) => !courseRows.some((row) => row.slug === slug))
  if (missing.length > 0) throw new Error(`${track.slug}: no course with slug ${missing.join(', ')}. Ingest the course first.`)
  const drafts = courseRows.filter((row) => row.status !== 'published').map((row) => row.slug)
  if (track.status === 'published' && drafts.length > 0) {
    notes.push(`still draft: ${drafts.join(', ')} (members will not see them on the track yet)`)
  }

  const [existing] = await db.select().from(schema.academyTracks).where(eq(schema.academyTracks.slug, track.slug)).limit(1)
  if (options.dryRun) return { kind: 'track', slug: track.slug, action: 'validated', status: track.status, notes }

  const values = {
    title: track.title,
    subtitle: track.subtitle,
    description: track.description,
    level: track.level,
    coverImageUrl: cover,
    estimatedHours: track.estimatedHours,
    outcomes: track.outcomes,
    status: track.status,
    sortOrder: track.sortOrder,
    updatedAt: new Date(),
  }
  let trackId: string
  if (existing) {
    trackId = existing.id
    await db.update(schema.academyTracks).set(values).where(eq(schema.academyTracks.id, trackId))
  } else {
    const [row] = await db
      .insert(schema.academyTracks)
      .values({ ...values, slug: track.slug })
      .returning({ id: schema.academyTracks.id })
    trackId = row.id
  }
  await db.delete(schema.academyTrackCourses).where(eq(schema.academyTrackCourses.trackId, trackId))
  await db.insert(schema.academyTrackCourses).values(
    track.courses.map((course, index) => ({
      trackId,
      courseId: courseRows.find((row) => row.slug === course.slug)!.id,
      sortOrder: index + 1,
      required: course.required,
    })),
  )
  await upsertCertificate(db, 'track', trackId, track.certificate)
  notes.push(`${track.courses.length} courses`)
  return { kind: 'track', slug: track.slug, action: existing ? 'updated' : 'inserted', status: track.status, notes }
}
