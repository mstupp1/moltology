import React from 'react'
import {
  LOBSTER_PORTRAIT_VIEWBOX,
  SILHOUETTE_FIT,
  SILHOUETTE_PATHS as S,
  type LobsterAvatarFrame,
} from '../../lib/lobster-avatar'

export interface LobsterAvatarSilhouetteProps {
  className?: string
  alt?: string
  frame?: LobsterAvatarFrame
}

/**
 * Placeholder shown before a member makes a character: the default lobster's head, eyes,
 * antennae and shoulders in one benthic tone, framed like a real portrait so it sits
 * centred in every porthole without clipping. Shares its outline with
 * generateLobsterAvatarSilhouetteSvg, so the image and component versions match.
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
      </defs>
      <g transform={SILHOUETTE_FIT}>
      <g stroke="#00c3ff" strokeLinecap="round" strokeOpacity="0.7" strokeWidth="2.6" fill="none">
        <path d={S.antennaLeft} />
        <path d={S.antennaRight} />
      </g>
      <g fill="#00c3ff" fillOpacity="0.7">
        <circle {...S.tipLeft} />
        <circle {...S.tipRight} />
      </g>
      <g fill="url(#sil-benthic-grad)" stroke="#00c3ff" strokeWidth="1.4" strokeOpacity="0.5" strokeLinejoin="round">
        <path d={S.shoulders} />
        <path d={S.head} />
        <circle {...S.eyeLeft} />
        <circle {...S.eyeRight} />
      </g>
      <path d={S.glint} fill="#ffffff" fillOpacity="0.06" />
      <g fill="#00c3ff" fillOpacity="0.35">
        <circle {...S.pupilLeft} />
        <circle {...S.pupilRight} />
      </g>
      </g>
    </svg>
  )
}
