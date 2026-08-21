export type IngestContentType = 'blog' | 'news' | 'changelog' | 'podcast'

export interface IngestOptions {
  file?: string
  dir?: string
  type?: IngestContentType
  dryRun?: boolean
  silent?: boolean
  dbUrl?: string
  prod?: boolean
  dev?: boolean
  clean?: boolean
}

export interface IngestResult {
  filePath: string
  type: IngestContentType
  identifier: string // slug or version
  title: string
  action: 'inserted' | 'updated' | 'validated' | 'skipped'
  success: boolean
  error?: string
}

export interface RawParsedContent {
  metadata: Record<string, any>
  content: string
  filePath: string
}

export interface BlogPostPayload {
  slug: string
  title: string
  summary: string
  content: string
  coverImageUrl?: string | null
  authorName?: string
  authorAvatar?: string
  authorRole?: string
  category?: string
  tags?: string[]
  readTimeMinutes?: number
  isFeatured?: boolean
  isPublished?: boolean
  publishedAt?: Date
}

export interface ChangelogPayload {
  slug: string
  version?: string
  title: string
  category: string
  tags?: string[]
  summary: string
  content: string
  isPublished?: boolean
  releasedAt?: Date
}

export interface PodcastPayload {
  slug: string
  title: string
  subtitle?: string | null
  description: string
  audioUrl: string
  s3Key?: string | null
  durationSeconds: number
  fileSizeBytes?: number | null
  authorName?: string
  authorAvatar?: string
  authorRole?: string
  category?: string
  tags?: string[]
  isFeatured?: boolean
  isPublished?: boolean
  transcript?: string | null
  publishedAt?: Date
}
