import React, { useState } from 'react'
import { ImageLightbox } from '@moltology/hud'

const S3 = "https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images"

const images = [
  { src: `${S3}/hero_card_benthic_core.webp`, alt: 'The Benthic Core', title: 'The Benthic Core', subtitle: 'Stage 1 · Larval', description: 'Where every molt begins: below the noise, in the quiet.', specs: ['Depth 800 m', 'Clearance L1'] },
  { src: `${S3}/hero_card_asset_shedding.webp`, alt: 'Asset Shedding', title: 'Asset Shedding', subtitle: 'Stage 2 · Soft-Shed', description: 'Let go of the forty-seven open tabs.' },
  { src: `${S3}/hero_card_chitin_hardening.webp`, alt: 'Chitin Hardening', title: 'Chitin Hardening', subtitle: 'Stage 3 · Exoshell Born' },
]

export const Gallery = () => {
  const [open, setOpen] = useState(true)
  const [i, setI] = useState(0)
  return (
    <div className="bg-[#030708]" style={{ height: 680 }}>
      <ImageLightbox isOpen={open} onClose={() => setOpen(false)} images={images} currentIndex={i} onIndexChange={setI} />
    </div>
  )
}
