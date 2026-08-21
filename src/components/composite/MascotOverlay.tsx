import React from 'react'
import { S3_BASE_URL } from '@/lib/assets'
import { cn } from '@/lib/utils'

export type MascotKey =
  | 'lobster_pointing'
  | 'lobster_thumbs_up'
  | 'lobster_action'
  | 'crab_stats'
  | 'crab_cling'
  | 'lobster_peek'
  | 'lobster_peaceful'
  | 'lobster_engineer'
  | 'none'
  | (string & {})

export interface MascotInfo {
  key: string
  filename: string
  url: string
}

export const MASCOT_REGISTRY: Record<string, MascotInfo> = {
  lobster_pointing: {
    key: 'lobster_pointing',
    filename: 'char_lobster_pointing_cta.png',
    url: `${S3_BASE_URL}/images/characters/char_lobster_pointing_cta.png`,
  },
  lobster_thumbs_up: {
    key: 'lobster_thumbs_up',
    filename: 'char_lobster_thumbs_up.png',
    url: `${S3_BASE_URL}/images/characters/char_lobster_thumbs_up.png`,
  },
  lobster_action: {
    key: 'lobster_action',
    filename: 'char_lobster_speed_action.png',
    url: `${S3_BASE_URL}/images/characters/char_lobster_speed_action.png`,
  },
  crab_stats: {
    key: 'crab_stats',
    filename: 'char_crab_pointing_stats.png',
    url: `${S3_BASE_URL}/images/characters/char_crab_pointing_stats.png`,
  },
  crab_cling: {
    key: 'crab_cling',
    filename: 'char_crab_corner_cling.png',
    url: `${S3_BASE_URL}/images/characters/char_crab_corner_cling.png`,
  },
  lobster_peek: {
    key: 'lobster_peek',
    filename: 'char_lobster_corner_peek.png',
    url: `${S3_BASE_URL}/images/characters/char_lobster_corner_peek.png`,
  },
  lobster_peaceful: {
    key: 'lobster_peaceful',
    filename: 'char_lobster_floating_peaceful.png',
    url: `${S3_BASE_URL}/images/characters/char_lobster_floating_peaceful.png`,
  },
  lobster_engineer: {
    key: 'lobster_engineer',
    filename: 'char_lobster_engineer.png',
    url: `${S3_BASE_URL}/images/characters/char_lobster_engineer.png`,
  },
}

export function getMascotUrl(mascotKey: string): string {
  const normKey = mascotKey.replace(/\.png$/, '').replace(/^char_/, '')
  if (MASCOT_REGISTRY[normKey]) {
    return MASCOT_REGISTRY[normKey].url
  }
  const filename = mascotKey.startsWith('char_') ? `${mascotKey}.png` : `char_${mascotKey}.png`
  return `${S3_BASE_URL}/images/characters/${filename}`
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

  const mascotUrl = getMascotUrl(mascot)

  const positionClasses = {
    'bottom-right': 'bottom-12 right-10',
    'bottom-left': 'bottom-12 left-10',
    'center-right': 'top-1/2 -translate-y-1/2 right-10',
    'top-right': 'top-12 right-10',
  }[position]

  return (
    <div
      className={cn('absolute z-20 pointer-events-none flex items-center justify-center', positionClasses, className)}
      style={{ width: `${width}px` }}
    >
      {/* Ambient Cyan Radial Glow */}
      {glow && (
        <div
          className="absolute inset-0 -m-16 rounded-full bg-[radial-gradient(circle,rgba(0,255,230,0.22)_0%,rgba(0,180,220,0.06)_50%,transparent_70%)] pointer-events-none -z-10"
        />
      )}

      {/* Mascot Cutout Image with Deep Shadow */}
      <img
        src={mascotUrl}
        alt={mascot}
        className="w-full h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]"
        crossOrigin="anonymous"
      />
    </div>
  )
}
