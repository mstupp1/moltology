import React, { useEffect, useMemo, useState } from 'react'
import {
  LOBSTER_AVATAR_STYLE,
  generateLobsterAvatarDataUri,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
import { LobsterAvatarDisplay } from './LobsterAvatarDisplay'

/** Face-focused crop tuned for critters full-body sprites in a circular frame */
const PORTRAIT_FACE_CLASSES = 'scale-[1.9] origin-[center_20%] object-[center_22%]'

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
}

/**
 * Circular, face-focused lobster avatar — canonical portrait for settings, chassis, and HUD surfaces.
 */
export const LobsterAvatarPortrait: React.FC<LobsterAvatarPortraitProps> = ({
  src,
  config,
  size = 320,
  alt = 'Carapace avatar',
  className = 'w-48 h-48 sm:w-56 sm:h-56',
  interactive = false,
  animationSeed,
  eyeTracking = true,
}) => {
  const [dataUri, setDataUri] = useState<string | null>(src ?? null)
  const resolvedSeed = animationSeed ?? config?.seed
  const configSeed = config?.seed
  const configTheme = config?.backgroundTheme
  const configPattern = config?.backgroundPattern
  const configTransparent = config?.transparentBackground

  useEffect(() => {
    if (src) {
      setDataUri(src)
      return
    }
    if (!configSeed) {
      setDataUri(null)
      return
    }
    setDataUri(
      generateLobsterAvatarDataUri(
        {
          style: LOBSTER_AVATAR_STYLE,
          seed: configSeed,
          ...(configTheme ? { backgroundTheme: configTheme } : {}),
          ...(configPattern ? { backgroundPattern: configPattern } : {}),
          ...(configTransparent ? { transparentBackground: configTransparent } : {}),
        },
        size
      )
    )
  }, [src, configSeed, configTheme, configPattern, configTransparent, size])

  const portraitClassName = useMemo(
    () =>
      `relative aspect-square rounded-full border-2 border-[#00c3ff]/40 bg-[#030c14] overflow-hidden shrink-0 shadow-[0_0_30px_rgba(0,195,255,0.18)] ${
        interactive ? 'group' : ''
      } ${className}`,
    [interactive, className]
  )

  return (
    <div className={portraitClassName}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(0,195,255,0.14),transparent_72%)] pointer-events-none z-0" />

      {dataUri ? (
        <LobsterAvatarDisplay
          src={dataUri}
          alt={alt}
          pixelResolution={64}
          outputSize={size}
          maskRadial={false}
          animationSeed={resolvedSeed}
          eyeTracking={eyeTracking}
          containerClassName={`relative z-10 w-full h-full flex items-start justify-center overflow-hidden ${
            interactive ? 'transition-transform duration-300 group-hover:scale-[1.03]' : ''
          }`}
          className="w-full h-full overflow-hidden"
          imgClassName={`w-full h-full object-cover ${PORTRAIT_FACE_CLASSES}`}
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
    </div>
  )
}
