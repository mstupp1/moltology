/**
 * CRAB SOVEREIGNTY — THE SIX ARTICLES
 * Charter presentation for the Department of Aquatic Freedom.
 */
import React from 'react'
import { Scale, Stamp } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { MARITIME_SLOGANS, SOVEREIGNTY_ARTICLES, type SovereigntyArticle } from './data'
import { MaritimeHeading } from './primitives'

const ArticleCard: React.FC<{ item: SovereigntyArticle }> = ({ item }) => {
  const Icon = item.icon
  return (
    <article className="group relative flex h-full flex-col gap-3 rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="font-grotesk text-[10px] font-bold uppercase tracking-[0.24em] text-amber-700">
          {item.article}
        </span>
        <Icon className="h-4 w-4 text-amber-500 transition-colors group-hover:text-amber-600" aria-hidden="true" />
      </div>
      <h3 className="font-grotesk text-sm sm:text-base font-bold uppercase leading-snug tracking-tight text-sky-900">
        {item.title}
      </h3>
      <p className="text-xs sm:text-[13px] leading-relaxed text-slate-500">{item.text}</p>
    </article>
  )
}

export const CrabSovereignty: React.FC = () => (
  <section aria-labelledby="mdc-crab-sovereignty" className="space-y-10">
    <MaritimeHeading
      id="mdc-crab-sovereignty"
      eyebrow="DIV-06 · DEPARTMENT OF AQUATIC FREEDOM"
      eyebrowIcon={Scale}
      title={MARITIME_SLOGANS.sovereignty}
      subtitle="Six articles. Adopted in full, amended never, and enforced at every reef installation under Command."
    />

    <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-[#fffaf0] shadow-xl shadow-amber-100/60">
      {/* Charter masthead */}
      <div className="relative border-b border-amber-100 px-6 sm:px-10 py-8 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url(${getAssetUrl('/images/chitin_texture_bg.jpg')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative space-y-3">
          <img
            src={getAssetUrl('/images/order_emblem.png')}
            alt=""
            aria-hidden="true"
            className="mx-auto h-12 w-12 object-contain opacity-90"
          />
          <p className="font-grotesk text-[10px] font-bold uppercase tracking-[0.28em] text-amber-700">
            CHARTER OF FUNDAMENTAL CLAW LIBERTIES
          </p>
          <p className="mx-auto max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-600">
            Every crustacean under Moltology protection holds the following rights from the moment of first
            calcification. They are not granted by this organization. They are recognized by it.
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-6 sm:p-10 md:grid-cols-2 xl:grid-cols-3">
        {SOVEREIGNTY_ARTICLES.map((item) => (
          <ArticleCard key={item.id} item={item} />
        ))}
      </div>

      {/* Ratification footer */}
      <div className="flex flex-col items-center gap-3 border-t border-amber-100 px-6 sm:px-10 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          RATIFIED BY THE HIGH SYNOD · REVIEWED ANNUALLY · NEVER SHORTENED
        </p>
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-amber-300 bg-amber-50 px-3 py-1 font-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800">
          <Stamp className="h-3.5 w-3.5" aria-hidden="true" />
          NON-NEGOTIABLE
        </span>
      </div>
    </div>
  </section>
)
