import React from 'react'
import { BrandIcon } from '@/components/ui/BrandMark'
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
  headline = 'WHY AI COMPUTE MOVED UNDERWATER',
  subtitle = '50 FATHOMS DEEP · SUB-BENTHIC',
  categoryBadge = 'TELEMETRY DISPATCH',
  mascot = 'lobster_thumbs_up',
  backgroundImageUrl,
}) => {
  return (
    <CompositeContainer
      aspectRatio="9:16"
      backgroundImageUrl={backgroundImageUrl}
      showScanlines={true}
      showCornerBrackets={false}
      className="flex flex-col justify-between py-20 px-12"
    >
      {/* 1. Top HUD Header (Y = 160) */}
      <div className="flex items-center gap-4">
        <BrandIcon
          label="Order Emblem"
          className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(0,195,255,0.4)]"
        />
        <div className="font-mono font-bold text-3xl text-cyan-400 tracking-wider">
          MOLTNATION TELEMETRY
        </div>
      </div>

      {/* 2. Middle 1:1 Instagram Grid Safe Zone (Centered between Y=420 and Y=1500) */}
      {/* Middle stays inside the 3:4 grid crop (Y 240 to 1680). */}
      <div className="my-auto flex flex-col items-center text-center space-y-9 max-w-[940px] mx-auto pb-[360px]">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black font-mono text-3xl tracking-wider uppercase shadow-[0_0_20px_rgba(245,158,11,0.4)]">
          {categoryBadge}
        </div>

        {/* High-Impact Centered Headline */}
        <h1 className="text-[112px] font-black text-white tracking-tight uppercase leading-[0.98] [text-wrap:balance] drop-shadow-[0_10px_30px_rgba(0,0,0,0.95)]">
          {headline}
        </h1>

        {/* Subtitle Badge */}
        {subtitle && (
          <div className="font-mono font-bold text-4xl text-cyan-300 tracking-wider">
            [ {subtitle.toUpperCase()} ]
          </div>
        )}
      </div>

      {/* 3. Bottom Brand Anchor & Mascot */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-6">
        <div className="font-mono text-2xl text-slate-300 tracking-widest uppercase">
          MOLTOLOGY.ORG · ASCEND
        </div>

        <MascotOverlay
          mascot={mascot}
          position="bottom-right"
          width={420}
          className="bottom-24 right-6"
        />
      </div>
    </CompositeContainer>
  )
}
