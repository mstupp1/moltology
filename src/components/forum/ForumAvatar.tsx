import React, { useState, useEffect, useMemo } from 'react'
import {
  LOBSTER_AVATAR_STYLE,
  generateLobsterAvatarDataUri,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'

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
  /** CSS sizing or positioning overrides (defaults to 'w-4 h-4') */
  className?: string
  /** Accessible alt text */
  alt?: string
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
 * or gracefully falls back to a close-up still of the user lobster character avatar SVG
 * focused on their face.
 */
export const ForumAvatar: React.FC<ForumAvatarProps> = React.memo(({
  src,
  authorName,
  authorHandle,
  userId,
  avatarConfig,
  className = 'w-4 h-4',
  alt,
}) => {
  const [imageError, setImageError] = useState(false)

  const hasCustomImage = isValidCustomImageUrl(src)

  useEffect(() => {
    setImageError(false)
  }, [src])

  const displayAlt = alt ?? authorName ?? 'Author avatar'

  const lobsterDataUri = useMemo(() => {
    // If we have a working custom image, defer SVG generation unless needed
    if (hasCustomImage && !imageError) return null

    const effectiveSeed =
      avatarConfig?.seed?.trim() ||
      authorHandle?.trim().toLowerCase() ||
      authorName?.trim().toLowerCase() ||
      userId?.trim() ||
      'larva-unit'

    return generateLobsterAvatarDataUri(
      {
        style: avatarConfig?.style || LOBSTER_AVATAR_STYLE,
        seed: effectiveSeed,
        ...(avatarConfig?.height ? { height: avatarConfig.height } : {}),
        ...(avatarConfig?.armScale ? { armScale: avatarConfig.armScale } : {}),
        ...(avatarConfig?.backgroundTheme ? { backgroundTheme: avatarConfig.backgroundTheme } : {}),
        ...(avatarConfig?.backgroundPattern ? { backgroundPattern: avatarConfig.backgroundPattern } : {}),
        ...(avatarConfig?.backgroundTexture ? { backgroundTexture: avatarConfig.backgroundTexture } : {}),
        ...(avatarConfig?.patternDensity ? { patternDensity: avatarConfig.patternDensity } : {}),
        ...(avatarConfig?.patternGlow ? { patternGlow: avatarConfig.patternGlow } : {}),
        ...(avatarConfig?.patternPulse ? { patternPulse: avatarConfig.patternPulse } : {}),
        ...(avatarConfig?.patternSparkles ? { patternSparkles: avatarConfig.patternSparkles } : {}),
        ...(avatarConfig?.eyelidStyle ? { eyelidStyle: avatarConfig.eyelidStyle } : {}),
        ...(avatarConfig?.backgroundMotion ? { backgroundMotion: avatarConfig.backgroundMotion } : {}),
        ...(avatarConfig?.transparentBackground ? { transparentBackground: avatarConfig.transparentBackground } : {}),
      },
      128
    )
  }, [hasCustomImage, imageError, avatarConfig, authorHandle, authorName, userId])

  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 border border-[#3a4a49] bg-[#081419] flex items-center justify-center ${className}`}
      data-testid="forum-avatar-container"
    >
      {hasCustomImage && !imageError ? (
        <img
          src={src!}
          alt={displayAlt}
          className="w-full h-full object-cover rounded-full"
          onError={() => setImageError(true)}
          data-testid="forum-avatar-custom-image"
        />
      ) : (
        <img
          src={lobsterDataUri ?? ''}
          alt={displayAlt}
          className="w-full h-full object-cover rounded-full scale-[1.45] origin-[center_36%]"
          data-testid="forum-avatar-lobster-still"
        />
      )}
    </div>
  )
})

ForumAvatar.displayName = 'ForumAvatar'
