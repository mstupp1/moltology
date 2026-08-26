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
  size = 192,
  className = 'w-full h-full object-cover',
  containerClassName = '',
  alt = 'Avatar preview',
  maskRadial = true,
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
        className={`flex items-center justify-center bg-[#050808] border border-dashed border-[#3a4a49] rounded-full ${containerClassName} ${className}`}
        style={{ width: size, height: size }}
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
      containerClassName={`rounded-full overflow-hidden ${containerClassName}`}
      className={className}
    />
  )
}
