import React, { useState, useEffect } from 'react'
import { S3_BASE_URL } from '@/lib/assets'
import { cn } from '@/lib/utils'

export type MascotKey =
  | 'lobster_pointing'
  | 'lobster_thumbs_up'
  | 'lobster_action'
  | 'crab_stats'
  | 'lobster_peek'
  | 'lobster_peaceful'
  | 'lobster_engineer'
  | 'none'
  | (string & {})

export interface MascotInfo {
  key: string
  name: string
  filename: string
  s3Url: string
  description?: string
}

export const MASCOT_REGISTRY: Record<string, MascotInfo> = {
  lobster_pointing: {
    key: 'lobster_pointing',
    name: 'Lobster Pointing (CTA / Hero)',
    filename: 'char_lobster_pointing_cta.webp',
    s3Url: `${S3_BASE_URL}/images/characters/char_lobster_pointing_cta.webp`,
    description: 'Hero lobster pointing directly at call to action buttons or key links',
  },
  lobster_thumbs_up: {
    key: 'lobster_thumbs_up',
    name: 'Lobster Thumbs Up (Approval)',
    filename: 'char_lobster_thumbs_up.webp',
    s3Url: `${S3_BASE_URL}/images/characters/char_lobster_thumbs_up.webp?v=4`,
    description: 'Cheerful lobster giving a thumbs-up approval sign',
  },
  lobster_action: {
    key: 'lobster_action',
    name: 'Lobster Speed Action (Kinetic)',
    filename: 'char_lobster_speed_action.webp',
    s3Url: `${S3_BASE_URL}/images/characters/char_lobster_speed_action.webp`,
    description: 'Dynamic speed-action lobster dashing forward with propulsion glow',
  },
  crab_stats: {
    key: 'crab_stats',
    name: 'Crab Pointing Stats (Metrics)',
    filename: 'char_crab_pointing_stats.webp',
    s3Url: `${S3_BASE_URL}/images/characters/char_crab_pointing_stats.webp`,
    description: 'Energetic crab pointing at quantitative metrics and charts',
  },
  lobster_peek: {
    key: 'lobster_peek',
    name: 'Lobster Corner Peek (Surprise)',
    filename: 'char_lobster_corner_peek.webp',
    s3Url: `${S3_BASE_URL}/images/characters/char_lobster_corner_peek.webp`,
    description: 'Playful lobster peeking over top or side container bezels',
  },
  lobster_peaceful: {
    key: 'lobster_peaceful',
    name: 'Lobster Peaceful (Zen Benthic)',
    filename: 'char_lobster_floating_peaceful.webp',
    s3Url: `${S3_BASE_URL}/images/characters/char_lobster_floating_peaceful.webp`,
    description: 'Calm cyber-lobster floating peacefully in deep benthic waters',
  },
  lobster_engineer: {
    key: 'lobster_engineer',
    name: 'Lobster Engineer (Hardhat Diagnostic)',
    filename: 'char_lobster_engineer.webp',
    s3Url: `${S3_BASE_URL}/images/characters/char_lobster_engineer.webp`,
    description: 'Cheerful lobster engineer wearing safety hardhat with holographic tablet',
  },
}

/**
 * Normalizes character keys and aliases to registry keys
 */
export function normalizeMascotKey(rawKey: string): string {
  if (!rawKey) return 'lobster_thumbs_up'
  let raw = rawKey.trim().toLowerCase()
  if (raw.endsWith('.png') || raw.endsWith('.jpg') || raw.endsWith('.webp')) {
    raw = raw.replace(/\.[^/.]+$/, '')
  }
  if (raw.startsWith('char_')) {
    raw = raw.replace(/^char_/, '')
  }

  // Comprehensive alias normalization
  if (raw === 'lobster_pointing_cta' || raw === 'pointing' || raw === 'cta' || raw === 'lobster_cta') return 'lobster_pointing'
  if (raw === 'lobster_corner_peek' || raw === 'peek' || raw === 'corner_peek') return 'lobster_peek'
  if (raw === 'crab_pointing_stats' || raw === 'crab_stats' || raw === 'stats' || raw === 'pointing_stats') return 'crab_stats'
  if (raw === 'lobster_speed_action' || raw === 'speed_action' || raw === 'action' || raw === 'speed') return 'lobster_action'
  if (raw === 'lobster_floating_peaceful' || raw === 'floating_peaceful' || raw === 'peaceful' || raw === 'zen' || raw === 'floating') return 'lobster_peaceful'
  if (raw === 'lobster_engineer' || raw === 'engineer' || raw === 'diagnostic' || raw === 'hardhat') return 'lobster_engineer'
  if (raw === 'thumbs_up' || raw === 'thumbs' || raw === 'approval' || raw === 'lobster_thumbs') return 'lobster_thumbs_up'

  return raw
}

/**
 * Get full mascot metadata from any key, filename, or alias
 */
export function getMascotInfo(mascotKey: string): MascotInfo {
  const normKey = normalizeMascotKey(mascotKey)
  if (MASCOT_REGISTRY[normKey]) {
    return MASCOT_REGISTRY[normKey]
  }

  // Dynamic fallback for custom or unlisted mascot files
  const filename = mascotKey.startsWith('char_')
    ? (mascotKey.endsWith('.png') ? mascotKey : `${mascotKey}.png`)
    : `char_${normKey}.png`

  return {
    key: normKey,
    name: normKey.replace(/_/g, ' ').toUpperCase(),
    filename,
    s3Url: `${S3_BASE_URL}/images/characters/${filename}`,
  }
}

/**
 * Resolve mascot primary image URL
 */
export function getMascotUrl(mascotKey: string): string {
  const info = getMascotInfo(mascotKey)
  return info.s3Url
}

export interface MascotOverlayProps {
  mascot?: MascotKey
  position?: 'bottom-right' | 'bottom-left' | 'center-right' | 'top-right'
  width?: number
  glow?: boolean
  className?: string
}

export const MascotOverlay: React.FC<MascotOverlayProps> = ({
  mascot = 'lobster_thumbs_up',
  position = 'bottom-right',
  width = 380,
  glow = true,
  className = '',
}) => {
  if (!mascot || mascot === 'none') return null

  const info = getMascotInfo(mascot)

  // Direct S3 URL with resilient fallback to default mascot
  const [currentSrc, setCurrentSrc] = useState<string>(info.s3Url)
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const [hasFailed, setHasFailed] = useState<boolean>(false)

  useEffect(() => {
    setCurrentSrc(info.s3Url)
    setIsLoaded(false)
    setHasFailed(false)
  }, [mascot, info.s3Url])

  const handleImageError = () => {
    if (!hasFailed) {
      setHasFailed(true)
      // Fallback to S3 default thumbs-up WebP
      setCurrentSrc(`${S3_BASE_URL}/images/characters/char_lobster_thumbs_up.webp?v=4`)
    }
  }

  const positionClasses = {
    'bottom-right': 'bottom-12 right-10',
    'bottom-left': 'bottom-12 left-10',
    'center-right': 'top-1/2 -translate-y-1/2 right-10',
    'top-right': 'top-12 right-10',
  }[position]

  return (
    <div
      className={cn(
        'absolute z-20 pointer-events-none flex items-center justify-center',
        positionClasses,
        className
      )}
      style={{ width: `${width}px` }}
      data-mascot-key={info.key}
    >
      {/* Ambient Cyan Radial Glow (Smooth, unclipped blur) */}
      {glow && (
        <div
          className="absolute -inset-24 rounded-full bg-[radial-gradient(circle,rgba(0,195,255,0.18)_0%,rgba(0,195,255,0.05)_50%,transparent_70%)] blur-2xl pointer-events-none -z-10"
        />
      )}

      {/* Mascot Cutout Image with Deep Shadow (pure S3 CDN) */}
      <img
        src={currentSrc}
        alt={info.name || mascot}
        className={cn(
          'w-full h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)] transition-opacity duration-200',
          isLoaded ? 'opacity-100' : 'opacity-95'
        )}
        loading="eager"
        decoding="sync"
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
      />
    </div>
  )
}
