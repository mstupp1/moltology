import React from 'react'
import { getAssetUrl } from '@/lib/assets'
import { lcpImageProps } from '@/lib/media-priority'

export interface HeroBackgroundProps {
  className?: string
  showWatermarks?: boolean
  leftWatermark?: string
  rightWatermark?: string
}

/**
 * Shared Hero Background Component
 * Provides a unified 3D-layered benthic background for public hero banners (Landing page, Moltmax, etc.)
 * Includes darkened widescreen hero artwork, ambient cyan/red lighting, chitin texture overlay,
 * soft grid, reduced edge vignette, and optional technical HUD watermarks.
 */
export const HeroBackground: React.FC<HeroBackgroundProps> = ({
  className = '',
  showWatermarks = true,
  leftWatermark = 'SYS.CORE // TRANSMUTATION_PIPELINE',
  rightWatermark = 'MARIANA_DEPTH_DATUM // 10984M',
}) => {
  return (
    <div className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0 ${className}`} aria-hidden="true">
      {/* Layer 1: Background Widescreen Hero Artwork (Darkened & Blurred) */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center opacity-25 sm:opacity-30 mix-blend-luminosity scale-105 pointer-events-none blur-[12px] z-0"
        style={{ backgroundImage: `url(${getAssetUrl('/images/hero_widescreen_bg.webp')})` }}
      />

      {/* Layer 2A: Deep Benthic Base Layer */}
      <div className="absolute inset-0 bg-[#020608]/50 z-0 pointer-events-none backdrop-blur-[2px]" />

      {/* Layer 2B: Balanced Dual Cyan & Red Ambient Background Color Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(0,195,255,0.20)_0%,transparent_65%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_65%,rgba(255,69,58,0.15)_0%,transparent_65%)] pointer-events-none z-0" />

      {/* Layer 2C: Chitin Exoshell Texture Pattern Layer (GPU Composited, Responsive WebP) */}
      <picture className="absolute inset-0 w-full h-full pointer-events-none transform-gpu">
        <source
          type="image/webp"
          media="(max-width: 767px)"
          srcSet={getAssetUrl('/images/chitin_texture_bg_sm.webp')}
        />
        <source
          type="image/webp"
          media="(min-width: 768px)"
          srcSet={getAssetUrl('/images/chitin_texture_bg.webp')}
        />
        <img
          src={getAssetUrl('/images/chitin_texture_bg.webp')}
          alt="Chitin Exoshell Background Texture"
          {...lcpImageProps}
          width={1376}
          height={768}
          className="w-full h-full object-cover opacity-40 sm:opacity-45 mix-blend-overlay scale-105 pointer-events-none z-0"
        />
      </picture>

      {/* Layer 2D: Sacred Grid & Balanced Mid-Tone Vignettes */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(2,6,8,0.85)_95%)] opacity-72 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#020608] via-transparent to-[#020608] z-0 pointer-events-none opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#020608] via-transparent to-[#020608] z-0 pointer-events-none opacity-50" />
      <div className="absolute inset-0 bg-sacred-grid opacity-25 z-0 pointer-events-none" />

      {/* Layer 2E: Top Header Offset Vignette Gradient */}
      <div className="absolute top-0 left-0 right-0 h-36 sm:h-60 bg-gradient-to-b from-[#020608]/95 via-[#020608]/75 via-45% to-transparent z-[1] pointer-events-none" />

      {/* Layer 3: Technical HUD Watermark Accent */}
      {showWatermarks && (
        <div
          className="absolute inset-0 pointer-events-none select-none z-0 opacity-10 flex items-center justify-between px-8 hidden lg:flex"
          aria-hidden="true"
        >
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-cyan-400 rotate-90 origin-left">
            {leftWatermark}
          </div>
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-cyan-400 -rotate-90 origin-right">
            {rightWatermark}
          </div>
        </div>
      )}
    </div>
  )
}
