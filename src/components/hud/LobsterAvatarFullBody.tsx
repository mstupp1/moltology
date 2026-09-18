import React, { useEffect, useMemo, useState } from 'react'
import {
  LOBSTER_AVATAR_STYLE,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
import {
  acquireLobsterFullBodyMotion,
  pickLobsterAvatarSlot,
  releaseLobsterFullBodyMotion,
  resolveLobsterAvatarAssets,
} from '@/lib/lobster-avatar-slots'
import { LobsterAvatarDisplay } from './LobsterAvatarDisplay'

export interface LobsterAvatarFullBodyProps {
  src?: string | null
  config?: LobsterAvatarConfig | null
  size?: number
  alt?: string
  className?: string
  animationSeed?: string
}

/**
 * Animated full-body lobster. Mount only on the profile page and character create.
 * Holds at most one motion lease and yields motion while the document is hidden.
 */
export const LobsterAvatarFullBody: React.FC<LobsterAvatarFullBodyProps> = React.memo(({
  src,
  config,
  size = 320,
  alt = 'Carapace avatar',
  className = 'w-full aspect-[4/5]',
  animationSeed,
}) => {
  const [hasMotionLease, setHasMotionLease] = useState(false)

  useEffect(() => {
    const ok = acquireLobsterFullBodyMotion()
    setHasMotionLease(ok)
    return () => {
      if (ok) releaseLobsterFullBodyMotion()
    }
  }, [])

  const configSeed = config?.seed
  const pickedUrl = useMemo(() => {
    if (src) return src
    if (!configSeed) return null
    const assets = resolveLobsterAvatarAssets(
      { style: config?.style ?? LOBSTER_AVATAR_STYLE, ...config, seed: configSeed },
      { fullBodySize: size }
    )
    const picked = pickLobsterAvatarSlot(assets, 'fullBody')
    return picked?.slot === 'fullBody' ? picked.url : null
  }, [src, config, configSeed, size])

  return (
    <div
      data-testid="lobster-avatar-full-body"
      data-slot="fullBody"
      data-motion={hasMotionLease ? 'on' : 'held'}
      className={`relative overflow-hidden rounded-sm border border-white/[0.14] bg-[#081419]/90 shrink-0 ${className}`}
    >
      {pickedUrl ? (
        <LobsterAvatarDisplay
          src={pickedUrl}
          alt={alt}
          pixelResolution={64}
          outputSize={size}
          maskRadial={false}
          animated={hasMotionLease}
          animationSeed={animationSeed ?? configSeed}
          texture={config?.backgroundTexture}
          containerClassName="relative w-full h-full flex items-center justify-center overflow-hidden"
          className="w-full h-full overflow-hidden"
          imgClassName="w-full h-full object-contain"
        />
      ) : (
        <div className="relative z-10 flex h-full w-full min-h-[8rem] items-center justify-center">
          <span className="px-3 text-center text-[10px] uppercase tracking-wider text-[#4a5a59]">
            No avatar
          </span>
        </div>
      )}
    </div>
  )
})

LobsterAvatarFullBody.displayName = 'LobsterAvatarFullBody'
