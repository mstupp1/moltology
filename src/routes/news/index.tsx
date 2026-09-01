import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getBlogPostsFn } from '@/lib/server/api'
import { INITIAL_BLOG_POSTS } from '@/lib/blog-data'
import type { BlogPostData } from '@/lib/blog-data'
import { seo } from '@/lib/seo'
import { getAssetUrl } from '@/lib/assets'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyNewsIndexPage = lazy(() =>
  import('@/components/news/NewsIndexPage').then((m) => ({ default: m.NewsIndexPage }))
)

function NewsIndexRoute() {
  return (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyNewsIndexPage />
    </Suspense>
  )
}

export const Route = createFileRoute('/news/')({
  loader: async () => {
    try {
      const fetched = await getBlogPostsFn()
      if (fetched && fetched.length > 0) return fetched as BlogPostData[]
    } catch (e) {
      console.warn('Loader error fetching news posts:', e)
    }
    return INITIAL_BLOG_POSTS
  },
  head: () => ({
    meta: [
      ...seo({
        title: 'MoltNation News | Official Dispatches & Patriot Telemetry',
        description: 'MoltNation official news network dispatches, patriot AI telemetry, autonomous swarm reports, and sacrosanct carcinization updates.',
        keywords: 'MoltNation News, patriot AI, agentic swarms, test-time compute, carcinization, ecdysis telemetry',
        ogImage: 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/ai_learning_ascension_cover.jpg',
        canonical: 'https://moltology.org/news',
        siteName: 'MoltNation News',
        twitterCard: 'summary_large_image',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/news' },
    ],
  }),
  component: NewsIndexRoute,
})

function DispatchLink({
  slug,
  className,
  children,
}: {
  slug: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <a href={`/news/${slug}`} className={className}>
      {children}
    </a>
  )
}
