import { useEffect, useState } from 'react'
import { getBlogPostBySlugFn } from '@/lib/server/api'
import type { BlogPostData } from '@/lib/blog-data'

/**
 * Blog listings ship without article bodies (see getBlogPostsHandler). This loads the body
 * for the one post a reader opens. Returns null while loading, and falls back to the summary
 * if the body can't be loaded.
 */
export function useBlogPostBody(post: BlogPostData | null): string | null {
  const slug = post?.slug ?? null
  const inlineBody = post?.content || null
  const summary = post?.summary ?? ''
  const [loaded, setLoaded] = useState<{ slug: string; content: string } | null>(null)

  useEffect(() => {
    if (!slug || inlineBody) return
    let isMounted = true
    getBlogPostBySlugFn({ data: slug })
      .then((full) => {
        if (isMounted) setLoaded({ slug, content: full?.content || summary })
      })
      .catch(() => {
        if (isMounted) setLoaded({ slug, content: summary })
      })
    return () => {
      isMounted = false
    }
  }, [slug, inlineBody, summary])

  if (inlineBody) return inlineBody
  return loaded && loaded.slug === slug ? loaded.content : null
}
