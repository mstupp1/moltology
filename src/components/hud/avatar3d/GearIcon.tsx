import React from 'react'
import { gearStill } from '@/lib/avatar3d-gear-icon'
import { cn } from '@/lib/utils'
import { CharacterStill } from './CharacterStill'

export interface GearIconProps {
  /** The item's appearance key (or slug). */
  appearanceKey: string | null | undefined
  /** Size and placement; the icon fills this box. */
  className?: string
  imgClassName?: string
  alt?: string
  /** Shown when the key has no 3D build. */
  fallback?: React.ReactNode
}

/** A gear item in 3D, worn on a plain mannequin and seen close up. */
export function GearIcon({ appearanceKey, className, imgClassName, alt = '', fallback = null }: GearIconProps) {
  const still = gearStill(appearanceKey)
  if (!still) return <>{fallback}</>
  return (
    <span className={cn('relative inline-block shrink-0', className)} data-testid="gear-icon">
      <CharacterStill config={still.config} px={128} shot={still.shot} alt={alt} imgClassName={cn('object-contain', imgClassName)} placeholder={<span />} />
    </span>
  )
}
