import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getBlogPostBySlugFn } from '@/lib/server/api'
import { INITIAL_BLOG_POSTS } from '@/lib/blog-data'
import type { BlogPostData } from '@/lib/blog-data'
import { seo } from '@/lib/seo'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyNewsPostDetail = lazy(() =>
  import('@/components/news/NewsPostDetail').then((m) => ({ default: m.NewsPostDetail }))
)

function NewsPostRoute() {
  return (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyNewsPostDetail />
    </Suspense>
  )
}

export const Route = createFileRoute('/news/$slug')({
  loader: async ({ params }) => {
    try {
      const res = await getBlogPostBySlugFn({ data: params.slug })
      if (res) return res
    } catch (e) {
      console.warn('Loader error fetching post:', e)
    }
    return INITIAL_BLOG_POSTS.find((p) => p.slug === params.slug) ?? null
  },
  head: ({ loaderData }) => {
    const post = loaderData as BlogPostData | null
    const title = post?.title ? `${post.title} | MoltNation News` : 'News Dispatch | MoltNation News'
    const description = post?.summary || 'Patriot Telemetry & AI Intelligence from the MoltNation Benthic Desk.'
    const url = post?.slug ? `https://moltology.org/news/${post.slug}` : 'https://moltology.org/news'
    const imageUrl = post?.coverImageUrl || 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/ai_learning_ascension_cover.jpg'
    const publishedTime = post?.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString()
    const author = post?.authorName || 'High Ascendant Carcinus'
    const tags = post?.tags || ['MoltNation', 'AI Intelligence', 'Sub-Benthic Compute']

    return {
      meta: [
        ...seo({
          title,
          description,
          keywords: tags.join(', '),
          ogImage: imageUrl,
          ogType: 'article',
          canonical: url,
          siteName: 'MoltNation News',
          author,
          publishedTime,
          section: post?.category || 'MoltNation Telemetry',
          twitterCard: 'summary_large_image',
          twitterSite: '@moltology',
          twitterCreator: '@moltology',
        }),
      ],
      links: [
        { rel: 'canonical', href: url },
      ],
    }
  },
  component: NewsPostRoute,
})