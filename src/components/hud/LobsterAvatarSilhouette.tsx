import React from 'react'
import {
  LOBSTER_PORTRAIT_VIEWBOX,
  type LobsterAvatarFrame,
} from '../../lib/lobster-avatar'

export interface LobsterAvatarSilhouetteProps {
  className?: string
  alt?: string
  frame?: LobsterAvatarFrame
}

const DOME_BODY = 'M 16 106 V 58 a 34 34 0 0 1 68 0 v 48 Z'
const ANTENNA_LEFT = 'M 43 32 C 40 10 30 -10 14 -24'
const ANTENNA_RIGHT = 'M 57 32 C 60 10 70 -10 86 -24'
const ANTENNULE_LEFT = 'M 46 28 C 45 15 42 4 38 -5'
const ANTENNULE_RIGHT = 'M 54 28 C 55 15 58 4 62 -5'

/**
 * Clean, iconic sci-fi benthic lobster carapace silhouette derived directly from the
 * canonical avatar system proportions, sweeping whips, and dome carapace.
 * Replaces generic empty/uncalibrated state text across porthole avatars and HUD cards.
 */
export const LobsterAvatarSilhouette: React.FC<LobsterAvatarSilhouetteProps> = ({
  className = 'w-full h-full',
  alt = 'Uncalibrated carapace silhouette',
}) => {
  return (
    <svg
      viewBox={LOBSTER_PORTRAIT_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      className={`select-none pointer-events-none ${className}`}
      data-testid="lobster-avatar-silhouette"
      data-avatar-slot="portrait"
      role="img"
      aria-label={alt}
    >
      <defs>
        <linearGradient id="sil-benthic-grad" x1="25%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%" stopColor="#1d5267" />
          <stop offset="45%" stopColor="#0e2d3a" />
          <stop offset="100%" stopColor="#030e14" />
        </linearGradient>
        <radialGradient id="sil-beacon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#00c3ff" />
          <stop offset="100%" stopColor="#00c3ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sil-ambient-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#00c3ff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#00c3ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Subtle ambient core aura */}
      <ellipse
        cx="50"
        cy={45}
        rx={34}
        ry={32}
        fill="url(#sil-ambient-glow)"
      />

      {/* 🦞 SENSORY ANTENNAE: Sweeping feelers and beacon nodes */}
      <g stroke="#00c3ff" strokeLinecap="round" fill="none">
        <path d={ANTENNA_LEFT} strokeWidth="3" strokeOpacity="0.85" />
        <path d={ANTENNA_RIGHT} strokeWidth="3" strokeOpacity="0.85" />
        <path d="M 42 28 C 39 10 30 -8 15 -21" stroke="#ffffff" strokeWidth="1.2" opacity="0.35" />
        <path d="M 58 28 C 61 10 70 -8 85 -21" stroke="#ffffff" strokeWidth="1.2" opacity="0.35" />
        <path d={ANTENNULE_LEFT} strokeWidth="2.2" strokeOpacity="0.6" />
        <path d={ANTENNULE_RIGHT} strokeWidth="2.2" strokeOpacity="0.6" />
      </g>

      {/* Sensory beacons with luminous white cores */}
      <circle cx="14" cy="-24" r="4.5" fill="url(#sil-beacon-glow)" />
      <circle cx="14" cy="-24" r="2" fill="#ffffff" />
      <circle cx="86" cy="-24" r="4.5" fill="url(#sil-beacon-glow)" />
      <circle cx="86" cy="-24" r="2" fill="#ffffff" />
      <circle cx="38" cy="-5" r="2.4" fill="#ffffff" opacity="0.85" />
      <circle cx="62" cy="-5" r="2.4" fill="#ffffff" opacity="0.85" />

      {/* 🦞 CARAPACE DOME TORSO */}
      <g
        fill="url(#sil-benthic-grad)"
        stroke="#00c3ff"
        strokeWidth="1.2"
        strokeOpacity="0.45"
        strokeLinejoin="round"
      >
        <path d={DOME_BODY} />
      </g>
    </svg>
  )
}
