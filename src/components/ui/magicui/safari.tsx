import React from 'react'
import { Lock } from 'lucide-react'

export interface SafariSource {
  type?: string
  media?: string
  srcSet: string
}

export interface SafariProps {
  url?: string
  className?: string
  children?: React.ReactNode
  src?: string
  sources?: SafariSource[]
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  width?: number | string
  height?: number | string
  sizes?: string
}

export const Safari: React.FC<SafariProps> = ({
  url = 'moltology.org/dashboard',
  className = '',
  children,
  src,
  sources,
  loading = 'lazy',
  fetchPriority = 'low',
  width,
  height,
  sizes,
}) => {
  // Clean URL to realistic standard presentation
  const displayUrl = url
    .replace(/^(?:https?:\/\/|benthic:\/?\/?)/i, '')
    .trim()

  return (
    <div
      className={`relative w-full rounded-xl sm:rounded-2xl border border-[#223035] bg-[#0d1214] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(0,195,255,0.12)] overflow-hidden ${className}`}
    >
      {/* Clean macOS Safari Window Bar Header */}
      <div className="h-9 sm:h-11 bg-[#080d0f] border-b border-[#1b262a] flex items-center justify-between px-2.5 sm:px-4 select-none relative z-20">
        {/* Window Traffic Lights */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-10 sm:w-14 shrink-0">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] shadow-[0_0_6px_rgba(255,95,86,0.6)]" />
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] shadow-[0_0_6px_rgba(255,189,46,0.6)]" />
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27c93f] border border-[#1aab29] shadow-[0_0_6px_rgba(39,201,63,0.6)]" />
        </div>

        {/* Realistic Centered URL Bar */}
        <div className="flex-1 min-w-0 max-w-[9.5rem] sm:max-w-md mx-auto flex items-center justify-center gap-1.5 sm:gap-2 bg-[#040809] border border-[#223035] px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-sans text-[10px] sm:text-xs text-[#839493] shadow-inner">
          <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400/90 shrink-0" />
          <span className="text-gray-300 font-medium tracking-wide truncate">
            {displayUrl}
          </span>
        </div>

        {/* Symmetric Spacer for Perfect Centering */}
        <div className="w-10 sm:w-14 shrink-0" aria-hidden="true" />
      </div>

      {/* Safari Viewport Container */}
      <div className="relative w-full overflow-hidden bg-[#030708]">
        {children ? (
          children
        ) : src ? (
          <picture>
            {(sources ?? []).map((source) => (
              <source
                key={`${source.media ?? ''}:${source.srcSet}`}
                type={source.type}
                media={source.media}
                srcSet={source.srcSet}
              />
            ))}
            <img
              src={src}
              alt="Safari preview"
              className="w-full h-auto object-cover"
              loading={loading}
              fetchPriority={fetchPriority}
              decoding="async"
              width={width}
              height={height}
              sizes={sizes}
            />
          </picture>
        ) : null}
      </div>
    </div>
  )
}
