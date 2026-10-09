import React from 'react'
import { displayCopy } from '@/lib/composite-copy'
import { CompositeBrand, CompositeHeadline, CompositeLabel, CompositePill } from './CompositeKit'
import { CompositeContainer } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'

export interface ReelThumbnailCardProps {
  headline?: string
  subtitle?: string
  categoryBadge?: string
  mascot?: MascotKey
  backgroundImageUrl?: string
}

export const ReelThumbnailCard: React.FC<ReelThumbnailCardProps> = ({
  headline = 'Why AI compute moved underwater',
  subtitle = '50 fathoms deep',
  categoryBadge = 'Telemetry dispatch',
  mascot = 'lobster_thumbs_up',
  backgroundImageUrl,
}) => {
  return (
    <CompositeContainer aspectRatio="9:16" backgroundImageUrl={backgroundImageUrl} vignette="subsea">
      <div className="flex items-center justify-between">
        <CompositeBrand size="md" />
      </div>

      {/* Middle stays inside the 3:4 grid crop (Y 240 to 1680). */}
      <div className="mx-auto my-auto flex max-w-[940px] flex-col items-center pb-[380px] text-center">
        <CompositePill tone="crimson" className="self-center text-[30px]">
          {categoryBadge}
        </CompositePill>
        <CompositeHeadline lines={[headline]} size={112} align="center" className="mt-10" />
        {subtitle && <p className="mt-8 text-[38px] font-medium text-cyan-glow">{displayCopy(subtitle)}</p>}
      </div>

      <CompositeLabel tone="neutral" className="text-[22px]">
        moltology.org
      </CompositeLabel>

      <MascotOverlay mascot={mascot} position="bottom-right" width={420} glow={false} className="bottom-20 right-8" />
    </CompositeContainer>
  )
}
