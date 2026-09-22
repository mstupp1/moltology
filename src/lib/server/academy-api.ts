import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { authenticatedMiddleware, publicMiddleware } from './functions'

const slugSchema = z.string().trim().min(1).max(160)

export const getAcademyHomeFn = createServerFn({ method: 'GET' })
  .middleware(publicMiddleware)
  .handler(async (args) => {
    const { getAcademyHomeHandler } = await import('./academy')
    return getAcademyHomeHandler(args)
  })

export const getAcademyCourseFn = createServerFn({ method: 'GET' })
  .middleware(publicMiddleware)
  .validator((data: { slug: string }) => z.object({ slug: slugSchema }).parse(data))
  .handler(async (args) => {
    const { getAcademyCourseHandler } = await import('./academy')
    return getAcademyCourseHandler(args)
  })

export const getAcademyTrackFn = createServerFn({ method: 'GET' })
  .middleware(publicMiddleware)
  .validator((data: { slug: string }) => z.object({ slug: slugSchema }).parse(data))
  .handler(async (args) => {
    const { getAcademyTrackHandler } = await import('./academy')
    return getAcademyTrackHandler(args)
  })

export const getAcademyLessonFn = createServerFn({ method: 'GET' })
  .middleware(publicMiddleware)
  .validator((data: { courseSlug: string; lessonSlug: string }) =>
    z.object({ courseSlug: slugSchema, lessonSlug: slugSchema }).parse(data),
  )
  .handler(async (args) => {
    const { getAcademyLessonHandler } = await import('./academy')
    return getAcademyLessonHandler(args)
  })

export const getAcademyCertificateFn = createServerFn({ method: 'GET' })
  .middleware(publicMiddleware)
  .validator((data: { credentialId: string }) =>
    z.object({ credentialId: z.string().trim().min(4).max(40) }).parse(data),
  )
  .handler(async (args) => {
    const { getAcademyCertificateHandler } = await import('./academy')
    return getAcademyCertificateHandler(args)
  })

const authFields = {
  token: z.string().optional(),
  userId: z.string().optional(),
}

export const enrollAcademyCourseFn = createServerFn({ method: 'POST' })
  .middleware(authenticatedMiddleware)
  .validator((data: { slug: string; token?: string; userId?: string }) =>
    z.object({ slug: slugSchema, ...authFields }).parse(data),
  )
  .handler(async (args) => {
    const { enrollAcademyCourseHandler } = await import('./academy')
    return enrollAcademyCourseHandler(args)
  })

export const enrollAcademyTrackFn = createServerFn({ method: 'POST' })
  .middleware(authenticatedMiddleware)
  .validator((data: { slug: string; token?: string; userId?: string }) =>
    z.object({ slug: slugSchema, ...authFields }).parse(data),
  )
  .handler(async (args) => {
    const { enrollAcademyTrackHandler } = await import('./academy')
    return enrollAcademyTrackHandler(args)
  })

export const saveAcademyLessonFn = createServerFn({ method: 'POST' })
  .middleware(authenticatedMiddleware)
  .validator((data: {
    courseSlug: string
    lessonSlug: string
    action: 'complete' | 'position' | 'note'
    lastPositionSeconds?: number
    note?: string
    token?: string
    userId?: string
  }) =>
    z.object({
      courseSlug: slugSchema,
      lessonSlug: slugSchema,
      action: z.enum(['complete', 'position', 'note']),
      lastPositionSeconds: z.number().int().min(0).max(60 * 60 * 24).optional(),
      note: z.string().max(4000).optional(),
      ...authFields,
    }).parse(data),
  )
  .handler(async (args) => {
    const { saveAcademyLessonHandler } = await import('./academy')
    return saveAcademyLessonHandler(args)
  })

export const submitAcademyQuizFn = createServerFn({ method: 'POST' })
  .middleware(authenticatedMiddleware)
  .validator((data: {
    courseSlug: string
    lessonSlug: string
    answers: Record<string, number>
    token?: string
    userId?: string
  }) =>
    z.object({
      courseSlug: slugSchema,
      lessonSlug: slugSchema,
      answers: z.record(z.string(), z.number().int().min(0).max(12)),
      ...authFields,
    }).parse(data),
  )
  .handler(async (args) => {
    const { submitAcademyQuizHandler } = await import('./academy')
    return submitAcademyQuizHandler(args)
  })
