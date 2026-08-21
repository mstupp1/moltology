import React from 'react'
import { CompositeContainer } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { getAssetUrl } from '@/lib/assets'

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
  mascot = 'lobster_pointing',
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
        <img
          src={getAssetUrl('/images/order_emblem.png')}
          alt="Order Emblem"
          className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(0,195,255,0.4)]"
        />
        <div className="font-mono font-bold text-xl text-cyan-400 tracking-wider">
          MOLTNATION TELEMETRY
        </div>
      </div>

      {/* 2. Middle 1:1 Instagram Grid Safe Zone (Centered between Y=420 and Y=1500) */}
      <div className="my-auto flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto py-12">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black font-mono text-xl tracking-wider uppercase shadow-[0_0_20px_rgba(245,158,11,0.4)]">
          {categoryBadge}
        </div>

        {/* High-Impact Centered Headline */}
        <h1 className="text-6xl font-black text-white tracking-tight uppercase leading-[1.1] drop-shadow-[0_10px_30px_rgba(0,0,0,0.95)]">
          {headline}
        </h1>

        {/* Subtitle Badge */}
        {subtitle && (
          <div className="font-mono font-bold text-2xl text-slate-300 tracking-wider">
            [ {subtitle.toUpperCase()} ]
          </div>
        )}
      </div>

      {/* 3. Bottom Brand Anchor & Mascot */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-6">
        <div className="font-mono text-sm text-slate-400 tracking-widest uppercase">
          MOLTOLOGY.ORG · ASCEND
        </div>

        <MascotOverlay
          mascot={mascot}
          position="bottom-right"
          width={320}
          className="bottom-16 right-8"
        />
      </div>
    </CompositeContainer>
  )
}
