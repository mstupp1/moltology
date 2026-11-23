import React from 'react'
import { ArrowRight } from 'lucide-react'
import { GearIcon } from '@/components/hud/avatar3d/GearIcon'
import type { BenefitKit } from '@/lib/benefits/types'
import { collectionForKit } from '@/lib/gear/collections'
import { GEAR_PIECES } from '@/lib/gear/pieces'

/**
 * The shop collection made from this page's costume: its pieces and a link to try them on in the
 * shop. Guests can browse the shop, so the link works signed out too.
 */
export function WearTheLook({ kit }: { kit: BenefitKit }) {
  const collection = collectionForKit(kit)
  if (!collection) return null
  const pieces = GEAR_PIECES.filter((p) => p.collection === collection.id)
  if (!pieces.length) return null
  const href = `/character/shop?collection=${collection.id}`
  return (
    <section aria-labelledby="wear-the-look-title" className="mt-14 rounded-card border border-line-subtle bg-surface-1 p-5 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="eyebrow">Wear the look</p>
          <h3 id="wear-the-look-title" className="mt-3 font-grotesk text-xl sm:text-2xl font-semibold tracking-tight text-ink">
            {collection.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-body">
            {collection.blurb} Dress your character in it, piece by piece or as a set at {collection.discountPercent}% off.
          </p>
        </div>
        <a
          href={href}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-control border border-line bg-surface-2 px-4 text-sm font-semibold text-ink hover:border-line-strong transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          Try it on in the shop
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {pieces.map((p) => (
          <li key={p.key}>
            <a
              href={href}
              className="group flex h-full flex-col items-center gap-2 rounded-control border border-line-subtle bg-abyss/60 p-3 text-center hover:border-line transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <GearIcon appearanceKey={p.key} className="w-20 h-20 sm:w-24 sm:h-24" />
              <span className="text-xs font-semibold text-ink leading-snug">{p.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
