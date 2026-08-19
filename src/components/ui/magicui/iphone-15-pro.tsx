import React from 'react'
import { Wifi, Battery } from 'lucide-react'

export interface Iphone15ProProps {
  className?: string
  children?: React.ReactNode
  src?: string
  width?: number | string
  height?: number | string
}

export const Iphone15Pro: React.FC<Iphone15ProProps> = ({
  className = '',
  children,
  src,
  width = 393,
}) => {
  return (
    <div
      className={`relative inline-block select-none ${className}`}
      style={{
        aspectRatio: '393 / 852',
        width: typeof width === 'number' ? `${width}px` : width,
        maxWidth: '100%',
      }}
    >
      {/* Outer Titanium Chassis Frame */}
      <div className="relative w-full h-full rounded-[48px] p-[10px] bg-gradient-to-b from-[#323d42] via-[#1a2327] to-[#12181a] border-[2px] border-[#3e4c52] shadow-[0_25px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,195,255,0.2)] flex flex-col overflow-hidden">
        
        {/* Inner Bezel Frame */}
        <div className="relative w-full h-full rounded-[38px] bg-black overflow-hidden flex flex-col border border-[#1b262a]">
          
          {/* Screen Content Viewport (Full 1:1 Aspect Ratio) */}
          <div className="relative w-full h-full overflow-hidden bg-[#030708]">
            {children ? (
              children
            ) : src ? (
              <img
                src={src}
                alt="iPhone 15 Pro preview"
                className="w-full h-full object-cover object-top"
              />
            ) : null}

            {/* Floating Dynamic Island + iOS Status Bar Overlay */}
            <div className="absolute top-0 left-0 right-0 z-40 h-10 px-5 pt-1.5 flex items-center justify-between pointer-events-none select-none bg-gradient-to-b from-black/80 via-black/40 to-transparent">
              {/* Time */}
              <span className="text-[11px] font-bold text-gray-200 tracking-tight">09:41</span>

              {/* Dynamic Island SVG Pill */}
              <div className="w-[96px] h-[23px] bg-black rounded-full border border-[#222a2e] flex items-center justify-between px-2.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-[#0a1215] border border-[#1b252a] flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-cyan-400/80 animate-pulse" />
                </span>
                <span className="w-2 h-2 rounded-full bg-[#0d1417] border border-[#1b252a]" />
              </div>

              {/* Signal & Battery Icons */}
              <div className="flex items-center gap-1 text-gray-200">
                <span className="text-[8px] font-bold tracking-tighter text-cyan-400">5G</span>
                <Wifi className="w-3 h-3 text-gray-200" />
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            {/* Floating iOS Home Indicator Bar */}
            <div className="absolute bottom-1.5 left-0 right-0 h-4 flex items-center justify-center pointer-events-none z-40">
              <div className="w-28 h-1 bg-gray-400/60 rounded-full" />
            </div>
          </div>
        </div>

        {/* Hardware Button Accents on Outer Chassis */}
        <div className="absolute -left-[3px] top-28 w-[3px] h-10 bg-[#323d42] rounded-l-sm" />
        <div className="absolute -left-[3px] top-42 w-[3px] h-12 bg-[#323d42] rounded-l-sm" />
        <div className="absolute -left-[3px] top-58 w-[3px] h-12 bg-[#323d42] rounded-l-sm" />
        <div className="absolute -right-[3px] top-36 w-[3px] h-16 bg-[#323d42] rounded-r-sm" />
      </div>
    </div>
  )
}
