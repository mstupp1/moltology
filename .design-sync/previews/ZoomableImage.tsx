import React from 'react'
import { ZoomableImage } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)
const S3 = "https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images"

export const Default = () => (
  <Deep>
    <div className="w-80">
      <ZoomableImage src={`${S3}/hero_card_benthic_core.webp`} alt="The Benthic Core" zoomTitle="The Benthic Core" zoomSubtitle="Stage 1 · Larval" zoomDescription="Where every molt begins." className="w-full" />
    </div>
  </Deep>
)

export const CustomBadge = () => (
  <Deep>
    <div className="w-64">
      <ZoomableImage src={`${S3}/hero_card_chitin_hardening.webp`} alt="Chitin Hardening" overlayBadgeText="View full size" className="w-full" />
    </div>
  </Deep>
)
