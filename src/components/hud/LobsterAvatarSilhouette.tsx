import React from 'react'
import {
  LOBSTER_PORTRAIT_VIEWBOX,
  SILHOUETTE_MARKUP,
  type LobsterAvatarFrame,
} from '../../lib/lobster-avatar'

export interface LobsterAvatarSilhouetteProps {
  className?: string
  alt?: string
  frame?: LobsterAvatarFrame
}

/**
 * Placeholder shown before a member makes a character: a plain carapace dome with antennae,
 * sized like a real portrait's head so it fills the porthole the same way. Draws the same
 * markup as generateLobsterAvatarSilhouetteSvg, so the image and component versions match.
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
      // Static, code-owned markup (no user input).
      dangerouslySetInnerHTML={{ __html: SILHOUETTE_MARKUP }}
    />
  )
}
