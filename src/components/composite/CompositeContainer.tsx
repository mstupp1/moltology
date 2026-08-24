import React from 'react'
import { cn } from '@/lib/utils'
import { getAssetUrl } from '@/lib/assets'

export type CompositeAspectRatio = '4:5' | '1:1' | '9:16' | '16:9' | '16:10'

export interface CompositeDimensions {
  width: number
  height: number
  label: string
}

export const COMPOSITE_DIMENSIONS: Record<CompositeAspectRatio, CompositeDimensions> = {
  '4:5': { width: 1080, height: 1350, label: '4:5 Instagram Portrait (1080×1350)' },
  '1:1': { width: 1080, height: 1080, label: '1:1 Square Feed (1080×1080)' },
  '9:16': { width: 1080, height: 1920, label: '9:16 Reels & Shorts Vertical (1080×1920)' },
  '16:9': { width: 1600, height: 900, label: '16:9 Blog Hero & Schematic (1600×900)' },
  '16:10': { width: 1760, height: 1100, label: '16:10 Dashboard Desktop HUD (1760×1100)' },
}

export interface CompositeContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  aspectRatio?: CompositeAspectRatio
  backgroundImageUrl?: string
  backgroundOpacity?: number
  vignette?: 'benthic' | 'subsea' | 'dark' | 'none'
  showScanlines?: boolean
  showCornerBrackets?: boolean
  scale?: number
  className?: string
  children: React.ReactNode
}

export const CompositeContainer: React.FC<CompositeContainerProps> = ({
  aspectRatio = '4:5',
  backgroundImageUrl,
  backgroundOpacity = 0.35,
  vignette = 'benthic',
  showScanlines = true,
  showCornerBrackets = false,
  scale = 1,
  className = '',
  children,
  style,
  ...props
}) => {
  const { width, height } = COMPOSITE_DIMENSIONS[aspectRatio] || COMPOSITE_DIMENSIONS['4:5']

  const vignetteClasses = {
    benthic: 'bg-gradient-to-b from-[#020b10]/95 via-[#02080c]/80 to-[#010406]/98',
    subsea: 'bg-gradient-to-b from-[#041520]/90 via-[#020d14]/75 to-[#01060a]/95',
    dark: 'bg-gradient-to-b from-[#0a0f12]/92 via-[#060a0c]/85 to-[#020405]/98',
    none: 'bg-[#03080c]',
  }[vignette]

  return (
    <div
      className={cn(
        'relative overflow-hidden select-none font-sans text-[#dfe3e3] bg-[#02080c] box-border',
        className
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`,
        maxWidth: `${width}px`,
        maxHeight: `${height}px`,
        transformOrigin: 'top left',
        ...(scale !== 1 ? { transform: `scale(${scale})` } : {}),
        ...style,
      }}
      {...props}
    >
      {/* 1. Optional Background Image Layer (Antigravity 3D Render or AI Plate) */}
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${getAssetUrl(backgroundImageUrl)})`,
            opacity: backgroundOpacity,
          }}
        />
      )}

      {/* 2. Cinematic Oceanic Gradient & Contrast Vignette */}
      <div className={cn('absolute inset-0 z-[1] pointer-events-none', vignetteClasses)} />

      {/* 3. Radial Top Cyan Spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(0,195,255,0.18),transparent_70%)] z-[2] pointer-events-none" />

      {/* 4. Subtle Scanline Pattern */}
      {showScanlines && (
        <div
          className="absolute inset-0 z-[3] pointer-events-none opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.04) 0px, rgba(0, 255, 255, 0.04) 2px, transparent 2px, transparent 6px)',
          }}
        />
      )}

      {/* 5. Cybernetic Corner HUD Brackets */}
      {showCornerBrackets && (
        <div className="absolute inset-6 z-[4] pointer-events-none border border-cyan-500/20">
          <span className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
          <span className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
          <span className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
          <span className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
        </div>
      )}

      {/* 6. Main Foreground Content Canvas */}
      <div className="relative z-10 w-full h-full flex flex-col p-12 box-border">
        {children}
      </div>
    </div>
  )
}
