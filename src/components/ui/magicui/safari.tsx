import React from 'react'
import { Shield, ChevronLeft, ChevronRight, Share, Plus, Copy } from 'lucide-react'

export interface SafariProps {
  url?: string
  className?: string
  children?: React.ReactNode
  src?: string
  width?: number | string
  height?: number | string
}

export const Safari: React.FC<SafariProps> = ({
  url = 'benthic:hub.moltology.org/dashboard',
  className = '',
  children,
  src,
}) => {
  return (
    <div
      className={`relative w-full rounded-xl sm:rounded-2xl border border-[#223035] bg-[#0d1214] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(0,195,255,0.12)] overflow-hidden ${className}`}
    >
      {/* macOS Safari Window Bar Header */}
      <div className="h-10 sm:h-11 bg-[#080d0f] border-b border-[#1b262a] flex items-center justify-between px-3 sm:px-4 select-none relative z-20">
        {/* Window Traffic Lights */}
        <div className="flex items-center gap-2 w-16 shrink-0">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] shadow-[0_0_6px_rgba(255,95,86,0.6)]" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] shadow-[0_0_6px_rgba(255,189,46,0.6)]" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] shadow-[0_0_6px_rgba(39,201,63,0.6)]" />
        </div>

        {/* Navigation Arrows */}
        <div className="hidden sm:flex items-center gap-1 text-[#839493] mr-2">
          <button className="p-1 hover:text-white transition-colors" title="Back" aria-label="Back">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1 hover:text-white transition-colors opacity-40 cursor-not-allowed" title="Forward" aria-label="Forward">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* macOS Safari Smart Search / URL Bar */}
        <div className="flex-1 max-w-lg mx-auto flex items-center justify-center gap-2 bg-[#030607]/90 border border-[#223035] px-3.5 py-1 rounded-lg font-sans text-xs text-[#839493] shadow-inner">
          <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-gray-400 select-none">benthic:</span>
          <span className="text-cyan-300 font-bold tracking-wide">
            {url.replace(/^(?:https?:\/\/|benthic:\/?\/?)/i, '')}
          </span>
          <span className="hidden md:inline-block text-[9px] text-emerald-400 ml-1.5 px-1.5 py-0.2 bg-emerald-950/70 border border-emerald-500/30 rounded font-bold">
            GUEST READY
          </span>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center justify-end gap-2 w-16 text-[#839493] shrink-0">
          <Share className="w-3.5 h-3.5 hover:text-cyan-300 cursor-pointer transition-colors hidden sm:block" />
          <Plus className="w-3.5 h-3.5 hover:text-cyan-300 cursor-pointer transition-colors hidden sm:block" />
          <Copy className="w-3.5 h-3.5 hover:text-cyan-300 cursor-pointer transition-colors hidden sm:block" />
        </div>
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
