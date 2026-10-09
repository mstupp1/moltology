import React from 'react'
import { cn } from '@/lib/utils'
import { getAssetUrl } from '@/lib/assets'

export type CompositeAspectRatio = '3:4' | '4:5' | '1:1' | '9:16' | '16:9' | '16:10'

export interface CompositeDimensions {
  width: number
  height: number
  label: string
}

export const COMPOSITE_DIMENSIONS: Record<CompositeAspectRatio, CompositeDimensions> = {
  '3:4': { width: 1080, height: 1440, label: '3:4 Google Flow & Carousel Portrait (1080×1440)' },
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

/** Static star field (same recipe as the homepage night sky), tiled. */
const STAR_FIELD = [
  'radial-gradient(1px 1px at 9% 21%, #c2d9ef 65%, transparent)',
  'radial-gradient(1px 1px at 23% 42%, #abcce4 65%, transparent)',
  'radial-gradient(1.5px 1.5px at 37% 18%, #d6e8fa 50%, transparent)',
  'radial-gradient(1px 1px at 58% 32%, #abcce4 65%, transparent)',
  'radial-gradient(1px 1px at 79% 12%, #c2d9ef 65%, transparent)',
  'radial-gradient(1px 1px at 91% 48%, #abcce4 65%, transparent)',
].join(', ')

/** Where the horizon sits for each ground, as a share of the canvas height. */
const HORIZON: Record<NonNullable<CompositeContainerProps['vignette']>, number> = {
  benthic: 0.74,
  subsea: 0.62,
  dark: 0.86,
  none: 1,
}

export const CompositeContainer: React.FC<CompositeContainerProps> = ({
  aspectRatio = '4:5',
  backgroundImageUrl,
  backgroundOpacity = 0.35,
  vignette = 'benthic',
  showScanlines = false,
  showCornerBrackets = false,
  scale = 1,
  className = '',
  children,
  style,
  ...props
}) => {
  const { width, height } = COMPOSITE_DIMENSIONS[aspectRatio] || COMPOSITE_DIMENSIONS['4:5']
  const horizon = HORIZON[vignette] ?? HORIZON.benthic
  const horizonPct = `${Math.round(horizon * 100)}%`

  return (
    <div
      className={cn('relative box-border select-none overflow-hidden bg-abyss font-sans text-ink', className)}
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
      {/* 1. Night sea ground: sky, a faint horizon line, darker water below (homepage hero recipe). */}
      {vignette !== 'none' && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `linear-gradient(#050914, #081424 ${Math.round(horizon * 60)}%, #071721 ${horizonPct}, #020408 100%)`,
          }}
        >
          <div
            className="absolute inset-x-0 top-0"
            style={{
              bottom: `${100 - horizon * 100}%`,
              background:
                'radial-gradient(ellipse 60% 70% at 22% 8%, rgba(76, 97, 157, 0.16), transparent 75%), radial-gradient(ellipse 70% 50% at 70% 100%, rgba(31, 119, 156, 0.14), transparent 75%)',
            }}
          />
          <div
            className="absolute inset-x-0 top-0 opacity-50"
            style={{
              bottom: `${100 - horizon * 100}%`,
              backgroundImage: STAR_FIELD,
              backgroundSize: '347px 263px',
              maskImage: 'linear-gradient(#000, rgba(0, 0, 0, 0.5) 60%, transparent)',
              WebkitMaskImage: 'linear-gradient(#000, rgba(0, 0, 0, 0.5) 60%, transparent)',
            }}
          />
          {horizon < 1 && (
            <>
              <div
                className="absolute inset-x-0 h-px"
                style={{
                  top: horizonPct,
                  background:
                    'linear-gradient(90deg, transparent, rgba(154, 209, 224, 0.24) 30%, rgba(88, 159, 183, 0.08) 65%, transparent)',
                }}
              />
              <div
                className="absolute inset-x-0 bottom-0"
                style={{
                  top: horizonPct,
                  background:
                    'radial-gradient(ellipse 40% 100% at 30% 0%, rgba(76, 157, 180, 0.12), transparent 80%)',
                }}
              />
            </>
          )}
        </div>
      )}

      {/* 2. Optional background plate (AI render or photo), kept quiet under the copy. */}
      {backgroundImageUrl && (
        <>
          <div
            className="absolute inset-0 z-[1] bg-cover bg-center"
            style={{
              backgroundImage: `url(${getAssetUrl(backgroundImageUrl)})`,
              opacity: backgroundOpacity,
            }}
          />
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-abyss/70 via-abyss/30 to-abyss/80 pointer-events-none" />
        </>
      )}

      {/* 3. Optional fine scanlines (off by default in the current look). */}
      {showScanlines && (
        <div
          className="absolute inset-0 z-[3] pointer-events-none opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0, 195, 255, 0.05) 0px, rgba(0, 195, 255, 0.05) 1px, transparent 1px, transparent 5px)',
          }}
        />
      )}

      {/* 4. Corner ticks around the safe area, as on the site's featured panels. */}
      {showCornerBrackets && <div className="hud-ticks absolute inset-6 z-[4] pointer-events-none rounded-card" />}

      {/* 5. Main foreground content canvas */}
      <div className="relative z-10 box-border flex h-full w-full flex-col p-14">{children}</div>
    </div>
  )
}
