import fs from 'node:fs'
import path from 'node:path'
import { eq } from 'drizzle-orm'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as dotenv from 'dotenv'
import * as schema from '../../db/schema'
import { uploadLocalFileToS3 } from './s3-upload'
import {
  inferContentType,
  normalizeBlogPayload,
  normalizeChangelogPayload,
  normalizePodcastPayload,
} from './parser'
import { IngestOptions, IngestResult, RawParsedContent } from './types'

dotenv.config()

/**
 * Gets or creates a database client for CLI ingestion.
 * Defaults to the production database unless --dev is explicitly passed.
 */
export function getIngestDb(config?: IngestOptions | string) {
  let databaseUrl: string | undefined

  if (typeof config === 'string') {
    databaseUrl = config
  } else if (config) {
    if (config.dbUrl) {
      databaseUrl = config.dbUrl
    } else if (config.dev) {
      databaseUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL
    } else {
      // Default to production database
      databaseUrl =
        process.env.PROD_DATABASE_URL ||
        process.env.DATABASE_URL_PROD ||
        process.env.DATABASE_URL
    }
  } else {
    // Default to production database
    databaseUrl =
      process.env.PROD_DATABASE_URL ||
      process.env.DATABASE_URL_PROD ||
      process.env.DATABASE_URL
  }

  if (!databaseUrl) {
    throw new Error(
      'Database connection URL is missing. Please set PROD_DATABASE_URL or DATABASE_URL in your .env file.'
    )
  }
  const client = neon(databaseUrl)
  return drizzle(client, { schema })
}

/**
 * Upserts a blog post into Neon PostgreSQL.
 */
export async function upsertBlogPost(
  parsed: RawParsedContent,
  dbClient: any,
  dryRun = false
): Promise<IngestResult> {
  const payload = normalizeBlogPayload(parsed)

  // Auto-detect local cover image file and upload to Neon S3
  if (
    payload.coverImageUrl &&
    !payload.coverImageUrl.startsWith('http://') &&
    !payload.coverImageUrl.startsWith('https://') &&
    !payload.coverImageUrl.startsWith('/images/')
  ) {
    let localImagePath = path.isAbsolute(payload.coverImageUrl)
      ? payload.coverImageUrl
      : path.resolve(path.dirname(parsed.filePath), payload.coverImageUrl)

    if (!fs.existsSync(localImagePath)) {
      const rootPath = path.resolve(process.cwd(), payload.coverImageUrl)
      if (fs.existsSync(rootPath)) {
        localImagePath = rootPath
      }
    }

    if (fs.existsSync(localImagePath) && fs.statSync(localImagePath).isFile()) {
      if (!dryRun) {
        const ext = path.extname(localImagePath)
        const targetKey = `images/blog/${payload.slug}-cover${ext}`
        const uploaded = await uploadLocalFileToS3(localImagePath, targetKey)
        payload.coverImageUrl = uploaded.publicUrl
      }
    }
  }

  // Auto-detect local inline images inside markdown body and upload to Neon S3
  const inlineImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  let bodyContent = payload.content
  const inlineMatches = Array.from(payload.content.matchAll(inlineImageRegex))

  for (let i = 0; i < inlineMatches.length; i++) {
    const match = inlineMatches[i]
    const fullMatch = match[0]
    const altText = match[1]
    const src = match[2].trim()

    if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/images/')) {
      let localImagePath = path.isAbsolute(src)
        ? src
        : path.resolve(path.dirname(parsed.filePath), src)

      if (!fs.existsSync(localImagePath)) {
        const rootPath = path.resolve(process.cwd(), src)
        if (fs.existsSync(rootPath)) {
          localImagePath = rootPath
        }
      }

      if (fs.existsSync(localImagePath) && fs.statSync(localImagePath).isFile()) {
        if (!dryRun) {
          const ext = path.extname(localImagePath)
          const cleanAlt =
            altText
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '') || `figure-${i + 1}`
          const targetKey = `images/blog/${payload.slug}-${cleanAlt}${ext}`
          const uploaded = await uploadLocalFileToS3(localImagePath, targetKey)
          bodyContent = bodyContent.replace(fullMatch, `![${altText}](${uploaded.publicUrl})`)
        }
      }
    }
  }
  payload.content = bodyContent

  if (dryRun) {
    return {
      filePath: parsed.filePath,
      type: 'blog',
      identifier: payload.slug,
      title: payload.title,
      action: 'validated',
      success: true,
    }
  }

  // Check if post already exists to report accurate action
  const existing = await dbClient
    .select({ id: schema.blogPosts.id })
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.slug, payload.slug))
    .limit(1)

  const isUpdate = existing.length > 0

  await dbClient
    .insert(schema.blogPosts)
    .values({
      slug: payload.slug,
      title: payload.title,
      summary: payload.summary,
      content: payload.content,
      coverImageUrl: payload.coverImageUrl,
      authorName: payload.authorName,
      authorAvatar: payload.authorAvatar,
      authorRole: payload.authorRole,
      category: payload.category,
      tags: payload.tags,
      readTimeMinutes: payload.readTimeMinutes,
      isFeatured: payload.isFeatured,
      isPublished: payload.isPublished,
      publishedAt: payload.publishedAt,
    })
    .onConflictDoUpdate({
      target: schema.blogPosts.slug,
      set: {
        title: payload.title,
        summary: payload.summary,
        content: payload.content,
        coverImageUrl: payload.coverImageUrl,
        authorName: payload.authorName,
        authorAvatar: payload.authorAvatar,
        authorRole: payload.authorRole,
        category: payload.category,
        tags: payload.tags,
        readTimeMinutes: payload.readTimeMinutes,
        isFeatured: payload.isFeatured,
        isPublished: payload.isPublished,
        publishedAt: payload.publishedAt,
        updatedAt: new Date(),
      },
    })

  return {
    filePath: parsed.filePath,
    type: 'blog',
    identifier: payload.slug,
    title: payload.title,
    action: isUpdate ? 'updated' : 'inserted',
    success: true,
  }
}

/**
 * Upserts a changelog entry into Neon PostgreSQL.
 */
export async function upsertChangelog(
  parsed: RawParsedContent,
  dbClient: any,
  dryRun = false
): Promise<IngestResult> {
  const payload = normalizeChangelogPayload(parsed)

  if (dryRun) {
    return {
      filePath: parsed.filePath,
      type: 'changelog',
      identifier: payload.slug,
      title: payload.title,
      action: 'validated',
      success: true,
    }
  }

  const existing = await dbClient
    .select({ id: schema.changelogs.id })
    .from(schema.changelogs)
    .where(eq(schema.changelogs.slug, payload.slug))
    .limit(1)

  const isUpdate = existing.length > 0

  await dbClient
    .insert(schema.changelogs)
    .values({
      slug: payload.slug,
      version: payload.version || 'v1.0.0',
      title: payload.title,
      category: payload.category,
      summary: payload.summary,
      content: payload.content,
      isPublished: payload.isPublished,
      releasedAt: payload.releasedAt,
    })
    .onConflictDoUpdate({
      target: schema.changelogs.slug,
      set: {
        version: payload.version || 'v1.0.0',
        title: payload.title,
        category: payload.category,
        summary: payload.summary,
        content: payload.content,
        isPublished: payload.isPublished,
        releasedAt: payload.releasedAt,
      },
    })

  return {
    filePath: parsed.filePath,
    type: 'changelog',
    identifier: payload.slug,
    title: payload.title,
    action: isUpdate ? 'updated' : 'inserted',
    success: true,
  }
}

/**
 * Upserts a podcast transmission into Neon PostgreSQL.
 */
export async function upsertPodcast(
  parsed: RawParsedContent,
  dbClient: any,
  dryRun = false
): Promise<IngestResult> {
  const payload = normalizePodcastPayload(parsed)

  // Auto-detect local audio file and upload to Neon S3
  if (
    payload.audioUrl &&
    !payload.audioUrl.startsWith('http://') &&
    !payload.audioUrl.startsWith('https://')
  ) {
    let localAudioPath = path.isAbsolute(payload.audioUrl)
      ? payload.audioUrl
      : path.resolve(path.dirname(parsed.filePath), payload.audioUrl)

    if (!fs.existsSync(localAudioPath)) {
      const rootPath = path.resolve(process.cwd(), payload.audioUrl)
      if (fs.existsSync(rootPath)) {
        localAudioPath = rootPath
      }
    }

    if (fs.existsSync(localAudioPath) && fs.statSync(localAudioPath).isFile()) {
      if (!dryRun) {
        const ext = path.extname(localAudioPath)
        const targetKey = `podcasts/${payload.slug}${ext}`
        const uploaded = await uploadLocalFileToS3(localAudioPath, targetKey)
        payload.audioUrl = uploaded.publicUrl
        payload.s3Key = targetKey
        payload.fileSizeBytes = uploaded.size
      }
    }
  }

  if (dryRun) {
    return {
      filePath: parsed.filePath,
      type: 'podcast',
      identifier: payload.slug,
      title: payload.title,
      action: 'validated',
      success: true,
    }
  }

  const existing = await dbClient
    .select({ id: schema.podcasts.id })
    .from(schema.podcasts)
    .where(eq(schema.podcasts.slug, payload.slug))
    .limit(1)

  const isUpdate = existing.length > 0

  await dbClient
    .insert(schema.podcasts)
    .values({
      slug: payload.slug,
      title: payload.title,
      subtitle: payload.subtitle,
      description: payload.description,
      audioUrl: payload.audioUrl,
      s3Key: payload.s3Key,
      durationSeconds: payload.durationSeconds,
      fileSizeBytes: payload.fileSizeBytes,
      authorName: payload.authorName,
      authorAvatar: payload.authorAvatar,
      authorRole: payload.authorRole,
      category: payload.category,
      tags: payload.tags,
      isFeatured: payload.isFeatured,
      isPublished: payload.isPublished,
      transcript: payload.transcript,
      publishedAt: payload.publishedAt,
    })
    .onConflictDoUpdate({
      target: schema.podcasts.slug,
      set: {
        title: payload.title,
        subtitle: payload.subtitle,
        description: payload.description,
        audioUrl: payload.audioUrl,
        s3Key: payload.s3Key,
        durationSeconds: payload.durationSeconds,
        fileSizeBytes: payload.fileSizeBytes,
        authorName: payload.authorName,
        authorAvatar: payload.authorAvatar,
        authorRole: payload.authorRole,
        category: payload.category,
        tags: payload.tags,
        isFeatured: payload.isFeatured,
        isPublished: payload.isPublished,
        transcript: payload.transcript,
        publishedAt: payload.publishedAt,
        updatedAt: new Date(),
      },
    })

  return {
    filePath: parsed.filePath,
    type: 'podcast',
    identifier: payload.slug,
    title: payload.title,
    action: isUpdate ? 'updated' : 'inserted',
    success: true,
  }
}

/**
 * Dispatches a parsed content item to the appropriate table upsert handler.
 */
export async function ingestContentItem(
  parsed: RawParsedContent,
  options: IngestOptions = {},
  dbClient?: any
): Promise<IngestResult> {
  const targetType = inferContentType(
    parsed.filePath,
    options.type,
    parsed.metadata?.type
  )

  const client = options.dryRun ? null : dbClient || getIngestDb(options)

  try {
    switch (targetType) {
      case 'blog':
      case 'news':
        return await upsertBlogPost(parsed, client, options.dryRun)
      case 'changelog':
        return await upsertChangelog(parsed, client, options.dryRun)
      case 'podcast':
        return await upsertPodcast(parsed, client, options.dryRun)
      default:
        throw new Error(`Unsupported content type: "${targetType}"`)
    }
  } catch (err: any) {
    return {
      filePath: parsed.filePath,
      type: targetType,
      identifier: parsed.metadata?.slug || parsed.metadata?.version || 'unknown',
      title: parsed.metadata?.title || 'Unknown Title',
      action: 'skipped',
      success: false,
      error: err.message,
    }
  }
}
