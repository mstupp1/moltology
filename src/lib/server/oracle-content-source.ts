import { and, desc, eq, gte, ilike, inArray, isNull, or, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { forumCategories, forumTopics, profiles } from '../../db/schema'
import { escapeLikePattern, forumCategoryLookupSlugs, toForumIso, visibleForumContent } from '../forum-utils'
import { resolveMemberPublicName } from '../member-handle'
import type { BlogPostData } from '../blog-data'
import type { ChangelogEntry } from '../changelogs-data'
import type {
  AcademyCatalogRead,
  ChangelogRead,
  ForumThreadRead,
  ForumTopicSummary,
  NewsArticleRead,
  NewsSummary,
  OracleContentSource,
} from '../ai/oracle-read-tools'

/**
 * The Oracle's read tools, backed by the database. Public reads only: no member id or
 * token is passed anywhere, so nothing is personalized, no view or visit is recorded,
 * and withdrawn, sunk or unpublished content never comes back.
 */

function iso(value: string | Date | null | undefined): string {
  return toForumIso(value) ?? new Date(0).toISOString()
}

async function forumTopicsFromDb(options: Parameters<OracleContentSource['forumTopics']>[0]): Promise<ForumTopicSummary[]> {
  const db = getDb()
  const conditions = [isNull(forumTopics.deletedAt)]
  if (options.since) conditions.push(gte(forumTopics.lastReplyAt, options.since))
  if (options.board) conditions.push(inArray(forumCategories.slug, forumCategoryLookupSlugs(options.board)))
  if (options.query) {
    const q = `%${escapeLikePattern(options.query)}%`
    conditions.push(or(ilike(forumTopics.title, q), ilike(forumTopics.content, q))!)
  }
  if (options.discoveryOnly) conditions.push(or(eq(forumTopics.isPinned, true), eq(forumTopics.discoveryEligible, true))!)

  const rows = await db
    .select({
      title: forumTopics.title,
      slug: forumTopics.slug,
      boardSlug: forumCategories.slug,
      boardName: forumCategories.name,
      userId: forumTopics.userId,
      authorName: forumTopics.authorName,
      handle: profiles.handle,
      larvaId: profiles.larvaId,
      snippet: sql<string>`left(${forumTopics.content}, 400)`,
      upvotes: forumTopics.upvotes,
      repliesCount: forumTopics.repliesCount,
      isPinned: forumTopics.isPinned,
      createdAt: forumTopics.createdAt,
      lastReplyAt: forumTopics.lastReplyAt,
    })
    .from(forumTopics)
    .leftJoin(forumCategories, eq(forumTopics.categoryId, forumCategories.id))
    .leftJoin(profiles, eq(forumTopics.userId, profiles.id))
    .where(and(...conditions))
    .orderBy(desc(forumTopics.lastReplyAt), desc(forumTopics.id))
    .limit(Math.min(Math.max(options.limit, 1), 100))

  return rows.map((r) => ({
    title: r.title,
    slug: r.slug,
    boardSlug: r.boardSlug || 'general-discussion',
    boardName: r.boardName || 'General Discussion',
    authorName: resolveMemberPublicName({ userId: r.userId, handle: r.handle, larvaId: r.larvaId ?? r.authorName }),
    snippet: r.snippet ?? '',
    upvotes: r.upvotes ?? 0,
    repliesCount: r.repliesCount ?? 0,
    isPinned: Boolean(r.isPinned),
    createdAt: iso(r.createdAt),
    lastReplyAt: iso(r.lastReplyAt),
  }))
}

async function forumBoardsFromDb() {
  const db = getDb()
  return db
    .select({ slug: forumCategories.slug, name: forumCategories.name })
    .from(forumCategories)
    .orderBy(forumCategories.sortOrder)
}

async function forumThreadFromDb(slugOrId: string): Promise<ForumThreadRead | null> {
  const { getForumTopicDetailHandler } = await import('./db-services')
  // No userId or token: a public read that records no view or visit.
  const detail = await getForumTopicDetailHandler({
    data: { slugOrId, trackView: false, replySort: 'top', replyLimit: 12 },
  } as never)
  if (!detail) return null
  const t = detail.topic
  return {
    topic: {
      title: t.title,
      slug: t.slug,
      boardSlug: t.categorySlug || 'general-discussion',
      boardName: t.categoryName || 'General Discussion',
      authorName: t.authorName,
      snippet: '',
      content: visibleForumContent(t.content, t.deletedAt),
      upvotes: t.upvotes ?? 0,
      repliesCount: t.repliesCount ?? 0,
      isPinned: Boolean(t.isPinned),
      isLocked: Boolean(t.isLocked),
      createdAt: t.createdAt,
      lastReplyAt: t.lastReplyAt,
    },
    replies: detail.posts
      .filter((p) => !p.sunk && !p.deletedAt)
      .map((p) => ({ authorName: p.authorName, content: p.content, upvotes: p.upvotes ?? 0, createdAt: p.createdAt })),
  }
}

async function newsListFromDb(): Promise<NewsSummary[]> {
  const { getBlogPostsHandler } = await import('./db-services')
  const posts = (await getBlogPostsHandler({} as never)) as BlogPostData[]
  return (posts ?? [])
    .filter((p) => p.isPublished !== false)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      category: p.category,
      tags: Array.isArray(p.tags) ? p.tags : [],
      publishedAt: iso(p.publishedAt),
    }))
}

async function newsArticleFromDb(slug: string): Promise<NewsArticleRead | null> {
  const { getBlogPostBySlugHandler } = await import('./db-services')
  const post = await getBlogPostBySlugHandler({ data: slug } as never)
  if (!post) return null
  return {
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    category: post.category,
    tags: Array.isArray(post.tags) ? post.tags : [],
    publishedAt: iso(post.publishedAt),
    content: post.content ?? '',
  }
}

async function changelogsFromDb(): Promise<ChangelogRead[]> {
  const { getPublicChangelogsHandler } = await import('./db-services')
  const entries = (await getPublicChangelogsHandler({} as never)) as ChangelogEntry[]
  return (entries ?? []).map((c) => ({
    slug: c.slug,
    version: c.version,
    title: c.title,
    category: String(c.category ?? ''),
    summary: c.summary ?? '',
    content: c.content ?? '',
    releasedAt: iso(c.releasedAt),
  }))
}

async function academyCatalogFromDb(): Promise<AcademyCatalogRead> {
  const { getAcademyHomeHandler } = await import('./academy')
  const home = await getAcademyHomeHandler({})
  return {
    courses: home.courses.map((c) => ({
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      category: c.category,
      level: c.level,
      lessonCount: c.lessonCount,
      estimatedMinutes: c.estimatedMinutes,
    })),
    tracks: home.tracks.map((t) => ({ slug: t.slug, title: t.title, subtitle: t.subtitle, level: t.level })),
  }
}

export const oracleContentSource: OracleContentSource = {
  forumTopics: forumTopicsFromDb,
  forumBoards: forumBoardsFromDb,
  forumThread: forumThreadFromDb,
  newsList: newsListFromDb,
  newsArticle: newsArticleFromDb,
  changelogs: changelogsFromDb,
  academyCatalog: academyCatalogFromDb,
}
