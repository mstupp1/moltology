import React, { useMemo } from 'react'
import { LOBSTER_AVATAR_STYLE, type LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { CharacterStill } from './avatar3d/CharacterStill'
import { LobsterAvatarSilhouette } from './LobsterAvatarSilhouette'

export interface LobsterAvatarPortraitProps {
  config?: LobsterAvatarConfig | null
  /** Requested source px; drawn at 128 or 256. */
  size?: number
  alt?: string
  /** Outer frame diameter, e.g. w-48 h-48 */
  className?: string
  /** Subtle hover scale on the face */
  interactive?: boolean
  /** A seed to draw a stand-in character from when there is no saved one. */
  fallbackSeed?: string
  /** Enable foreground optical lens vignette (default true) */
  vignette?: boolean
  specularSheen?: boolean
  /** Lens glow around the rim (default true) */
  fisheyeLens?: boolean
}

/**
 * Circular, face-focused portrait: the canonical porthole avatar for settings, chassis, lists and
 * HUD surfaces. The face is a still of the 3D character, drawn when it scrolls into view.
 */
export const LobsterAvatarPortrait: React.FC<LobsterAvatarPortraitProps> = React.memo(({
  config,
  size = 256,
  alt = 'Carapace avatar',
  className = 'w-48 h-48 sm:w-56 sm:h-56',
  interactive = false,
  fallbackSeed,
  vignette = true,
  specularSheen = true,
  fisheyeLens = true,
}) => {
  const effectiveConfig = useMemo((): LobsterAvatarConfig | null => {
    if (config?.seed) return config
    if (fallbackSeed?.trim()) return { ...config, style: config?.style || LOBSTER_AVATAR_STYLE, seed: fallbackSeed.trim() }
    return null
  }, [config, fallbackSeed])
  const sourcePx = size > 128 ? 256 : 128

  const portraitClassName = useMemo(
    () =>
      `relative aspect-square rounded-full border border-white/[0.18] bg-[#081419]/90 bg-gradient-to-b from-white/[0.14] via-white/[0.04] to-transparent overflow-hidden shrink-0 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.8),0_2px_8px_rgba(0,0,0,0.6),inset_0_1.5px_0_0_rgba(255,255,255,0.45),inset_0_-1.5px_0_0_rgba(0,195,255,0.25),0_0_28px_rgba(0,195,255,0.2)] ${
        interactive
          ? 'group transition-all duration-300 hover:border-white/[0.3] hover:shadow-[0_12px_40px_-2px_rgba(0,0,0,0.85),0_2px_10px_rgba(0,0,0,0.6),inset_0_2px_0_0_rgba(255,255,255,0.65),inset_0_-2px_0_0_rgba(0,195,255,0.4),0_0_35px_rgba(0,195,255,0.32)]'
          : ''
      } ${className}`,
    [interactive, className]
  )

  return (
    <div
      className={portraitClassName}
      data-testid="lobster-avatar-portrait"
      data-slot="portrait"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,195,255,0.2)_0%,rgba(0,195,255,0.05)_55%,transparent_75%)] pointer-events-none z-0" />

      <div data-testid="portrait-fisheye-container" className="relative z-10 h-full w-full">
        <CharacterStill
          config={effectiveConfig}
          px={sourcePx}
          alt={alt}
          scene
          imgClassName={interactive ? 'duration-300 group-hover:scale-[1.03] transition-[opacity,transform]' : undefined}
          placeholder={
            <span className="flex h-full w-full items-center justify-center">
              <LobsterAvatarSilhouette alt={alt || 'Uncalibrated carapace silhouette'} />
            </span>
          }
        />
      </div>

      {fisheyeLens && (
        <>
          <div
            data-testid="portrait-fisheye-dome"
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.06)_0%,rgba(0,195,255,0.04)_42%,transparent_68%)] pointer-events-none z-15 mix-blend-screen"
          />
          <div
            data-testid="portrait-fisheye-chromatic"
            className="absolute inset-0 rounded-full border-[1.5px] border-cyan-400/20 shadow-[inset_0_0_18px_rgba(0,195,255,0.22),0_0_14px_rgba(255,0,128,0.14)] pointer-events-none z-15 mix-blend-screen"
          />
        </>
      )}

      {vignette && (
        <div
          data-testid="portrait-lens-vignette"
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_38%,transparent_45%,rgba(2,8,14,0.5)_72%,rgba(1,4,7,0.92)_100%)] pointer-events-none z-20"
        />
      )}

      {specularSheen && (
        <>
          <div
            data-testid="portrait-lens-sheen"
            className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.32)_0%,rgba(0,195,255,0.15)_35%,transparent_70%)] pointer-events-none z-20"
          />
          <div className="absolute top-0 inset-x-8 sm:inset-x-12 h-[1.5px] rounded-t-full bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none z-30" />
        </>
      )}

      <div className="absolute bottom-0 inset-x-10 sm:inset-x-14 h-[1.5px] rounded-b-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none z-30" />
      <div className="absolute bottom-0 inset-x-0 h-1/4 rounded-b-full bg-[radial-gradient(ellipse_at_50%_100%,rgba(0,195,255,0.18)_0%,transparent_70%)] pointer-events-none z-20" />

      <div
        data-testid="portrait-lens-bezel"
        className="absolute inset-[1px] rounded-full border border-white/[0.08] pointer-events-none z-20"
      />
    </div>
  )
})

LobsterAvatarPortrait.displayName = 'LobsterAvatarPortrait'
