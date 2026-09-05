/**
 * CAMPAIGN MATERIAL
 * Public-awareness and recruitment plates issued by Maritime Defense Command.
 */
import React from 'react'
import { Megaphone } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { PROPAGANDA_CARDS, type PropagandaCard } from './data'
import { MaritimeHeading } from './primitives'

const CampaignPlate: React.FC<{ card: PropagandaCard }> = ({ card }) => {
  const Icon = card.icon
  return (
    <article
      className={`group relative flex h-[340px] w-[248px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br p-5 shadow-xl transition-transform duration-300 hover:-translate-y-1.5 hover:rotate-[-1.2deg] motion-reduce:transition-none motion-reduce:hover:transform-none sm:w-[268px] ${card.gradient}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.13] mix-blend-overlay"
        style={{
          backgroundImage: `url(${getAssetUrl('/images/chitin_texture_bg.jpg')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(255,255,255,0.22),transparent_60%)]"
      />

      <div className="relative flex items-center justify-between">
        <span className="rounded-sm border border-white/40 px-2 py-0.5 font-grotesk text-[9px] font-black uppercase tracking-[0.2em] text-white/90">
          {card.series}
        </span>
        <Icon className="h-5 w-5 text-white/70" aria-hidden="true" />
      </div>

      <p className="relative font-grotesk text-[1.4rem] font-black uppercase leading-[1.02] tracking-tight text-white drop-shadow">
        {card.headline}
      </p>

      <div className="relative space-y-2 border-t border-white/25 pt-3">
        <p className="text-[10px] leading-snug text-white/80">{card.support}</p>
        <div className="flex items-center justify-between">
          <img
            src={getAssetUrl('/images/order_emblem.png')}
            alt=""
            aria-hidden="true"
            className="h-6 w-6 object-contain opacity-80"
          />
          <span className="font-grotesk text-[9px] font-bold uppercase tracking-[0.2em] text-white/80">
            {card.serial}
          </span>
        </div>
      </div>
    </article>
  )
}

export const PropagandaWall: React.FC = () => (
  <section aria-labelledby="mdc-campaign-material" className="space-y-10">
    <MaritimeHeading
      id="mdc-campaign-material"
      eyebrow="PUBLIC AWARENESS · PLATE SERIES MDC-P"
      eyebrowIcon={Megaphone}
      title="CAMPAIGN MATERIAL"
      subtitle="Issued to every reef installation, break room, and burrow entrance under Command."
    />

    <div className="-mx-6 sm:-mx-12">
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto touch-pan-scroll no-scrollbar px-6 pb-4 sm:px-12">
        {PROPAGANDA_CARDS.map((card) => (
          <CampaignPlate key={card.id} card={card} />
        ))}
      </div>
    </div>

    <p className="text-center text-[10px] uppercase tracking-[0.22em] text-slate-400">
      SCROLL FOR THE FULL SERIES · SIX PLATES IN CIRCULATION
    </p>
  </section>
)
