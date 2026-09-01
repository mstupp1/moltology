import React from 'react'
import { CompositeContainer } from './CompositeContainer'
import { getAssetUrl } from '@/lib/assets'

export interface ReelSimpleOutroCardProps {
  url?: string
  backgroundImageUrl?: string
}

export const ReelSimpleOutroCard: React.FC<ReelSimpleOutroCardProps> = ({
  url = 'moltology.org',
  backgroundImageUrl,
}) => {
  return (
    <CompositeContainer
      aspectRatio="9:16"
      backgroundImageUrl={backgroundImageUrl}
      showScanlines={true}
      showCornerBrackets={false}
    >
      <div className="w-full h-full flex flex-col items-center justify-center text-center px-10 relative">
        {/* Ambient Cyan Central Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,rgba(0,195,255,0.14)_0%,rgba(0,195,255,0.03)_50%,transparent_75%)] blur-3xl" />
        </div>

        {/* Main Content Group (Vertically Centered) */}
        <div className="w-full max-w-3xl flex flex-col items-center text-center relative z-10 space-y-12">
          {/* 1. Top Emblem & Moltology Brand Section (Exact match with ReelOutroCard) */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl scale-125 pointer-events-none" />
              <img
                src={getAssetUrl('/images/order_emblem.png')}
                alt="Moltology Order Emblem"
                className="w-44 h-44 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(0,195,255,0.5)]"
              />
            </div>

            <div>
              <h1 className="font-sans font-black text-6xl text-white tracking-tight drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">
                Moltology
              </h1>
              <div className="mt-2 flex items-center justify-center">
                <span className="font-sans font-bold text-2xl tracking-[0.25em] text-[#38bdf8] uppercase drop-shadow-[0_0_10px_rgba(0,195,255,0.5)]">
                  THE SYNAPTIC PATH
                </span>
              </div>
            </div>
          </div>

          {/* 3. Pure Minimalist CTA Button (Just moltology.org) */}
          <div className="w-full max-w-[580px] pt-4">
            <div className="w-full p-[1.5px] rounded-2xl bg-gradient-to-r from-[#00c3ff]/80 via-[#38bdf8] to-[#00c3ff]/80 shadow-[0_0_35px_rgba(0,195,255,0.45),inset_0_0_15px_rgba(0,195,255,0.2)]">
              <div className="w-full py-6 px-10 rounded-[14px] bg-gradient-to-b from-[#05222b]/95 via-[#093d4a]/90 to-[#062833]/95 flex items-center justify-center relative overflow-hidden border border-cyan-400/50 backdrop-blur-md">
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-white/30 pointer-events-none" />
                <span className="text-white font-black text-5xl tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                  {url}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CompositeContainer>
  )
}
