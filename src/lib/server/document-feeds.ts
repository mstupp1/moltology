import { generateRssFeedXml, generateSitemapXml, SITE_ORIGIN, type SitemapUrlEntry } from '@/lib/seo'
import { getBlogPostsFn, getForumCategoriesFn, getForumTopicsFn } from '@/lib/server/api'
import { INITIAL_BLOG_POSTS, type BlogPostData } from '@/lib/blog-data'
import { getAcademyCourseFn, getAcademyHomeFn } from '@/lib/server/academy-api'

export async function loadPublishedBlogPosts(): Promise<BlogPostData[]> {
  try {
    const fetched = await getBlogPostsFn()
    if (fetched && fetched.length > 0) {
      return fetched as BlogPostData[]
    }
  } catch (error) {
    console.warn('Error loading published posts for document routes:', error)
  }
  return INITIAL_BLOG_POSTS
}

export function xmlDocumentResponse(
  body: string,
  contentType: string,
  cacheControl: string,
): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    },
  })
}

export function markdownDocumentResponse(
  body: string,
  cacheControl: string,
  status = 200,
): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': cacheControl,
    },
  })
}

export async function rssXmlResponse(): Promise<Response> {
  const posts = await loadPublishedBlogPosts()
  return xmlDocumentResponse(
    generateRssFeedXml(posts, SITE_ORIGIN),
    'application/rss+xml; charset=utf-8',
    'public, max-age=1800, s-maxage=3600',
  )
}

/** Most recent topics listed in the sitemap; older ones are still reachable from their board. */
export const SITEMAP_FORUM_TOPIC_MAX = 500
const SITEMAP_FORUM_PAGE = 100

function sitemapDay(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().split('T')[0]
}

/**
 * Public forum boards and topics for the sitemap. The forum lists load by scrolling,
 * which search engines do not do, so this is how they find older topics.
 */
export async function loadForumSitemapEntries(baseUrl = SITE_ORIGIN): Promise<SitemapUrlEntry[]> {
  const entries: SitemapUrlEntry[] = []
  try {
    const boards = (await getForumCategoriesFn()) ?? []
    for (const board of boards) {
      if (!board.slug) continue
      entries.push({ loc: `${baseUrl}/forum/${encodeURIComponent(board.slug)}`, changefreq: 'daily', priority: 0.6 })
    }
    for (let offset = 0; offset < SITEMAP_FORUM_TOPIC_MAX; offset += SITEMAP_FORUM_PAGE) {
      const topics =
        (await getForumTopicsFn({ data: { sortBy: 'latest', limit: SITEMAP_FORUM_PAGE, ...(offset ? { offset } : {}) } })) ?? []
      for (const topic of topics) {
        if (!topic.slug || !topic.categorySlug || topic.deletedAt) continue
        entries.push({
          loc: `${baseUrl}/forum/${encodeURIComponent(topic.categorySlug)}/${encodeURIComponent(topic.slug)}`,
          lastmod: sitemapDay(topic.lastReplyAt || topic.updatedAt || topic.createdAt),
          changefreq: 'weekly',
          priority: 0.5,
        })
      }
      if (topics.length < SITEMAP_FORUM_PAGE) break
    }
  } catch (error) {
    console.warn('Error loading forum pages for the sitemap:', error)
  }
  return entries
}

/**
 * Published Academy tracks, courses and lessons for the sitemap. Lessons are public to read
 * (docs/logic/decisions/2026-11-18-public-profiles-and-lessons.md), so search can land on them.
 * Credential pages name a learner and stay out.
 */
export async function loadAcademySitemapEntries(baseUrl = SITE_ORIGIN): Promise<SitemapUrlEntry[]> {
  const entries: SitemapUrlEntry[] = []
  try {
    const home = await getAcademyHomeFn()
    for (const track of home?.tracks ?? []) {
      if (!track.slug) continue
      entries.push({ loc: `${baseUrl}/academy/tracks/${encodeURIComponent(track.slug)}`, changefreq: 'weekly', priority: 0.6 })
    }
    const courseSlugs = (home?.courses ?? []).map((course) => course.slug).filter(Boolean)
    const details = await Promise.all(
      courseSlugs.map((slug) => getAcademyCourseFn({ data: { slug } }).catch(() => null)),
    )
    courseSlugs.forEach((slug, index) => {
      const coursePath = `${baseUrl}/academy/courses/${encodeURIComponent(slug)}`
      entries.push({ loc: coursePath, changefreq: 'weekly', priority: 0.6 })
      for (const module of details[index]?.modules ?? []) {
        for (const lesson of module.lessons) {
          if (!lesson.slug) continue
          entries.push({ loc: `${coursePath}/lessons/${encodeURIComponent(lesson.slug)}`, changefreq: 'monthly', priority: 0.5 })
        }
      }
    })
  } catch (error) {
    console.warn('Error loading Academy pages for the sitemap:', error)
  }
  return entries
}

export async function sitemapXmlResponse(): Promise<Response> {
  const [posts, forum, academy] = await Promise.all([
    loadPublishedBlogPosts(),
    loadForumSitemapEntries(),
    loadAcademySitemapEntries(),
  ])
  return xmlDocumentResponse(
    generateSitemapXml(posts, SITE_ORIGIN, [...forum, ...academy]),
    'application/xml; charset=utf-8',
    'public, max-age=3600, s-maxage=86400',
  )
}
