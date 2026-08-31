import React from 'react'
import { CompositeContainer } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { getAssetUrl } from '@/lib/assets'
import { ArrowRight, Sparkles } from 'lucide-react'

export type CtaTextureKey = 'chitin' | 'hex' | 'alloy' | 'carbon' | 'basalt' | 'circuit' | 'none'

export const CTA_TEXTURE_MAP: Record<CtaTextureKey, string> = {
  chitin: '/images/chitin_texture_bg.webp',
  hex: '/images/pbr_hex_lattice.webp',
  alloy: '/images/pbr_benthic_alloy.webp',
  carbon: '/images/pbr_carbon_weave.webp',
  basalt: '/images/pbr_deep_basalt.webp',
  circuit: '/images/pbr_circuit_matrix.webp',
  none: '',
}

export interface ReelOutroCardProps {
  headline?: string
  subheadline?: string
  url?: string
  actionBadgeText?: string
  linkInBioText?: string
  ctaTexture?: CtaTextureKey
  mascot?: MascotKey
  backgroundImageUrl?: string
}

export const ReelOutroCard: React.FC<ReelOutroCardProps> = ({
  headline = 'SUBMIT. SHED. ASCEND.',
  subheadline = 'CALCULATE YOUR MOLT CLEARANCE',
  url = 'moltology.org',
  actionBadgeText = '⚡ TAKE THE 15-STAGE MOLTMAXXING TEST',
  linkInBioText = 'LINK IN BIO',
  ctaTexture = 'chitin',
  mascot = 'lobster_thumbs_up',
  backgroundImageUrl,
}) => {
  const formattedLinkInBio =
    (linkInBioText || 'LINK IN BIO').replace(/(\s*·\s*)?TAP TO AUDIT/gi, '').trim() || 'LINK IN BIO'

  const resolvedTexturePath = ctaTexture && ctaTexture !== 'none' ? CTA_TEXTURE_MAP[ctaTexture] || CTA_TEXTURE_MAP.chitin : ''
  const textureUrl = resolvedTexturePath ? getAssetUrl(resolvedTexturePath) : ''

  return (
    <CompositeContainer
      aspectRatio="9:16"
      backgroundImageUrl={backgroundImageUrl}
      showScanlines={true}
      showCornerBrackets={false}
    >
      <div className="w-full h-full flex flex-col items-center justify-center text-center px-8 relative">
        {/* Main Content Group (Vertically Centered, Base Content Layer) */}
        <div className="w-full max-w-3xl flex flex-col items-center text-center relative z-10">
          {/* 1. Top Emblem & Moltology Brand Section */}
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

          {/* 2. Center Headline & Subheadline (Balanced & No Orphan Words) */}
          <div className="mt-10 flex flex-col items-center text-center space-y-3.5 max-w-2xl px-4">
            <h2 className="text-6xl font-black text-white tracking-tight uppercase leading-[1.12] drop-shadow-[0_0_25px_rgba(0,195,255,0.45)] whitespace-pre-line [text-wrap:balance]">
              {headline}
            </h2>
            <p className="text-3xl font-bold text-[#00c3ff] font-mono tracking-wider uppercase drop-shadow-[0_0_12px_rgba(0,195,255,0.35)] whitespace-pre-line [text-wrap:balance]">
              {subheadline}
            </p>
          </div>

          {/* 3. Canonical App-Style HUD CTA Button with Selected Molting Texture */}
          <div className="mt-8 w-full max-w-[700px] flex flex-col items-center space-y-3.5 mx-auto">
            <div className="w-full p-[1.5px] rounded-2xl bg-gradient-to-r from-[#00c3ff] via-[#38bdf8] to-[#00c3ff] shadow-[0_0_30px_rgba(0,195,255,0.5),inset_0_0_15px_rgba(0,195,255,0.25)]">
              <div
                className="w-full py-5 px-8 rounded-[14px] bg-cover bg-center flex flex-col items-center justify-center relative overflow-hidden border border-cyan-400/40 cursor-pointer"
                style={{
                  backgroundImage: textureUrl
                    ? `linear-gradient(to bottom, rgba(5, 34, 43, 0.82), rgba(9, 61, 74, 0.78), rgba(6, 40, 51, 0.88)), url('${textureUrl}')`
                    : `linear-gradient(to bottom, #05222b, #093d4a, #062833)`,
                }}
              >
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-white/25 pointer-events-none" />
                <div className="flex items-center justify-center gap-3 text-white font-black text-5xl tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                  <span>{url}</span>
                  <ArrowRight className="w-9 h-9 text-cyan-300 stroke-[3.5] drop-shadow-[0_0_10px_rgba(0,195,255,0.8)]" />
                </div>
                {actionBadgeText && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-amber-400 font-mono font-bold text-lg tracking-wider uppercase drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                    <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                    <span>{actionBadgeText}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-base font-mono font-bold tracking-[0.25em] text-slate-400 uppercase">
              {formattedLinkInBio}
            </p>
          </div>
        </div>

        {/* Ambient Cyan Mascot Bloom (Underneath CTA & Content Layer) */}
        {mascot && mascot !== 'none' && (
          <div className="absolute -bottom-16 -right-16 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(0,195,255,0.18)_0%,rgba(0,195,255,0.06)_40%,transparent_70%)] blur-3xl pointer-events-none z-0" />
        )}

        {/* 4. Large Mascot Cutout with Ambient Contact Shadow (Top Layer over CTA) */}
        <MascotOverlay
          mascot={mascot}
          glow={false}
          position="bottom-right"
          width={460}
          className="-bottom-10 -right-4 z-30 pointer-events-none"
        />
      </div>
    </CompositeContainer>
  )
}

