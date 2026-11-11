import React, { useEffect, useMemo, useState } from 'react'
import { LOBSTER_AVATAR_STYLE, type LobsterAvatarConfig } from '@/lib/lobster-avatar'
import {
  acquireLobsterFullBodyMotion,
  pickLobsterAvatarSlot,
  releaseLobsterFullBodyMotion,
  resolveLobsterAvatarAssets,
} from '@/lib/lobster-avatar-slots'
import { useAvatar3D } from '@/hooks/useAvatar3D'
import { lookFromConfig } from '@/lib/avatar3d/look'
import { Avatar3DStage } from './avatar3d/Avatar3DStage'
import { LobsterAvatarDisplay } from './LobsterAvatarDisplay'
import { LobsterAvatarSilhouette } from './LobsterAvatarSilhouette'

export interface LobsterAvatarFullBodyProps {
  src?: string | null
  config?: LobsterAvatarConfig | null
  size?: number
  alt?: string
  className?: string
  animationSeed?: string
  fallbackSeed?: string
}

/**
 * Animated full-body lobster. Mount only on the profile page and settings.
 * Holds at most one motion lease and yields motion while the document is hidden.
 */
export const LobsterAvatarFullBody: React.FC<LobsterAvatarFullBodyProps> = React.memo(({
  src,
  config,
  size = 320,
  alt = 'Carapace avatar',
  className = 'w-full aspect-[4/5]',
  animationSeed,
  fallbackSeed,
}) => {
  const [hasMotionLease, setHasMotionLease] = useState(false)

  useEffect(() => {
    const ok = acquireLobsterFullBodyMotion()
    setHasMotionLease(ok)
    return () => {
      if (ok) releaseLobsterFullBodyMotion()
    }
  }, [])

  const effectiveConfig = useMemo((): LobsterAvatarConfig | null => {
    if (config?.seed) return config
    if (fallbackSeed?.trim()) {
      return {
        style: config?.style || LOBSTER_AVATAR_STYLE,
        seed: fallbackSeed.trim(),
        ...(config?.height ? { height: config.height } : {}),
        ...(config?.armScale ? { armScale: config.armScale } : {}),
        ...(config?.backgroundTheme ? { backgroundTheme: config.backgroundTheme } : {}),
        ...(config?.backgroundPattern ? { backgroundPattern: config.backgroundPattern } : {}),
        ...(config?.backgroundTexture ? { backgroundTexture: config.backgroundTexture } : {}),
      }
    }
    return null
  }, [config, fallbackSeed])

  const configSeed = effectiveConfig?.seed
  const pickedUrl = useMemo(() => {
    if (src) return src
    if (!effectiveConfig || !configSeed) return null
    const assets = resolveLobsterAvatarAssets(effectiveConfig, { fullBodySize: size })
    const picked = pickLobsterAvatarSlot(assets, 'fullBody')
    return picked?.slot === 'fullBody' ? picked.url : null
  }, [src, effectiveConfig, configSeed, size])

  const frameClassName = `relative overflow-hidden rounded-sm border border-white/[0.14] bg-[#081419]/90 shrink-0 ${className}`
  // Viewers with the 3D experiment on see the same saved character, live in 3D.
  const in3D = useAvatar3D() && !src && Boolean(effectiveConfig)
  const look = useMemo(() => (in3D && effectiveConfig ? lookFromConfig(effectiveConfig) : null), [in3D, effectiveConfig])
  if (look) {
    return (
      <div
        data-testid="lobster-avatar-full-body"
        data-slot="fullBody"
        data-renderer="3d"
        className={frameClassName}
      >
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(34,211,238,0.14),transparent_62%)]" />
        <Avatar3DStage look={look} label={alt} className="relative" />
      </div>
    )
  }

  return (
    <div
      data-testid="lobster-avatar-full-body"
      data-slot="fullBody"
      data-motion={hasMotionLease ? 'on' : 'held'}
      className={frameClassName}
    >
      {pickedUrl ? (
        <LobsterAvatarDisplay
          src={pickedUrl}
          alt={alt}
          pixelated={false}
          crt={false}
          outputSize={size}
          maskRadial={false}
          animated={hasMotionLease}
          animationSeed={animationSeed ?? configSeed}
          texture={effectiveConfig?.backgroundTexture}
          containerClassName="relative w-full h-full flex items-center justify-center overflow-hidden"
          className="w-full h-full overflow-hidden"
          imgClassName="w-full h-full object-contain"
        />
      ) : null}
      {pickedUrl ? null : (
        <div className="relative z-10 flex h-full w-full min-h-[8rem] items-center justify-center p-4">
          <LobsterAvatarSilhouette
            alt={alt || 'Uncalibrated chassis silhouette'}
            frame="fullBody"
            className="w-full h-full max-w-[180px] max-h-[180px]"
          />
        </div>
      )}
    </div>
  )
})

LobsterAvatarFullBody.displayName = 'LobsterAvatarFullBody'
