import React from 'react'
import { CompositeContainer } from './CompositeContainer'
import { CompositeBrand, CompositeCta } from './CompositeKit'

export interface ReelSimpleOutroCardProps {
  url?: string
  backgroundImageUrl?: string
}

export const ReelSimpleOutroCard: React.FC<ReelSimpleOutroCardProps> = ({
  url = 'moltology.org',
  backgroundImageUrl,
}) => {
  return (
    <CompositeContainer aspectRatio="9:16" backgroundImageUrl={backgroundImageUrl} vignette="subsea">
      {/* Centered in the area the Reels UI leaves clear. */}
      <div className="flex h-full w-full flex-col items-center justify-center gap-24 px-10 pb-[220px] text-center">
        <CompositeBrand size="lg" stacked className="scale-125" />
        <CompositeCta size="xl" className="w-full max-w-[820px]">
          {url}
        </CompositeCta>
      </div>
    </CompositeContainer>
  )
}
