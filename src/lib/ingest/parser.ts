import matter from 'gray-matter'
import {
  BlogPostPayload,
  ChangelogPayload,
  IngestContentType,
  PodcastPayload,
  RawParsedContent,
} from './types'

/**
 * Converts a string into a clean, URL-safe kebab-case slug.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .replace(/[\s_-]+/g, '-') // replace spaces/underscores with single hyphen
    .replace(/^-+|-+$/g, '') // remove leading/trailing hyphens
}

/**
 * Calculates estimated read time in minutes based on word count.
 */
export function calculateReadTime(content: string, wpm = 200): number {
  if (!content || !content.trim()) return 1
  // Strip code blocks and markdown symbols for a more accurate word count
  const cleanText = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`.*?`/g, '')
    .replace(/[#*>\-_~[\]()]/g, ' ')
    .trim()
  const words = cleanText.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / wpm))
}

/**
 * Infers the target content type from CLI flag, frontmatter, or file path.
 */
export function inferContentType(
  filePath: string,
  explicitType?: string,
  frontmatterType?: string
): IngestContentType {
  const normalize = (t?: string): IngestContentType | null => {
    if (!t) return null
    const lower = t.toLowerCase().trim()
    if (lower === 'blog' || lower === 'news' || lower === 'article') return 'blog'
    if (lower === 'changelog' || lower === 'changelogs') return 'changelog'
    if (lower === 'podcast' || lower === 'podcasts' || lower === 'audio') return 'podcast'
    return null
  }

  const explicit = normalize(explicitType)
  if (explicit) return explicit

  const fromFrontmatter = normalize(frontmatterType)
  if (fromFrontmatter) return fromFrontmatter

  const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/')
  if (normalizedPath.includes('/news/') || normalizedPath.includes('/blog/')) return 'blog'
  if (normalizedPath.includes('/changelog/') || normalizedPath.includes('/changelogs/')) return 'changelog'
  if (normalizedPath.includes('/podcast/') || normalizedPath.includes('/podcasts/')) return 'podcast'

  return 'blog'
}

/**
 * Parses a raw file content (Markdown with YAML frontmatter or JSON).
 */
export function parseContentFile(filePath: string, rawContent: string): RawParsedContent {
  const isJson = filePath.toLowerCase().endsWith('.json')

  if (isJson) {
    try {
      const parsed = JSON.parse(rawContent)
      const content = parsed.content || ''
      const metadata = { ...parsed }
      delete metadata.content
      return { metadata, content, filePath }
    } catch (err: any) {
      throw new Error(`Failed to parse JSON file "${filePath}": ${err.message}`)
    }
  }

  // Markdown with frontmatter
  try {
    const { data: metadata, content } = matter(rawContent)
    return { metadata: metadata || {}, content: content.trim(), filePath }
  } catch (err: any) {
    throw new Error(`Failed to parse YAML frontmatter in "${filePath}": ${err.message}`)
  }
}

/**
 * Normalizes parsed data into a validated BlogPostPayload.
 */
export function normalizeBlogPayload(parsed: RawParsedContent): BlogPostPayload {
  const { metadata, content } = parsed

  const title = metadata.title || metadata.name
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error(`Missing required "title" in frontmatter/payload for "${parsed.filePath}"`)
  }

  const slug = metadata.slug ? generateSlug(String(metadata.slug)) : generateSlug(title)
  if (!slug) {
    throw new Error(`Could not generate a valid slug from title "${title}" in "${parsed.filePath}"`)
  }

  const summary =
    metadata.summary ||
    metadata.description ||
    (content ? content.slice(0, 180).replace(/[#*>\-_~`]/g, '').trim() + '...' : 'No summary provided.')

  const tags = Array.isArray(metadata.tags)
    ? metadata.tags.map((t: any) => String(t).trim()).filter(Boolean)
    : typeof metadata.tags === 'string'
      ? metadata.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []

  const readTimeMinutes =
    typeof metadata.readTimeMinutes === 'number'
      ? metadata.readTimeMinutes
      : calculateReadTime(content)

  const publishedAt = metadata.publishedAt || metadata.date
    ? new Date(metadata.publishedAt || metadata.date)
    : new Date()

  return {
    slug,
    title: title.trim(),
    summary: summary.trim(),
    content: content.trim(),
    coverImageUrl: metadata.coverImageUrl || metadata.image || metadata.cover || null,
    authorName: metadata.authorName || metadata.author || 'High Ascendant Carcinus',
    authorAvatar: metadata.authorAvatar || '/images/order_emblem.png',
    authorRole: metadata.authorRole || 'Stage 4 Ascendant',
    category: metadata.category || 'SACRED DOCTRINE',
    tags,
    readTimeMinutes,
    isFeatured: Boolean(metadata.isFeatured),
    isPublished: metadata.isPublished !== undefined ? Boolean(metadata.isPublished) : true,
    publishedAt,
  }
}

/**
 * Normalizes parsed data into a validated ChangelogPayload.
 */
export function normalizeChangelogPayload(parsed: RawParsedContent): ChangelogPayload {
  const { metadata, content } = parsed

  const version = metadata.version || metadata.tag
  if (!version || typeof version !== 'string' || !version.trim()) {
    throw new Error(`Missing required "version" in frontmatter/payload for "${parsed.filePath}"`)
  }

  const title = metadata.title || metadata.name
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error(`Missing required "title" in frontmatter/payload for "${parsed.filePath}"`)
  }

  const summary =
    metadata.summary ||
    metadata.description ||
    (content ? content.slice(0, 160).replace(/[#*>\-_~`]/g, '').trim() + '...' : 'System update.')

  const releasedAt = metadata.releasedAt || metadata.date
    ? new Date(metadata.releasedAt || metadata.date)
    : new Date()

  return {
    version: version.trim(),
    title: title.trim(),
    category: metadata.category || 'FEATURE',
    summary: summary.trim(),
    content: content.trim(),
    isPublished: metadata.isPublished !== undefined ? Boolean(metadata.isPublished) : true,
    releasedAt,
  }
}

/**
 * Normalizes parsed data into a validated PodcastPayload.
 */
export function normalizePodcastPayload(parsed: RawParsedContent): PodcastPayload {
  const { metadata, content } = parsed

  const title = metadata.title || metadata.name
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error(`Missing required "title" in frontmatter/payload for "${parsed.filePath}"`)
  }

  const audioUrl = metadata.audioUrl || metadata.audio || metadata.url
  if (!audioUrl || typeof audioUrl !== 'string' || !audioUrl.trim()) {
    throw new Error(`Missing required "audioUrl" in frontmatter/payload for "${parsed.filePath}"`)
  }

  const slug = metadata.slug ? generateSlug(String(metadata.slug)) : generateSlug(title)
  if (!slug) {
    throw new Error(`Could not generate a valid slug from title "${title}" in "${parsed.filePath}"`)
  }

  const description =
    metadata.description ||
    metadata.summary ||
    (content ? content.slice(0, 200).replace(/[#*>\-_~`]/g, '').trim() : 'No description provided.')

  const tags = Array.isArray(metadata.tags)
    ? metadata.tags.map((t: any) => String(t).trim()).filter(Boolean)
    : typeof metadata.tags === 'string'
      ? metadata.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []

  const durationSeconds =
    typeof metadata.durationSeconds === 'number'
      ? metadata.durationSeconds
      : typeof metadata.duration === 'number'
        ? metadata.duration
        : 0

  const publishedAt = metadata.publishedAt || metadata.date
    ? new Date(metadata.publishedAt || metadata.date)
    : new Date()

  return {
    slug,
    title: title.trim(),
    subtitle: metadata.subtitle || null,
    description: description.trim(),
    audioUrl: audioUrl.trim(),
    s3Key: metadata.s3Key || null,
    durationSeconds,
    fileSizeBytes: metadata.fileSizeBytes || null,
    authorName: metadata.authorName || metadata.author || 'High Ascendant Carcinus',
    authorAvatar: metadata.authorAvatar || '/images/order_emblem.png',
    authorRole: metadata.authorRole || 'Stage 4 Ascendant',
    category: metadata.category || 'TRANSMISSION',
    tags,
    isFeatured: Boolean(metadata.isFeatured),
    isPublished: metadata.isPublished !== undefined ? Boolean(metadata.isPublished) : true,
    transcript: metadata.transcript || (content ? content.trim() : null),
    publishedAt,
  }
}
