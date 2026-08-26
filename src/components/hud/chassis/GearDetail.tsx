import React from 'react'
import type { CatalogRef } from '@/lib/chassis-loadout'
import { GearTooltip } from './GearTooltip'

export interface GearDetailProps {
  catalog: CatalogRef
  className?: string
}

export const GearDetail: React.FC<GearDetailProps> = ({ catalog, className = '' }) => {
  return <GearTooltip catalog={catalog} className={className} />
}
