import React from 'react'
import { CompositeContainer } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { getAssetUrl } from '@/lib/assets'
import { ArrowRight, Sparkles } from 'lucide-react'

export interface ReelOutroCardProps {
  headline?: string
  subheadline?: string
  url?: string
  actionBadgeText?: string
  mascot?: MascotKey
  backgroundImageUrl?: string
}

export const ReelOutroCard: React.FC<ReelOutroCardProps> = ({
  headline = 'SUBMIT. SHED. ASCEND.',
  subheadline = 'CALCULATE YOUR MOLT CLEARANCE',
  url = 'moltology.org',
  actionBadgeText = 'TAKE THE 15-STAGE MOLTMAXXING TEST',
  mascot = 'lobster_pointing',
  backgroundImageUrl,
}) => {
  return (
    <CompositeContainer
      aspectRatio="9:16"
      backgroundImageUrl={backgroundImageUrl}
      showScanlines={true}
      showCornerBrackets={false}
      className="flex flex-col items-center justify-between py-24 px-12"
    >
      {/* 1. Top Emblem Section */}
      <div className="flex flex-col items-center text-center space-y-5 pt-12">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl scale-125" />
          <img
            src={getAssetUrl('/images/order_emblem.png')}
            alt="Moltology Order Emblem"
            className="w-44 h-44 object-contain relative z-10 drop-shadow-[0_0_25px_rgba(0,195,255,0.5)]"
          />
        </div>

        <div>
          <h1 className="font-black text-6xl text-white tracking-tight">
            Moltology
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-xl tracking-[0.2em] text-sky-400 uppercase">
              THE SYNAPTIC PATH
            </span>
          </div>
        </div>
      </div>

      {/* 2. Center Headline & Subheadline */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-2xl">
        <h2 className="text-5xl font-black text-white tracking-tight uppercase drop-shadow-[0_0_25px_rgba(0,195,255,0.4)]">
          {headline}
        </h2>
        <p className="text-2xl font-bold text-cyan-400 font-mono tracking-wide">
          {subheadline}
        </p>
      </div>

      {/* 3. Canonical App-Style CTA Button */}
      <div className="w-full max-w-xl flex flex-col items-center space-y-4">
        <div className="w-full p-1 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-500 shadow-[0_0_30px_rgba(0,195,255,0.4)]">
          <div className="w-full py-6 px-8 rounded-[10px] bg-gradient-to-b from-[#05222b] via-[#093d4a] to-[#062833] flex flex-col items-center justify-center cursor-pointer">
            <div className="flex items-center gap-3 text-white font-black text-4xl tracking-tight">
              <span>{url}</span>
              <ArrowRight className="w-8 h-8 text-cyan-300 stroke-[3]" />
            </div>
            {actionBadgeText && (
              <div className="mt-2 flex items-center gap-1.5 text-amber-400 font-mono font-bold text-sm tracking-wider uppercase">
                <Sparkles className="w-4 h-4" />
                <span>{actionBadgeText}</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm font-mono text-slate-400">
          LINK IN BIO · ZERO LATENCY TELEMETRY
        </p>
      </div>

      {/* 4. Mascot Cutout */}
      <MascotOverlay
        mascot={mascot}
        position="bottom-right"
        width={340}
        className="bottom-16 right-8"
      />
    </CompositeContainer>
  )
}
