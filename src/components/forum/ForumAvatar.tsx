import React, { useState, useEffect, useMemo, useRef } from 'react'
import { BrandAwareImage } from '@/components/ui/BrandMark'
import { cn } from '@/lib/utils'
import {
  LOBSTER_AVATAR_STYLE,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
import { CharacterStill } from '@/components/hud/avatar3d/CharacterStill'
import { GLASS_FRAME_CLASS, GlassLens } from '@/components/hud/GlassLens'

export type ForumAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLASSES: Record<ForumAvatarSize, string> = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11 sm:w-12 sm:h-12',
  xl: 'w-14 h-14',
}

export interface ForumAvatarProps {
  /** Profile image URL (e.g. Google SSO or external URL) */
  src?: string | null
  /** Author display name */
  authorName?: string
  /** Author public handle (e.g. "claw_lord_99") */
  authorHandle?: string | null
  /** User ID if authenticated */
  userId?: string | null
  /** Customized lobster avatar configuration if present */
  avatarConfig?: LobsterAvatarConfig | null
  /** Standard avatar size preset (defaults to 'md' = 36px) */
  size?: ForumAvatarSize
  /** CSS sizing or positioning overrides */
  className?: string
  /** Accessible alt text */
  alt?: string
  /** Lazy-load below the fold. Eager is OK for the signed-in author's own composer face. */
  loading?: 'lazy' | 'eager'
}

/** Check if src is an actual valid image URL rather than an empty placeholder or broken default */
function isValidCustomImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed || trimmed === '/images/stage1_larva.png') return false
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/')
  )
}

/**
 * ForumAvatar:
 * Renders an author's custom profile picture (SSO / external image) if available,
 * or the static lobster portrait slot. Never mounts an animated full-body.
 */
export const ForumAvatar: React.FC<ForumAvatarProps> = React.memo(({
  src,
  authorName,
  authorHandle,
  userId,
  avatarConfig,
  size = 'md',
  className,
  alt,
  loading = 'lazy',
}) => {
  const [imageError, setImageError] = useState(false)

  const hasCustomImage = !avatarConfig?.seed && isValidCustomImageUrl(src)

  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // A server-rendered image can fail before hydration attaches onError; catch that here.
    const image = containerRef.current?.querySelector('img')
    setImageError(Boolean(image?.complete && image.naturalWidth === 0 && image.getAttribute('src')))
  }, [src])

  const displayAlt = alt ?? authorName ?? 'Author avatar'
  const showPhoto = hasCustomImage && !imageError
  // A character wears the profile portrait's glass; at 20px it would only be noise.
  const lens = !showPhoto && size !== 'xs'

  const character = useMemo((): LobsterAvatarConfig | null => {
    if (hasCustomImage && !imageError) return null
    const effectiveSeed =
      avatarConfig?.seed?.trim() ||
      authorHandle?.trim().toLowerCase() ||
      authorName?.trim().toLowerCase() ||
      userId?.trim() ||
      'larva-unit'
    return { style: avatarConfig?.style || LOBSTER_AVATAR_STYLE, ...avatarConfig, seed: effectiveSeed }
  }, [hasCustomImage, imageError, avatarConfig, authorHandle, authorName, userId])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative rounded-full overflow-hidden shrink-0 bg-surface-2 flex items-center justify-center transition-all',
        lens ? GLASS_FRAME_CLASS : 'border border-line',
        SIZE_CLASSES[size],
        className
      )}
      data-testid="forum-avatar-container"
    >
      {showPhoto ? (
        <BrandAwareImage
          src={src!}
          alt={displayAlt}
          className="w-full h-full object-cover rounded-full"
          loading={loading}
          decoding="async"
          onError={() => setImageError(true)}
          data-testid="forum-avatar-custom-image"
        />
      ) : (
        <CharacterStill config={character} px={128} alt={displayAlt} scene imgClassName="rounded-full" />
      )}
      {lens && <GlassLens />}
    </div>
  )
})

ForumAvatar.displayName = 'ForumAvatar'
