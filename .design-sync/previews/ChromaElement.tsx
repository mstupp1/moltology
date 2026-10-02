import React from 'react'
import { ChromaElement } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)
const S3 = "https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images"

export const GlowColors = () => (
  <Deep>
    <div className="grid grid-cols-3 gap-4 w-[520px]">
      <ChromaElement src={`${S3}/order_emblem.webp`} alt="Order emblem" glowColor="cyan" />
      <ChromaElement src={`${S3}/order_emblem.webp`} alt="Order emblem" glowColor="crimson" />
      <ChromaElement src={`${S3}/order_emblem.webp`} alt="Order emblem" glowColor="gold" />
    </div>
  </Deep>
)

export const Plain = () => (
  <Deep>
    <div className="w-48"><ChromaElement src={`${S3}/order_emblem.webp`} alt="Order emblem" glowColor="none" blendMode="normal" terminalEffects={false} hoverScale={false} /></div>
  </Deep>
)

export const RadialMaskPulse = () => (
  <Deep>
    <div className="w-64"><ChromaElement src={`${S3}/hero_card_chitin_hardening.webp`} alt="Chitin hardening" maskRadial pulse /></div>
  </Deep>
)
