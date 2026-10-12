import React from 'react'
import { BrandAwareImage } from '@/components/ui/BrandMark'
import { formatNewsTitle } from '@/lib/blog-data'
import type { BlogPostData } from '@/lib/blog-data'
import { getAssetUrl } from '@/lib/assets'
import { lazyImageProps } from '@/lib/media-priority'

/** "SWARM ARCHITECTURE" -> "Swarm Architecture"; keeps "&" and short words readable. */
export function formatSectionName(category: string): string {
  return category
    .toLowerCase()
    .split(' ')
    .map((word) => (word === '&' ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
}

/** Deterministic (UTC, en-US) so server and client render the same string. */
export function formatPostDate(value: string | Date | undefined, style: 'long' | 'short' = 'long'): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function StoryLink({
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

export function Kicker({ category }: { category: string }) {
  return (
    <span className="text-[11px] font-sans font-bold uppercase tracking-[0.08em] text-cyan-glow">
      {formatSectionName(category)}
    </span>
  )
}

export function Byline({ post, withAvatar = false }: { post: BlogPostData; withAvatar?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-sans text-ink-muted">
      {withAvatar && post.authorAvatar && (
        <BrandAwareImage
          src={post.authorAvatar}
          alt=""
          {...lazyImageProps}
          className="w-6 h-6 rounded-full border border-line object-cover"
        />
      )}
      <span className="text-ink font-semibold">{post.authorName}</span>
      <span aria-hidden="true" className="text-ink-muted/60">·</span>
      <time dateTime={String(post.publishedAt)}>{formatPostDate(post.publishedAt)}</time>
      <span aria-hidden="true" className="text-ink-muted/60">·</span>
      <span>{post.readTimeMinutes} min read</span>
    </div>
  )
}

export function StoryCard({ post }: { post: BlogPostData }) {
  const { headline, subtitle } = formatNewsTitle(post.title)
  return (
    <StoryLink slug={post.slug} className="group flex flex-col gap-3 text-inherit no-underline rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow">
      <div className="aspect-[16/10] overflow-hidden rounded-card bg-surface-1">
        <img
          src={getAssetUrl(post.coverImageUrl)}
          alt={post.title}
          {...lazyImageProps}
          className="w-full h-full object-cover brightness-90 group-hover:brightness-100 group-hover:scale-[1.03] transition duration-500"
        />
      </div>
      <Kicker category={post.category} />
      <h3 className="font-garamond text-2xl leading-tight text-ink group-hover:text-cyan-glow transition-colors">
        {headline}
        {subtitle && <span className="block italic text-ink-muted text-lg mt-1">{subtitle}</span>}
      </h3>
      <p className="text-sm text-ink-muted font-sans leading-relaxed line-clamp-3">{post.summary}</p>
      <Byline post={post} />
    </StoryLink>
  )
}

