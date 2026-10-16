import React from 'react'
import { Shield } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'

interface NewsArticleFigureProps {
  src: string
  alt: string
  caption?: React.ReactNode
  priority?: boolean
  className?: string
}

export function NewsArticleFigure({ src, alt, caption = alt, priority = false, className = '' }: NewsArticleFigureProps) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)
  const resolvedSrc = getAssetUrl(src)

  return (
    <figure className={`my-6 sm:my-8 border border-line-subtle bg-surface-1 rounded-card overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] ${className}`}>
      <div className="relative bg-surface-1">
        {failedSrc === resolvedSrc ? (
          <div className="p-6 text-center text-xs text-ink-muted font-sans flex flex-col items-center gap-2">
            <Shield className="w-6 h-6 text-ink-muted" />
            <span>Image unavailable.</span>
          </div>
        ) : (
          <img
            src={resolvedSrc}
            alt={alt}
            onError={() => setFailedSrc(resolvedSrc)}
            className="block w-full h-auto !m-0"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
          />
        )}
      </div>
      {caption && (
        <figcaption className="!m-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-surface-2 border-t border-line-subtle text-xs font-sans text-ink-muted leading-relaxed break-words">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
