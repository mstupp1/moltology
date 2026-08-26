import React from 'react'
import { ChromaElement } from '@/components/ui'

export interface LobsterAvatarDisplayProps {
  src: string
  alt?: string
  containerClassName?: string
  className?: string
  maskRadial?: boolean
}

/** DiceBear avatar with HUD terminal FX — scanlines, grain, cyan glow. */
export const LobsterAvatarDisplay: React.FC<LobsterAvatarDisplayProps> = ({
  src,
  alt = 'Your avatar',
  containerClassName = '',
  className = 'w-full h-full object-cover',
  maskRadial = true,
}) => (
  <ChromaElement
    src={src}
    alt={alt}
    blendMode="normal"
    glowColor="cyan"
    maskRadial={maskRadial}
    containerClassName={containerClassName}
    className={className}
  />
)
