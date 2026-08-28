import React, { useEffect, useMemo, useState } from 'react'
import {
  LOBSTER_AVATAR_STYLE,
  generateLobsterAvatarDataUri,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
import { LobsterAvatarDisplay } from './LobsterAvatarDisplay'

/** Upper-body crop for critters full-body sprites in a circular frame */
const PORTRAIT_FACE_CLASSES = 'scale-[1.3] origin-[center_38%] object-[center_42%]'

export interface LobsterAvatarPortraitProps {
  /** Pre-generated DiceBear data URI (e.g. from profile) */
  src?: string | null
  /** Generate client-side after mount from config (SSR-safe) */
  config?: LobsterAvatarConfig | null
  /** Render resolution for generation / pixelation */
  size?: number
  alt?: string
  /** Outer frame diameter, e.g. w-48 h-48 */
  className?: string
  /** Subtle hover scale on the sprite */
  interactive?: boolean
  animationSeed?: string
  /** Subtle cursor-following eye shift with eased resistance (default on) */
  eyeTracking?: boolean
  /** Enable foreground optical lens vignette (default true) */
  vignette?: boolean
  /** Enable convex optical glass specular glint (default true) */
  specularSheen?: boolean
}

/**
 * Circular, face-focused lobster avatar — canonical portrait for settings, chassis, and HUD surfaces.
 * Features an authentic benthic porthole frame with inner shadow depth, optical lens vignette,
 * and convex glass specular arc.
 */
export const LobsterAvatarPortrait: React.FC<LobsterAvatarPortraitProps> = React.memo(({
  src,
  config,
  size = 320,
  alt = 'Carapace avatar',
  className = 'w-48 h-48 sm:w-56 sm:h-56',
  interactive = false,
  animationSeed,
  eyeTracking = true,
  vignette = true,
  specularSheen = true,
}) => {
  const resolvedSeed = animationSeed ?? config?.seed
  const configSeed = config?.seed
  const configTheme = config?.backgroundTheme
  const configPattern = config?.backgroundPattern
  const configTexture = config?.backgroundTexture
  const configDensity = config?.patternDensity
  const configGlow = config?.patternGlow
  const configPulse = config?.patternPulse
  const configSparkles = config?.patternSparkles
  const configTransparent = config?.transparentBackground

  const dataUri = useMemo(() => {
    if (src) return src
    if (!configSeed) return null
    return generateLobsterAvatarDataUri(
      {
        style: LOBSTER_AVATAR_STYLE,
        seed: configSeed,
        ...(configTheme ? { backgroundTheme: configTheme } : {}),
        ...(configPattern ? { backgroundPattern: configPattern } : {}),
        ...(configTexture ? { backgroundTexture: configTexture } : {}),
        ...(configDensity ? { patternDensity: configDensity } : {}),
        ...(configGlow ? { patternGlow: configGlow } : {}),
        ...(configPulse ? { patternPulse: configPulse } : {}),
        ...(configSparkles ? { patternSparkles: configSparkles } : {}),
        ...(configTransparent ? { transparentBackground: configTransparent } : {}),
      },
      size
    )
  }, [src, configSeed, configTheme, configPattern, configTexture, configDensity, configGlow, configPulse, configSparkles, configTransparent, size])

  const portraitClassName = useMemo(
    () =>
      `relative aspect-square rounded-full border border-white/[0.18] bg-[#081419]/75 bg-gradient-to-b from-white/[0.14] via-white/[0.04] to-transparent overflow-hidden shrink-0 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.8),0_2px_8px_rgba(0,0,0,0.6),inset_0_1.5px_0_0_rgba(255,255,255,0.45),inset_0_-1.5px_0_0_rgba(0,195,255,0.25),0_0_28px_rgba(0,195,255,0.2)] ${
        interactive
          ? 'group transition-all duration-300 hover:border-white/[0.3] hover:shadow-[0_12px_40px_-2px_rgba(0,0,0,0.85),0_2px_10px_rgba(0,0,0,0.6),inset_0_2px_0_0_rgba(255,255,255,0.65),inset_0_-2px_0_0_rgba(0,195,255,0.4),0_0_35px_rgba(0,195,255,0.32)]'
          : ''
      } ${className}`,
    [interactive, className]
  )

  return (
    <div className={portraitClassName}>
      {/* 1. Internal Radial Light Gathering (Benthic Core Flare) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,195,255,0.2)_0%,rgba(0,195,255,0.05)_55%,transparent_75%)] pointer-events-none z-0" />

      {/* 2. Character Display (Sprite + Idle Animation + Eye Tracking) */}
      {dataUri ? (
        <LobsterAvatarDisplay
          src={dataUri}
          alt={alt}
          pixelResolution={64}
          outputSize={size}
          maskRadial={false}
          animationSeed={resolvedSeed}
          eyeTracking={eyeTracking}
          texture={configTexture}
          containerClassName={`relative z-10 w-full h-full flex items-start justify-center overflow-hidden ${
            interactive ? 'transition-transform duration-300 group-hover:scale-[1.03]' : ''
          }`}
          className="w-full h-full overflow-hidden"
          imgClassName={`w-full h-full object-cover brightness-[0.96] contrast-[1.12] saturate-[1.15] ${PORTRAIT_FACE_CLASSES}`}
        />
      ) : (
        <div
          className="relative z-10 flex h-full w-full items-center justify-center"
          aria-hidden={!alt}
        >
          <span className="px-3 text-center text-[10px] uppercase tracking-wider text-[#4a5a59]">
            No avatar
          </span>
        </div>
      )}

      {/* 3. Spherical Lens Vignette (Darkens sprite perimeter inside glass bubble) */}
      {vignette && (
        <div
          data-testid="portrait-lens-vignette"
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_38%,transparent_48%,rgba(2,8,14,0.45)_75%,rgba(1,4,7,0.85)_100%)] pointer-events-none z-20"
        />
      )}

      {/* 4. Convex Optical Glass Specular Arc & Crest Highlight */}
      {specularSheen && (
        <>
          {/* Top Crescent Specular Reflection */}
          <div
            data-testid="portrait-lens-sheen"
            className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.28)_0%,rgba(0,195,255,0.12)_35%,transparent_70%)] pointer-events-none z-20"
          />
          {/* Crisp Hairline Specular Reflection (Top Crest) */}
          <div className="absolute top-0 inset-x-8 sm:inset-x-12 h-[1.5px] rounded-t-full bg-gradient-to-r from-transparent via-white/85 to-transparent pointer-events-none z-30" />
        </>
      )}

      {/* 5. Micro-Fine Optical Refraction Lip (Bottom Caustic Catch) */}
      <div className="absolute bottom-0 inset-x-10 sm:inset-x-14 h-[1.5px] rounded-b-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none z-30" />
      <div className="absolute bottom-0 inset-x-0 h-1/4 rounded-b-full bg-[radial-gradient(ellipse_at_50%_100%,rgba(0,195,255,0.18)_0%,transparent_70%)] pointer-events-none z-20" />

      {/* 6. Concentric Optical Glass Bezel Inset */}
      <div
        data-testid="portrait-lens-bezel"
        className="absolute inset-[1px] rounded-full border border-white/[0.08] pointer-events-none z-20"
      />
    </div>
  )
})

LobsterAvatarPortrait.displayName = 'LobsterAvatarPortrait'
