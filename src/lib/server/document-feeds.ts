import { generateRssFeedXml, generateSitemapXml, SITE_ORIGIN } from '@/lib/seo'
import { getBlogPostsFn } from '@/lib/server/api'
import { INITIAL_BLOG_POSTS, type BlogPostData } from '@/lib/blog-data'

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

export async function sitemapXmlResponse(): Promise<Response> {
  const posts = await loadPublishedBlogPosts()
  return xmlDocumentResponse(
    generateSitemapXml(posts, SITE_ORIGIN),
    'application/xml; charset=utf-8',
    'public, max-age=3600, s-maxage=86400',
  )
}
