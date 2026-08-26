import React, { useEffect, useState } from 'react'
import {
  generateLobsterAvatarDataUri,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
import { LobsterAvatarDisplay } from '../LobsterAvatarDisplay'

export interface LobsterAvatarPreviewProps {
  config: LobsterAvatarConfig | null
  size?: number
  className?: string
  containerClassName?: string
  alt?: string
  maskRadial?: boolean
}

/**
 * Client-only DiceBear preview — generates SVG data URI after mount (SSR-safe).
 */
export const LobsterAvatarPreview: React.FC<LobsterAvatarPreviewProps> = ({
  config,
  size = 256,
  className = 'w-full h-full object-contain',
  containerClassName = '',
  alt = 'Avatar preview',
  maskRadial = false,
}) => {
  const [dataUri, setDataUri] = useState<string | null>(null)

  useEffect(() => {
    if (!config) {
      setDataUri(null)
      return
    }
    const uri = generateLobsterAvatarDataUri(config, size)
    setDataUri(uri)
  }, [config, size])

  if (!config || !dataUri) {
    return (
      <div
        className={`flex items-center justify-center bg-[#050808] border border-dashed border-[#3a4a49] rounded-2xl ${containerClassName} ${className}`}
        aria-hidden
      >
        <span className="text-[10px] uppercase tracking-wider text-[#4a5a59] text-center px-2">
          No avatar
        </span>
      </div>
    )
  }

  return (
    <LobsterAvatarDisplay
      src={dataUri}
      alt={alt}
      maskRadial={maskRadial}
      containerClassName={`rounded-2xl overflow-hidden flex items-center justify-center ${containerClassName}`}
      className={className}
    />
  )
}
