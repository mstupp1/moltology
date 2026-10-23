import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { LOBSTER_AVATAR_STYLE, isKitSvgDataUri, type LobsterAvatarConfig } from '@/lib/lobster-avatar'
import {
  acquireLobsterFullBodyMotion,
  pickLobsterAvatarSlot,
  releaseLobsterFullBodyMotion,
  resolveLobsterAvatarAssets,
} from '@/lib/lobster-avatar-slots'
import { LobsterAvatarDisplay } from './LobsterAvatarDisplay'
import { LobsterAvatarSilhouette } from './LobsterAvatarSilhouette'
import { canUseKitStage } from './avatar/kit-stage/support'

const KitStage = lazy(() => import('./avatar/kit-stage/KitStage'))

type StageState = 'off' | 'loading' | 'ready' | 'failed'

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

  // Painted-kit characters (avatar-kit experiment only) get the live WebGL stage on top of the
  // SVG, which stays underneath as the fallback and shows until the stage's first frame.
  const kitSrc = pickedUrl && isKitSvgDataUri(pickedUrl) ? pickedUrl : null
  const [stage, setStage] = useState<StageState>('off')
  useEffect(() => {
    setStage((prev) => {
      if (prev === 'failed') return prev
      if (!kitSrc || !hasMotionLease || !canUseKitStage()) return 'off'
      return prev === 'off' ? 'loading' : prev
    })
  }, [kitSrc, hasMotionLease])
  const stageOn = stage === 'loading' || stage === 'ready'

  return (
    <div
      data-testid="lobster-avatar-full-body"
      data-slot="fullBody"
      data-motion={hasMotionLease ? 'on' : 'held'}
      data-stage={stage}
      className={`relative overflow-hidden rounded-sm border border-white/[0.14] bg-[#081419]/90 shrink-0 ${className}`}
    >
      {pickedUrl ? (
        <LobsterAvatarDisplay
          src={pickedUrl}
          alt={alt}
          pixelated={false}
          crt={false}
          outputSize={size}
          maskRadial={false}
          animated={hasMotionLease && stage !== 'ready'}
          animationSeed={animationSeed ?? configSeed}
          texture={effectiveConfig?.backgroundTexture}
          containerClassName="relative w-full h-full flex items-center justify-center overflow-hidden"
          className="w-full h-full overflow-hidden"
          imgClassName="w-full h-full object-contain"
        />
      ) : null}
      {kitSrc && stageOn ? (
        <div className={`absolute inset-0 z-[1] transition-opacity duration-500 ${stage === 'ready' ? 'opacity-100' : 'opacity-0'}`}>
          <Suspense fallback={null}>
            <KitStage
              src={kitSrc}
              animationSeed={animationSeed ?? configSeed}
              onReady={() => setStage((s) => (s === 'loading' ? 'ready' : s))}
              onFail={() => setStage('failed')}
            />
          </Suspense>
        </div>
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
