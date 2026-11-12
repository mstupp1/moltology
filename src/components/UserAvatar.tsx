import { parseLobsterAvatarConfig, type LobsterAvatarConfig } from '@/lib/lobster-avatar'
import React, { useState, useEffect } from 'react'
import { BrandAwareImage } from '@/components/ui/BrandMark'
import { CharacterStill } from '@/components/hud/avatar3d/CharacterStill'
import { GLASS_FRAME_CLASS, GlassLens } from '@/components/hud/GlassLens'

export interface UserAvatarProps {
  user?: {
    avatarConfig?: LobsterAvatarConfig | null
    name?: string | null
    email?: string | null
    image?: string | null
    avatar?: string | null
    picture?: string | null
  } | null
  config?: LobsterAvatarConfig | null
  src?: string | null
  name?: string | null
  email?: string | null
  fallbackSrc?: string | null
  fallbackLetter?: string
  size?: 'xxs' | 'xs' | 'sm' | 'row' | 'nav' | 'md' | 'lg' | 'xl' | 'fill'
  className?: string
  /** Drop the letter fallback's own border when the parent draws the edge. */
  borderless?: boolean
  /** Wear the profile portrait's glass over a character (default true; never below 24px). */
  glass?: boolean
  alt?: string
  /**
   * The member's character is still loading: draw the same soft pulse as a loading
   * still instead of a letter or sign-in picture that would be swapped out a moment later.
   */
  pending?: boolean
}

/**
 * Standardized User Avatar component for Moltology portal & non-portal headers.
 * Supports SSO profile images (Google avatar) with automatic onError fallback
 * to a high-tech HUD styled letter avatar.
 */
export const UserAvatar: React.FC<UserAvatarProps> = React.memo(
  ({
    user,
    config,
    src,
    name,
    email,
    fallbackSrc,
    fallbackLetter,
    size = 'md',
    className = '',
    alt,
    borderless = false,
    glass = true,
    pending = false,
  }) => {
    const [imageError, setImageError] = useState(false)

    const character = parseLobsterAvatarConfig(config ?? user?.avatarConfig)
    // Large and parent-sized portraits draw at twice the usual resolution so they stay crisp.
    const resolution = size === 'xl' || size === 'fill' ? 256 : 128
    const imageUrl = src ?? user?.image ?? user?.avatar ?? user?.picture ?? null
    const displayName = name ?? user?.name ?? email ?? user?.email ?? ''
    const displayAlt = alt ?? displayName ?? 'User avatar'

    useEffect(() => {
      setImageError(false)
    }, [imageUrl])

    // Size preset mapping
    const sizeClasses = {
      xxs: 'w-4 h-4 text-[8px]',
      xs: 'w-5 h-5 text-[10px]',
      sm: 'w-6 h-6 text-xs',
      row: 'w-8 h-8 text-xs',
      nav: 'w-9 h-9 text-sm',
      md: 'w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-lg',
      /** Fills a sized parent, e.g. the portrait inside the XP ring. */
      fill: 'w-full h-full text-sm',
    }[size]

    // Compute initial letter fallback from name or email
    const getInitial = () => {
      if (fallbackLetter) return fallbackLetter[0].toUpperCase()
      if (displayName && displayName.trim().length > 0) {
        const clean = displayName.trim()
        return clean[0].toUpperCase()
      }
      return '?'
    }

    // 1. The member's character, as a still of the 3D face, behind the portrait glass.
    if (character) {
      // At 16 to 20px the glass is only noise.
      const lens = glass && size !== 'xxs' && size !== 'xs'
      return (
        <div
          className={`relative shrink-0 rounded-full overflow-hidden bg-abyss ${lens && !borderless ? GLASS_FRAME_CLASS : ''} ${sizeClasses} ${className}`}
        >
          <CharacterStill config={character} px={resolution} alt={displayAlt} scene imgClassName="rounded-full" />
          {lens && <GlassLens />}
        </div>
      )
    }

    // Still learning who this is: hold the portrait's shape with the still's own loading pulse.
    if (pending) {
      return (
        <div
          data-testid="user-avatar-pending"
          aria-label={displayAlt}
          className={`relative shrink-0 rounded-full overflow-hidden bg-abyss ${glass && !borderless ? GLASS_FRAME_CLASS : ''} ${sizeClasses} ${className}`}
        >
          <span aria-hidden className="absolute inset-0 animate-pulse bg-white/[0.05] motion-reduce:animate-none" />
        </div>
      )
    }

    // 2. A sign-in profile picture (e.g. Google)
    if (imageUrl && !imageError) {
      return (
        <div
          className={`relative shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-[#030606] ${sizeClasses} ${className}`}
        >
          <BrandAwareImage
            src={imageUrl}
            alt={displayAlt}
            className="w-full h-full object-cover rounded-full"
            onError={() => setImageError(true)}
          />
        </div>
      )
    }

    // 2. Custom Fallback Image (e.g. default Larva Unit graphic when logged out)
    if (fallbackSrc && !user) {
      return (
        <div
          className={`relative shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-[#030606] ${sizeClasses} ${className}`}
        >
          <BrandAwareImage
            src={fallbackSrc}
            alt={displayAlt}
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      )
    }

    // 3. Fallback Letter Avatar
    const initial = getInitial()

    return (
      <div
        className={`relative shrink-0 rounded-full overflow-hidden flex items-center justify-center font-sans font-bold bg-gradient-to-br from-[#0f1d22] via-[#091316] to-[#030606] ${borderless ? '' : 'border border-[#00c3ff]/60'} text-[#00c3ff] ${sizeClasses} ${className}`}
        aria-label={displayAlt}
        title={displayName || 'User Avatar'}
      >
        <span className="select-none leading-none">{initial}</span>
      </div>
    )
  },
)

UserAvatar.displayName = 'UserAvatar'
