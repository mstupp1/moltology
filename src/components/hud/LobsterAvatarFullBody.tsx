import React, { useMemo, useState } from 'react'
import { LOBSTER_AVATAR_STYLE, type LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { useAvatar3D } from '@/hooks/useAvatar3D'
import { lookFromConfig } from '@/lib/avatar3d/look'
import { sceneStyle3D } from '@/lib/avatar3d-scene'
import { RotateCcw } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { HUDSpinner } from '@/components/ui/HUDSpinner'
import { Avatar3DStage } from './avatar3d/Avatar3DStage'
import { LobsterAvatarSilhouette } from './LobsterAvatarSilhouette'

export interface LobsterAvatarFullBodyProps {
  config?: LobsterAvatarConfig | null
  /** Kept for callers that size the frame by it; the 3D stage fills whatever frame it gets. */
  size?: number
  alt?: string
  className?: string
  /** A seed to draw a stand-in character from when there is no saved one. */
  fallbackSeed?: string
  /** A gear slot for the camera to feature, or null for the whole figure. */
  focus?: string | null
  /** Shown as a Reset view button while a slot is featured. */
  onResetFocus?: () => void
}

/**
 * The whole character, live in 3D, over its chosen scene. A spinner shows until the first frame
 * is drawn, and a plain silhouette stands in when there is no character or no 3D in this browser.
 */
export const LobsterAvatarFullBody: React.FC<LobsterAvatarFullBodyProps> = React.memo(({
  config,
  alt = 'Carapace avatar',
  className = 'w-full aspect-[4/5]',
  fallbackSeed,
  focus = null,
  onResetFocus,
}) => {
  const effectiveConfig = useMemo((): LobsterAvatarConfig | null => {
    if (config?.seed) return config
    if (fallbackSeed?.trim()) return { ...config, style: config?.style || LOBSTER_AVATAR_STYLE, seed: fallbackSeed.trim() }
    return null
  }, [config, fallbackSeed])

  const support = useAvatar3D()
  const [ready, setReady] = useState(false)
  const look = useMemo(() => (support && effectiveConfig ? lookFromConfig(effectiveConfig) : null), [support, effectiveConfig])
  const scene = useMemo(() => (effectiveConfig ? sceneStyle3D(effectiveConfig) : undefined), [effectiveConfig])
  const placeholder = !effectiveConfig || support === false

  return (
    <div
      data-testid="lobster-avatar-full-body"
      data-slot="fullBody"
      data-renderer="3d"
      data-state={placeholder ? 'placeholder' : look && ready ? 'ready' : 'loading'}
      className={`relative overflow-hidden rounded-sm border border-white/[0.14] bg-[#081419]/90 shrink-0 ${className}`}
    >
      {scene ? (
        <div aria-hidden data-testid="avatar-3d-scene" className="absolute inset-0" style={scene} />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(34,211,238,0.14),transparent_62%)]" />
      )}
      {placeholder ? (
        <div className="relative z-10 flex h-full w-full min-h-[8rem] items-center justify-center p-4">
          <LobsterAvatarSilhouette alt={alt || 'Uncalibrated chassis silhouette'} frame="fullBody" className="w-full h-full max-w-[180px] max-h-[180px]" />
        </div>
      ) : (
        <>
          {look && (
            <Avatar3DStage
              look={look}
              label={alt}
              focus={focus}
              onReady={() => setReady(true)}
              className={`relative transition-opacity duration-300 motion-reduce:transition-none ${ready ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
          {!(look && ready) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <HUDSpinner size="md" aria-label={`Loading ${alt}`} />
            </div>
          )}
        </>
      )}
      {focus && onResetFocus && (
        <HudButton
          type="button"
          variant="secondary"
          size="sm"
          className="absolute top-1 right-1 lg:top-2 lg:right-2"
          onClick={onResetFocus}
          icon={<RotateCcw className="w-3.5 h-3.5 text-cyan-glow" aria-hidden />}
        >
          Reset view
        </HudButton>
      )}
    </div>
  )
})

LobsterAvatarFullBody.displayName = 'LobsterAvatarFullBody'
