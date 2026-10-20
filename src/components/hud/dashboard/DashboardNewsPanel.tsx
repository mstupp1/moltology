import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Newspaper } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { INITIAL_BLOG_POSTS, formatNewsTitle, type BlogPostData } from '@/lib/blog-data'
import { getBlogPostsFn } from '@/lib/server/api'
import { cn } from '@/lib/utils'
import { DASHBOARD_FOCUS, DashboardEmptyRow, DashboardPanel } from './DashboardPanel'

export const DASHBOARD_NEWS_LIMIT = 4

export function DashboardNewsPanel() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPostData[]>(() => INITIAL_BLOG_POSTS.slice(0, DASHBOARD_NEWS_LIMIT))

  useEffect(() => {
    let isMounted = true
    getBlogPostsFn()
      .then((fetched) => {
        if (isMounted && Array.isArray(fetched) && fetched.length > 0) {
          setPosts((fetched as BlogPostData[]).slice(0, DASHBOARD_NEWS_LIMIT))
        }
      })
      .catch(() => {
        // keep the bundled posts
      })
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <DashboardPanel
      icon={<Newspaper />}
      title="MoltNation News"
      subtitle="Dispatches from the deep."
      action={{ label: 'All news', onClick: () => navigate({ to: '/news' }) }}
      data-testid="dashboard-news"
    >
      {posts.length === 0 ? (
        <DashboardEmptyRow title="No dispatches yet" body="The news desk is listening." />
      ) : (
        <ul className="divide-y divide-line-subtle -my-1">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                to="/news/$slug"
                params={{ slug: post.slug }}
                className={cn('group flex items-center gap-3 py-2.5 rounded-control hover:bg-surface-2 -mx-2 px-2 transition-colors', DASHBOARD_FOCUS)}
              >
                <span
                  className="relative w-[72px] h-12 shrink-0 rounded-control overflow-hidden border border-line-subtle bg-surface-3 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <Newspaper className="w-4 h-4 text-ink-muted" />
                  {post.coverImageUrl ? (
                    <img
                      src={getAssetUrl(post.coverImageUrl)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={72}
                      height={48}
                      onError={(e) => {
                        e.currentTarget.style.visibility = 'hidden'
                      }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 flex flex-col gap-0.5">
                  <span className="block text-[11px] text-ink-muted truncate">
                    <span className="text-cyan-glow font-bold">{post.category}</span>
                    <span aria-hidden="true"> · </span>
                    {post.readTimeMinutes} min read
                  </span>
                  <span className="text-sm font-bold text-ink group-hover:text-cyan-glow transition-colors leading-snug line-clamp-2">
                    {formatNewsTitle(post.title).headline}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  )
}
