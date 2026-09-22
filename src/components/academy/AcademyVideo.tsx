import React from 'react'
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
      <div className="aspect-video bg-black border border-[#3a4a49] chamfer-corner overflow-hidden">
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
        className="w-full aspect-video bg-black border border-[#3a4a49] chamfer-corner"
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
      className="aspect-video border border-[#3a4a49] chamfer-corner bg-[#070b0c] bg-cover bg-center flex items-end"
      style={poster ? { backgroundImage: `linear-gradient(to top, rgba(3,7,8,0.92), rgba(3,7,8,0.25)), url(${poster})` } : undefined}
    >
      <p className="p-4 text-sm text-[#dfe3e3] max-w-xl leading-relaxed">{ACADEMY_COPY.videoWaiting}</p>
    </div>
  )
}
