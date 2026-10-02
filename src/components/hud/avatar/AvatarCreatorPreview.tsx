import React from 'react'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { LobsterAvatarFullBody } from '../LobsterAvatarFullBody'
import { LobsterAvatarPortrait } from '../LobsterAvatarPortrait'

export interface AvatarCreatorPreviewProps {
  config: LobsterAvatarConfig
  className?: string
}

/**
 * Live creator preview: the animated full body, with the static portrait inset
 * so members see how they will look in forums and member lists while they edit.
 */
export const AvatarCreatorPreview: React.FC<AvatarCreatorPreviewProps> = ({ config, className = '' }) => (
  <div className={`relative w-full ${className}`} data-testid="avatar-creator-preview">
    <LobsterAvatarFullBody config={config} size={360} alt="Your character" className="w-full aspect-square rounded-xl" />
    <div className="absolute bottom-2 right-2 flex flex-col items-center gap-1 rounded-xl bg-[#020810]/80 border border-white/10 p-1.5 backdrop-blur-sm">
      <LobsterAvatarPortrait config={config} size={128} alt="Your portrait" className="w-14 h-14 sm:w-16 sm:h-16" />
      <span className="text-[9px] font-sans text-[#9bbbbb]">Portrait</span>
    </div>
  </div>
)
