import React from 'react'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { LobsterAvatarFullBody } from '../LobsterAvatarFullBody'
import { LobsterAvatarPortrait } from '../LobsterAvatarPortrait'

export interface AvatarCreatorPreviewProps {
  config: LobsterAvatarConfig
  className?: string
  /** 3D only: the gear slot the camera features, or null for the whole figure. */
  focus?: string | null
  onResetFocus?: () => void
  /** On small screens, stand the portrait beside the character instead of over its corner. */
  portraitBeside?: boolean
}

/**
 * Live creator preview: the animated full body, with the static portrait inset
 * so members see how they will look in forums and member lists while they edit.
 */
export const AvatarCreatorPreview: React.FC<AvatarCreatorPreviewProps> = ({ config, className = '', focus = null, onResetFocus, portraitBeside = false }) => (
  <div className={`relative w-full ${className}`} data-testid="avatar-creator-preview">
    <LobsterAvatarFullBody
      config={config}
      size={360}
      alt="Your character"
      className="w-full aspect-square rounded-card"
      focus={focus}
      onResetFocus={onResetFocus}
    />
    <div
      className={`absolute flex flex-col items-center gap-1 rounded-card bg-abyss/80 border border-line-subtle p-1.5 backdrop-blur-sm ${
        portraitBeside ? 'max-lg:bottom-0 max-lg:left-full max-lg:ml-2 lg:bottom-2 lg:right-2' : 'bottom-2 right-2'
      }`}
    >
      <LobsterAvatarPortrait config={config} size={128} alt="Your portrait" className="w-14 h-14 sm:w-16 sm:h-16" />
      <span className="text-[11px] font-sans text-ink-muted">Portrait</span>
    </div>
  </div>
)
