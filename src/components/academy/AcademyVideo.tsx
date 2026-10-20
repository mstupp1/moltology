import React from 'react'
import { PlayCircle } from 'lucide-react'
import { ACADEMY_COPY, vimeoEmbedUrl, youtubeEmbedUrl } from '@/lib/academy'
import type { AcademyVideoProvider } from '@/lib/academy-types'
import { coverSrc } from './AcademyChrome'

export function AcademyVideo({
  title,
  url,
  provider,
  posterUrl,
  startAt,
  onPause,
  onEnded,
}: {
  title: string
  url: string | null
  provider: AcademyVideoProvider | null
  posterUrl: string | null
  startAt: number
  onPause: (seconds: number) => void
  onEnded: () => void
}) {
  const poster = coverSrc(posterUrl)
  const youtube = provider === 'youtube' && url ? youtubeEmbedUrl(url) : null
  const vimeo = provider === 'vimeo' && url ? vimeoEmbedUrl(url) : null
  const embed = youtube || vimeo || (provider === 'embed' ? url : null)

  if (embed) {
    return (
      <div className="aspect-video bg-black border border-line-subtle rounded-card overflow-hidden">
        <iframe
          title={title}
          src={embed}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  if (url && (provider === 'file' || provider == null)) {
    return (
      <video
        className="w-full aspect-video bg-black border border-line-subtle rounded-card"
        controls
        poster={poster ?? undefined}
        src={url}
        aria-label={title}
        onLoadedMetadata={(event) => {
          if (startAt > 0 && event.currentTarget.currentTime < 1) {
            event.currentTarget.currentTime = startAt
          }
        }}
        onPause={(event) => onPause(event.currentTarget.currentTime)}
        onEnded={onEnded}
      />
    )
  }

  return (
    <div
      className="relative aspect-video overflow-hidden rounded-card border border-line-subtle bg-gradient-to-br from-surface-3 via-surface-2 to-abyss bg-cover bg-center flex items-center justify-center"
      style={poster ? { backgroundImage: `linear-gradient(to top, rgba(3,7,8,0.92), rgba(3,7,8,0.45)), url(${poster})` } : undefined}
    >
      <div className="max-w-md px-6 text-center space-y-3">
        <span className="mx-auto flex w-12 h-12 items-center justify-center rounded-full border border-line-subtle bg-abyss/60 text-ink-muted">
          <PlayCircle className="w-6 h-6" aria-hidden="true" />
        </span>
        <p className="text-sm text-ink-body leading-relaxed">{ACADEMY_COPY.videoWaiting}</p>
      </div>
    </div>
  )
}
