import React, { useState, useEffect } from 'react'

export interface UserAvatarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    avatar?: string | null
    picture?: string | null
  } | null
  src?: string | null
  name?: string | null
  email?: string | null
  fallbackSrc?: string | null
  fallbackLetter?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  alt?: string
  variant?: 'benthic' | 'corporate'
}

/**
 * Standardized User Avatar component for Moltology portal & non-portal headers.
 * Supports SSO profile images (Google avatar) with automatic onError fallback
 * to a high-tech HUD styled letter avatar (or clean corporate light-mode avatar).
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  src,
  name,
  email,
  fallbackSrc,
  fallbackLetter,
  size = 'md',
  className = '',
  alt,
  variant = 'benthic',
}) => {
  const [imageError, setImageError] = useState(false)
  const [activeVaultAvatar, setActiveVaultAvatar] = useState<string | null>(null)

  const isCorporate = variant === 'corporate'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('moltology_saved_avatars')
        if (stored) {
          const parsed = JSON.parse(stored)
          const active = parsed.find((a: any) => a.isActive)
          if (active?.imageUrl) {
            setActiveVaultAvatar(active.imageUrl)
          }
        }
      } catch (e) {
        // ignore JSON errors
      }
    }
  }, [])

  const imageUrl = src ?? user?.image ?? user?.avatar ?? user?.picture ?? activeVaultAvatar ?? null
  const displayName = name ?? user?.name ?? email ?? user?.email ?? ''
  const displayAlt = alt ?? displayName ?? 'User avatar'

  useEffect(() => {
    setImageError(false)
  }, [imageUrl])

  // Size preset mapping
  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
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

  // 1. Primary Avatar Image (e.g. Google SSO profile picture)
  if (imageUrl && !imageError) {
    return (
      <div
        className={`relative shrink-0 rounded-full overflow-hidden flex items-center justify-center ${
          isCorporate ? 'bg-slate-100' : 'bg-[#030606]'
        } ${sizeClasses} ${className}`}
      >
        <img
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
        className={`relative shrink-0 rounded-full overflow-hidden flex items-center justify-center ${
          isCorporate ? 'bg-slate-100' : 'bg-[#030606]'
        } ${sizeClasses} ${className}`}
      >
        <img
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
      className={`relative shrink-0 rounded-full overflow-hidden flex items-center justify-center font-sans font-bold ${
        isCorporate
          ? 'bg-gradient-to-br from-sky-100 via-sky-50 to-white border border-sky-300 text-sky-700 shadow-sm'
          : 'bg-gradient-to-br from-[#0f1d22] via-[#091316] to-[#030606] border border-[#00c3ff]/60 text-[#00c3ff]'
      } ${sizeClasses} ${className}`}
      aria-label={displayAlt}
      title={displayName || 'User Avatar'}
    >
      <span className="select-none leading-none">{initial}</span>
    </div>
  )
}
