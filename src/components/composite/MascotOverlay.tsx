import React, { useState, useEffect } from 'react'
import { getAssetUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'

export type MascotKey =
  | 'lobster_pointing'
  | 'lobster_thumbs_up'
  | 'lobster_navigator'
  | 'lobster_action'
  | 'crab_stats'
  | 'lobster_peek'
  | 'lobster_peaceful'
  | 'lobster_engineer'
  | 'lobster_pointing_junior'
  | 'lobster_thumbs_up_junior'
  | 'lobster_navigator_junior'
  | 'lobster_peek_junior'
  | 'lobster_peaceful_junior'
  | 'lobster_engineer_junior'
  | 'crab_stats_junior'
  | 'crab_explorer'
  | 'crab_explorer_junior'
  | 'crab_builder'
  | 'crab_builder_junior'
  | 'lobster_archivist'
  | 'crab_ritual_keeper'
  | 'crab_sentinel'
  | 'lobster_oracle_attendant'
  | 'random'
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
    name: 'Lobster Guide (Adult)',
    filename: 'char_lobster_pointing_adult_v2.webp',
    s3Url: getAssetUrl('images/characters/char_lobster_pointing_adult_v2.webp?v=20261008'),
    description: 'Coral guide raising a welcoming pincer with an adult standing stance',
  },
  lobster_thumbs_up: {
    key: 'lobster_thumbs_up',
    name: 'Lobster Approval (Adult)',
    filename: 'char_lobster_thumbs_up_adult_v2.webp',
    s3Url: getAssetUrl('images/characters/char_lobster_thumbs_up_adult_v2.webp?v=20261008'),
    description: 'Apricot lobster raising an approving pincer with an adult standing stance',
  },
  lobster_navigator: {
    key: 'lobster_navigator',
    name: 'Lobster Explorer (Adult)',
    filename: 'char_lobster_navigator_adult_v2.webp',
    s3Url: getAssetUrl('images/characters/char_lobster_navigator_adult_v2.webp?v=20261008'),
    description: 'Explorer with goggles and utility harness with an adult standing stance',
  },
  lobster_peek: {
    key: 'lobster_peek',
    name: 'Lobster Peek (Adult)',
    filename: 'char_lobster_peek_adult_v2.webp',
    s3Url: getAssetUrl('images/characters/char_lobster_peek_adult_v2.webp?v=20261008'),
    description: 'Rose lobster leaning curiously with raised pincers with an adult standing stance',
  },
  lobster_peaceful: {
    key: 'lobster_peaceful',
    name: 'Lobster Guardian (Adult)',
    filename: 'char_lobster_peaceful_adult_v2.webp',
    s3Url: getAssetUrl('images/characters/char_lobster_peaceful_adult_v2.webp?v=20261008'),
    description: 'Lavender guardian with a calm expression with an adult standing stance',
  },
  lobster_engineer: {
    key: 'lobster_engineer',
    name: 'Lobster Engineer (Adult)',
    filename: 'char_lobster_engineer_adult_v2.webp',
    s3Url: getAssetUrl('images/characters/char_lobster_engineer_adult_v2.webp?v=20261008'),
    description: 'Engineer with hardhat, tools and diagnostic tablet with an adult standing stance',
  },
  crab_stats: {
    key: 'crab_stats',
    name: 'Crab Metrics (Adult)',
    filename: 'char_crab_stats_adult_v2.webp',
    s3Url: getAssetUrl('images/characters/char_crab_stats_adult_v2.webp?v=20261008'),
    description: 'Terracotta crab presenting a chart with an adult standing stance',
  },
  lobster_pointing_junior: {
    key: 'lobster_pointing_junior',
    name: 'Junior Lobster Guide',
    filename: 'char_lobster_pointing_junior_v2.webp',
    s3Url: getAssetUrl('images/characters/char_lobster_pointing_junior_v2.webp?v=20261008'),
    description: 'Coral guide raising a welcoming pincer with short junior legs',
  },
  lobster_thumbs_up_junior: {
    key: 'lobster_thumbs_up_junior',
    name: 'Junior Lobster Approval',
    filename: 'char_lobster_thumbs_up_junior_v2.webp',
    s3Url: getAssetUrl('images/characters/char_lobster_thumbs_up_junior_v2.webp?v=20261008'),
    description: 'Apricot lobster raising an approving pincer with short junior legs',
  },
  lobster_navigator_junior: {
    key: 'lobster_navigator_junior',
    name: 'Junior Lobster Explorer',
    filename: 'char_lobster_navigator_junior_v2.webp',
    s3Url: getAssetUrl('images/characters/char_lobster_navigator_junior_v2.webp?v=20261008'),
    description: 'Explorer with goggles and utility harness with short junior legs',
  },
  lobster_peek_junior: {
    key: 'lobster_peek_junior',
    name: 'Junior Lobster Peek',
    filename: 'char_lobster_peek_junior_v2.webp',
    s3Url: getAssetUrl('images/characters/char_lobster_peek_junior_v2.webp?v=20261008'),
    description: 'Rose lobster leaning curiously with raised pincers with short junior legs',
  },
  lobster_peaceful_junior: {
    key: 'lobster_peaceful_junior',
    name: 'Junior Lobster Guardian',
    filename: 'char_lobster_peaceful_junior_v2.webp',
    s3Url: getAssetUrl('images/characters/char_lobster_peaceful_junior_v2.webp?v=20261008'),
    description: 'Lavender guardian with a calm expression with short junior legs',
  },
  lobster_engineer_junior: {
    key: 'lobster_engineer_junior',
    name: 'Junior Lobster Engineer',
    filename: 'char_lobster_engineer_junior_v2.webp',
    s3Url: getAssetUrl('images/characters/char_lobster_engineer_junior_v2.webp?v=20261008'),
    description: 'Engineer with hardhat, tools and diagnostic tablet with short junior legs',
  },
  crab_stats_junior: {
    key: 'crab_stats_junior',
    name: 'Junior Crab Metrics',
    filename: 'char_crab_stats_junior_v2.webp',
    s3Url: getAssetUrl('images/characters/char_crab_stats_junior_v2.webp?v=20261008'),
    description: 'Terracotta crab presenting a chart with short junior legs',
  },
  crab_explorer: {
    key: 'crab_explorer',
    name: 'Crab Explorer (Adult)',
    filename: 'char_crab_explorer_adult_v2.webp',
    s3Url: getAssetUrl('images/characters/char_crab_explorer_adult_v2.webp?v=20261008'),
    description: 'Blue crab explorer with compass, goggles and satchel with an adult standing stance',
  },
  crab_explorer_junior: {
    key: 'crab_explorer_junior',
    name: 'Junior Crab Explorer',
    filename: 'char_crab_explorer_junior_v2.webp',
    s3Url: getAssetUrl('images/characters/char_crab_explorer_junior_v2.webp?v=20261008'),
    description: 'Blue crab explorer with compass, goggles and satchel with short junior legs',
  },
  crab_builder: {
    key: 'crab_builder',
    name: 'Crab Builder (Adult)',
    filename: 'char_crab_builder_adult_v2.webp',
    s3Url: getAssetUrl('images/characters/char_crab_builder_adult_v2.webp?v=20261008'),
    description: 'Purple crab builder with hardhat and spanner with an adult standing stance',
  },
  crab_builder_junior: {
    key: 'crab_builder_junior',
    name: 'Junior Crab Builder',
    filename: 'char_crab_builder_junior_v2.webp',
    s3Url: getAssetUrl('images/characters/char_crab_builder_junior_v2.webp?v=20261008'),
    description: 'Purple crab builder with hardhat and spanner with short junior legs',
  },
  lobster_archivist: {
    key: 'lobster_archivist',
    name: 'Lobster Archivist (Adult)',
    filename: 'char_lobster_archivist_adult_v2.webp',
    s3Url: getAssetUrl('images/characters/char_lobster_archivist_adult_v2.webp?v=20261008'),
    description: 'Scholar with scripture book and shoulder mantle with an adult standing stance',
  },
  crab_ritual_keeper: {
    key: 'crab_ritual_keeper',
    name: 'Crab Ritual Keeper (Adult)',
    filename: 'char_crab_ritual_keeper_adult_v2.webp',
    s3Url: getAssetUrl('images/characters/char_crab_ritual_keeper_adult_v2.webp?v=20261008'),
    description: 'Ritual keeper with brass bell and ledger with an adult standing stance',
  },
  crab_sentinel: {
    key: 'crab_sentinel',
    name: 'Crab Sentinel (Adult)',
    filename: 'char_crab_sentinel_adult_v2.webp',
    s3Url: getAssetUrl('images/characters/char_crab_sentinel_adult_v2.webp?v=20261008'),
    description: 'Armored sentinel with shield and welcoming pincer with an adult standing stance',
  },
  lobster_oracle_attendant: {
    key: 'lobster_oracle_attendant',
    name: 'Lobster Oracle Attendant (Adult)',
    filename: 'char_lobster_oracle_attendant_adult_v2.webp',
    s3Url: getAssetUrl('images/characters/char_lobster_oracle_attendant_adult_v2.webp?v=20261008'),
    description: 'Ivory Oracle attendant with listening instrument with an adult standing stance',
  },
}

/**
 * Get a list of all registered mascot keys (excluding 'none' and meta keys)
 */
export function getAllMascotKeys(): string[] {
  return Object.keys(MASCOT_REGISTRY)
}

/**
 * Pick a random registered mascot key, optionally excluding certain keys
 */
export function getRandomMascotKey(excludeKeys: string[] = []): string {
  const pool = getAllMascotKeys().filter((k) => !excludeKeys.includes(k))
  const candidates = pool.length > 0 ? pool : getAllMascotKeys()
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/**
 * Generate a rotation of unique random mascot keys (e.g. for multi-slide carousels)
 */
export function getRandomMascotRotation(count: number): string[] {
  const pool = [...getAllMascotKeys()]
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  if (count <= pool.length) {
    return pool.slice(0, count)
  }
  // If count exceeds unique mascots, cycle with wrap-around
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(pool[i % pool.length])
  }
  return result
}

/**
 * Normalizes character keys and aliases to registry keys
 */
export function normalizeMascotKey(rawKey: string): string {
  if (!rawKey) return 'lobster_thumbs_up'
  let raw = rawKey.trim().toLowerCase()
  if (raw === 'random' || raw === 'dice' || raw === 'shuffle') {
    return getRandomMascotKey()
  }
  if (raw.endsWith('.png') || raw.endsWith('.jpg') || raw.endsWith('.webp')) {
    raw = raw.replace(/\.[^/.]+$/, '')
  }
  if (raw.startsWith('char_')) {
    raw = raw.replace(/^char_/, '')
  }

  const registered = Object.values(MASCOT_REGISTRY).find(
    (info) => info.filename.replace(/^char_/, '').replace(/\.[^/.]+$/, '') === raw
  )
  if (registered) return registered.key

  // Comprehensive alias normalization
  if (raw === 'lobster_pointing_cta' || raw === 'pointing' || raw === 'cta' || raw === 'lobster_cta') return 'lobster_pointing'
  if (raw === 'lobster_corner_peek' || raw === 'peek' || raw === 'corner_peek') return 'lobster_peek'
  if (raw === 'crab_pointing_stats' || raw === 'crab_stats' || raw === 'stats' || raw === 'pointing_stats') return 'crab_stats'
  if (raw === 'lobster_navigator' || raw === 'navigator' || raw === 'explorer' || raw === 'lobster_speed_action' || raw === 'speed_action' || raw === 'lobster_action' || raw === 'action' || raw === 'speed') return 'lobster_navigator'
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
    s3Url: getAssetUrl(`images/characters/${filename}`),
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
      setCurrentSrc(getMascotUrl('lobster_thumbs_up'))
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
