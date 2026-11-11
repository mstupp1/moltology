import React, { useRef, useState } from 'react'
import { useStill3D } from '@/hooks/usePortrait3D'
import type { StillShot } from '@/lib/avatar3d-portrait-queue'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { cn } from '@/lib/utils'
import { LobsterAvatarSilhouette } from '../LobsterAvatarSilhouette'

export interface CharacterStillProps {
  config: LobsterAvatarConfig | null | undefined
  /** Pixels to draw at (the picture is square). */
  px: number
  shot?: StillShot
  alt: string
  /** Classes for the picture itself (it fills the parent). */
  imgClassName?: string
  /** Draw the character's chosen scene behind it, as on the full character. */
  scene?: boolean
  /** Shown when there is no character, or this browser cannot draw 3D. Defaults to the plain dome. */
  placeholder?: React.ReactNode
}

/**
 * One 3D still filling its parent: a soft pulse while it is drawn, then the picture fades in.
 * Used for every small picture of a character, so they all load the same way.
 */
export function CharacterStill({ config, px, shot = 'portrait', alt, imgClassName, scene = false, placeholder }: CharacterStillProps) {
  const frameRef = useRef<HTMLSpanElement>(null)
  const still = useStill3D(config, px, frameRef, shot)
  const [shownUrl, setShownUrl] = useState<string | null>(null)
  const empty = !config?.seed || still.status === 'unavailable'
  return (
    <span
      ref={frameRef}
      className="absolute inset-0 block overflow-hidden"
      style={scene && !empty ? still.scene : undefined}
      data-renderer="3d"
      data-state={empty ? 'placeholder' : still.status}
    >
      {empty ? (
        (placeholder ?? (
          <span className="flex h-full w-full items-center justify-center">
            <LobsterAvatarSilhouette alt={alt} className="h-full w-full" />
          </span>
        ))
      ) : (
        <>
          {(!still.url || shownUrl !== still.url) && (
            <span aria-hidden data-testid="character-still-loading" className="absolute inset-0 animate-pulse bg-white/[0.05] motion-reduce:animate-none" />
          )}
          {still.url && (
            <img
              src={still.url}
              alt={alt}
              width={px}
              height={px}
              decoding="async"
              draggable={false}
              onLoad={() => setShownUrl(still.url)}
              data-testid="character-still"
              className={cn(
                'relative h-full w-full object-cover transition-opacity duration-200 motion-reduce:transition-none',
                shownUrl === still.url ? 'opacity-100' : 'opacity-0',
                imgClassName,
              )}
            />
          )}
        </>
      )}
    </span>
  )
}
