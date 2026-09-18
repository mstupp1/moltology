import React, { useMemo } from 'react'
import {
  LOBSTER_AVATAR_STYLE,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
import {
  normalizePortraitSourcePx,
  pickLobsterAvatarSlot,
  resolveLobsterAvatarAssets,
} from '@/lib/lobster-avatar-slots'

export interface LobsterAvatarPortraitProps {
  /** Pre-generated still (portrait slot or SSO image). Never an animated full-body crop. */
  src?: string | null
  /** Generate a static close-up after mount from config (SSR-safe) */
  config?: LobsterAvatarConfig | null
  /** Requested source px; clamped to the two shipped sizes (128 / 256). */
  size?: number
  alt?: string
  className?: string
  interactive?: boolean
  /** Enable foreground optical lens vignette (default true) */
  vignette?: boolean
  specularSheen?: boolean
  /** Enable spherical fisheye lens curvature & chromatic refraction (default true) */
  fisheyeLens?: boolean
  /** Lazy-load below the fold. Eager is OK for the signed-in user's own HUD face. */
  loading?: 'lazy' | 'eager'
}

/**
 * Circular, face-focused lobster portrait — static image for lists, chrome, and settings.
 * Does not mount the animated full-body display.
 */
export const LobsterAvatarPortrait: React.FC<LobsterAvatarPortraitProps> = React.memo(({
  src,
  config,
  size = 256,
  alt = 'Carapace avatar',
  className = 'w-48 h-48 sm:w-56 sm:h-56',
  interactive = false,
  vignette = true,
  specularSheen = true,
  fisheyeLens = true,
  loading = 'lazy',
}) => {
  const configSeed = config?.seed
  const sourcePx = normalizePortraitSourcePx(size)

  const portraitUrl = useMemo(() => {
    if (src) return src
    if (!configSeed) return null
    const assets = resolveLobsterAvatarAssets(
      { style: config?.style ?? LOBSTER_AVATAR_STYLE, ...config, seed: configSeed },
      { portraitSize: sourcePx }
    )
    const picked = pickLobsterAvatarSlot(assets, 'portrait')
    return picked?.slot === 'portrait' ? picked.url : null
  }, [src, config, configSeed, sourcePx])

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

      {portraitUrl ? (
        <div
          data-testid="portrait-fisheye-container"
          className={`relative z-10 w-full h-full flex items-center justify-center overflow-hidden ${
            fisheyeLens ? 'scale-[1.06] [filter:url(#benthic-fisheye-disp)]' : ''
          }`}
        >
          <img
            src={portraitUrl}
            alt={alt}
            width={sourcePx}
            height={sourcePx}
            loading={loading}
            decoding="async"
            data-testid="lobster-avatar-portrait-image"
            className={`w-full h-full object-cover brightness-[0.96] contrast-[1.12] saturate-[1.15] [image-rendering:pixelated] [image-rendering:crisp-edges] ${
              interactive ? 'transition-transform duration-300 group-hover:scale-[1.03]' : ''
            }`}
          />
        </div>
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
