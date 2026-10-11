import React from 'react'
import { CompositeContainer } from './CompositeContainer'
import { isCrabMascot } from '@/lib/mascots'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { getAssetUrl } from '@/lib/assets'
import { displayCopy } from '@/lib/composite-copy'
import { CompositeBrand, CompositeCta, CompositeHeadline, CompositeLabel } from './CompositeKit'

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
  headline = 'Submit. Shed. Ascend.',
  subheadline = 'Calculate your molt clearance',
  url = 'moltology.org',
  actionBadgeText = 'Take the 15-stage Moltmaxxing test',
  linkInBioText = 'LINK IN BIO',
  ctaTexture = 'chitin',
  mascot = 'lobster_thumbs_up',
  backgroundImageUrl,
}) => {
  const formattedLinkInBio =
    (linkInBioText || 'LINK IN BIO').replace(/(\s*·\s*)?TAP TO AUDIT/gi, '').trim() || 'LINK IN BIO'

  const resolvedTexturePath = ctaTexture && ctaTexture !== 'none' ? CTA_TEXTURE_MAP[ctaTexture] || CTA_TEXTURE_MAP.chitin : ''
  const textureUrl = resolvedTexturePath ? getAssetUrl(resolvedTexturePath) : ''

  const hasMascot = Boolean(mascot && mascot !== 'none')

  return (
    <CompositeContainer aspectRatio="9:16" backgroundImageUrl={backgroundImageUrl} vignette="subsea">
      {/* Content sits in the upper safe area: Reels UI covers the bottom fifth and the mascot owns the corner. */}
      <div className="relative flex h-full w-full flex-col items-center px-6 pb-[300px] pt-36 text-center">
        <CompositeBrand size="lg" stacked />

        <div className="mt-24 flex max-w-[900px] flex-col items-center">
          <CompositeHeadline lines={[headline]} size={104} align="center" />
          <p className="mt-6 text-[40px] font-medium leading-tight text-cyan-glow [text-wrap:balance]">
            {displayCopy(subheadline)}
          </p>
        </div>

        <div className="mt-16 flex w-full max-w-[860px] flex-col items-center">
          <CompositeCta size="xl" className="w-full">
            <span className={url.length > 28 ? 'text-[36px]' : ''}>{url}</span>
          </CompositeCta>
          {actionBadgeText && (
            <p className="mt-6 text-[30px] font-medium text-ink-body">{displayCopy(actionBadgeText)}</p>
          )}
          <CompositeLabel tone="neutral" className="mt-6 text-[22px]">
            {formattedLinkInBio}
          </CompositeLabel>
        </div>

        {hasMascot && (
          <MascotOverlay
            mascot={mascot}
            glow={false}
            position="bottom-right"
            width={isCrabMascot(mascot) ? 440 : 380}
            className={isCrabMascot(mascot) ? '-bottom-2 right-0 z-30' : '-bottom-20 right-0 z-30'}
          />
        )}
      </div>
    </CompositeContainer>
  )
}
