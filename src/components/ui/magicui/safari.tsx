import React from 'react'
import { Lock } from 'lucide-react'

export interface SafariProps {
  url?: string
  className?: string
  children?: React.ReactNode
  src?: string
  width?: number | string
  height?: number | string
}

export const Safari: React.FC<SafariProps> = ({
  url = 'moltology.org/dashboard',
  className = '',
  children,
  src,
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
      <div className="h-10 sm:h-11 bg-[#080d0f] border-b border-[#1b262a] flex items-center justify-between px-3 sm:px-4 select-none relative z-20">
        {/* Window Traffic Lights */}
        <div className="flex items-center gap-2 w-14 shrink-0">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] shadow-[0_0_6px_rgba(255,95,86,0.6)]" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] shadow-[0_0_6px_rgba(255,189,46,0.6)]" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] shadow-[0_0_6px_rgba(39,201,63,0.6)]" />
        </div>

        {/* Realistic Centered URL Bar */}
        <div className="flex-1 max-w-sm sm:max-w-md mx-auto flex items-center justify-center gap-2 bg-[#040809] border border-[#223035] px-3.5 py-1 rounded-lg font-sans text-xs text-[#839493] shadow-inner">
          <Lock className="w-3 h-3 text-cyan-400/90 shrink-0" />
          <span className="text-gray-300 font-medium tracking-wide">
            {displayUrl}
          </span>
        </div>

        {/* Symmetric Spacer for Perfect Centering */}
        <div className="w-14 shrink-0" aria-hidden="true" />
      </div>

      {/* Safari Viewport Container */}
      <div className="relative w-full overflow-hidden bg-[#030708]">
        {children ? (
          children
        ) : src ? (
          <img src={src} alt="Safari preview" className="w-full h-auto object-cover" />
        ) : null}
      </div>
    </div>
  )
}
