import React from 'react'
import { GearIcon } from '@/components/hud/avatar3d/GearIcon'
import { Check } from 'lucide-react'
import { HudBadge } from '@/components/ui/HudBadge'
import { CATEGORY_LABELS } from '@/lib/chassis-loadout'
import { RARITY_LABELS } from '@/lib/gear-variants'
import type { MarketPiece, MarketVariant } from '@/lib/market'
import {
  MARKET_BUNDLES,
  MARKET_FEATURED,
  bundlePrice,
  type MarketBundle,
  type PieceRef,
} from '@/lib/market-featured'
import { cn } from '@/lib/utils'
import { GemAmount } from './MarketCurrencyBar'
import { RARITY_FRAME } from './market-rarity'

export interface ResolvedRef {
  piece: MarketPiece
  variant: MarketVariant
}

export function resolveRef(pieces: MarketPiece[], ref: PieceRef): ResolvedRef | null {
  const piece = pieces.find((p) => p.baseKey === ref.baseKey)
  const variant = piece?.variants.find((v) => v.rarity === ref.rarity)
  return piece && variant ? { piece, variant } : null
}

export function resolveBundle(pieces: MarketPiece[], bundle: MarketBundle) {
  const items = bundle.pieces.map((r) => resolveRef(pieces, r)).filter((r): r is ResolvedRef => Boolean(r))
  return items.length === bundle.pieces.length ? items : null
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit items-center rounded-chip bg-surface-3 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">
      {children}
    </span>
  )
}

function Icon({ variant, className }: { variant: MarketVariant; className?: string }) {
  return <GearIcon appearanceKey={variant.appearanceKey} className={className} />
}

/** Overlapping icons for a bundle's pieces. */
function BundleStack({ items, size }: { items: ResolvedRef[]; size: 'sm' | 'lg' }) {
  return (
    <span className="flex items-center" aria-hidden="true">
      {items.map(({ piece, variant }, i) => (
        <span
          key={piece.baseKey}
          className={cn(
            'grid place-items-center rounded-control border-2 bg-abyss',
            RARITY_FRAME[variant.rarity].frame.split(' ')[0],
            size === 'lg' ? 'w-16 h-16' : 'w-11 h-11',
            i > 0 && (size === 'lg' ? '-ml-4' : '-ml-3'),
          )}
        >
          <Icon variant={variant} className="w-4/5 h-4/5" />
        </span>
      ))}
    </span>
  )
}

function BundlePrice({ bundle }: { bundle: MarketBundle }) {
  const { full, price } = bundlePrice(bundle)
  return (
    <span className="flex items-center gap-2">
      <GemAmount value={price} size="sm" />
      <s className="text-[12px] text-ink-muted tabular-nums">
        {full.toLocaleString('en-US')}
        <span className="sr-only"> gems separately</span>
      </s>
    </span>
  )
}

/**
 * Top of the Gear tab: one large promo and smaller ones beside it, then a row of bundles.
 * Everything comes from src/lib/market-featured.ts.
 */
export function MarketFeatured({
  pieces,
  onOpenPiece,
  onOpenBundle,
}: {
  pieces: MarketPiece[]
  onOpenPiece: (ref: PieceRef) => void
  onOpenBundle: (bundleId: string) => void
}) {
  type Slot =
    | { kind: 'piece'; piece: PieceRef; tag: string; blurb?: string; resolved: ResolvedRef }
    | { kind: 'bundle'; tag: string; bundle: MarketBundle; items: ResolvedRef[] }
  const slots = MARKET_FEATURED.flatMap((slot): Slot[] => {
    if (slot.kind === 'piece') {
      const r = resolveRef(pieces, slot.piece)
      return r ? [{ kind: 'piece', piece: slot.piece, tag: slot.tag, blurb: slot.blurb, resolved: r }] : []
    }
    const bundle = MARKET_BUNDLES.find((b) => b.id === slot.bundleId)
    const items = bundle ? resolveBundle(pieces, bundle) : null
    return bundle && items ? [{ kind: 'bundle', tag: slot.tag, bundle, items }] : []
  })
  // A bundle already in the banner isn't repeated in the row below.
  const inBanner = new Set(MARKET_FEATURED.flatMap((f) => (f.kind === 'bundle' ? [f.bundleId] : [])))
  const bundles = MARKET_BUNDLES.filter((b) => !inBanner.has(b.id)).flatMap((b) => {
    const items = resolveBundle(pieces, b)
    return items ? [{ bundle: b, items }] : []
  })
  if (!slots.length && !bundles.length) return null
  const [hero, ...side] = slots

  return (
    <section aria-label="Featured" className="space-y-3">
      {hero ? (
        <div className="grid gap-2 sm:gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {hero.kind === 'piece' ? (
            <button
              type="button"
              onClick={() => onOpenPiece(hero.piece)}
              className={cn(
                'group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-card border-2 bg-surface-1 p-4 sm:p-5 text-left hover:bg-surface-2 transition-colors',
                RARITY_FRAME[hero.resolved.variant.rarity].frame,
                focusRing,
              )}
            >
              <span className="flex flex-col gap-2 min-w-0">
                <Tag>{hero.tag}</Tag>
                <span className="text-xl sm:text-2xl font-semibold text-ink leading-tight">{hero.resolved.piece.name}</span>
                <span className="text-xs text-ink-muted">
                  <span className={cn('font-semibold', RARITY_FRAME[hero.resolved.variant.rarity].text)}>
                    {RARITY_LABELS[hero.resolved.variant.rarity]}
                  </span>
                  {' · '}
                  {CATEGORY_LABELS[hero.resolved.piece.category]}
                </span>
                {hero.blurb ? <span className="text-sm text-ink-body leading-relaxed line-clamp-3">{hero.blurb}</span> : null}
                <span className="mt-1">
                  {hero.resolved.variant.owned ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-muted">
                      <Check className="w-3.5 h-3.5" aria-hidden="true" /> Owned
                    </span>
                  ) : (
                    <GemAmount value={hero.resolved.variant.price} />
                  )}
                </span>
              </span>
              <span className="grid place-items-center w-28 h-28 sm:w-40 sm:h-40 rounded-card bg-abyss/70">
                <Icon
                  variant={hero.resolved.variant}
                  className="w-4/5 h-4/5 transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none"
                />
              </span>
            </button>
          ) : (
            <BundleTile bundle={hero.bundle} items={hero.items} tag={hero.tag} onOpen={onOpenBundle} large />
          )}
          {side.length ? (
            <div className="grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-1">
              {side.map((slot) =>
                slot.kind === 'piece' ? (
                  <button
                    key={`p-${slot.piece.baseKey}`}
                    type="button"
                    onClick={() => onOpenPiece(slot.piece)}
                    className={cn(
                      'group flex flex-col md:flex-row md:items-center gap-2 md:gap-3 rounded-card border-2 bg-surface-1 p-3 text-left hover:bg-surface-2 transition-colors',
                      RARITY_FRAME[slot.resolved.variant.rarity].frame,
                      focusRing,
                    )}
                  >
                    <span className="grid place-items-center w-full md:w-16 aspect-square md:aspect-auto md:h-16 shrink-0 rounded-control bg-abyss/70">
                      <Icon variant={slot.resolved.variant} className="w-3/5 h-3/5 md:w-4/5 md:h-4/5" />
                    </span>
                    <span className="flex flex-col gap-1 min-w-0">
                      <Tag>{slot.tag}</Tag>
                      <span className="text-[13px] font-semibold text-ink leading-tight line-clamp-2">{slot.resolved.piece.name}</span>
                      <span className="flex items-center gap-2">
                        <span className={cn('text-[11px] font-semibold', RARITY_FRAME[slot.resolved.variant.rarity].text)}>
                          {RARITY_LABELS[slot.resolved.variant.rarity]}
                        </span>
                        {slot.resolved.variant.owned ? null : <GemAmount value={slot.resolved.variant.price} size="sm" />}
                      </span>
                    </span>
                  </button>
                ) : (
                  <BundleTile key={`b-${slot.bundle.id}`} bundle={slot.bundle} items={slot.items} tag={slot.tag} onOpen={onOpenBundle} />
                ),
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {bundles.length ? (
        <div className="space-y-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted px-1">Bundles</h2>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 snap-x">
            {bundles.map(({ bundle, items }) => (
              <BundleTile key={bundle.id} bundle={bundle} items={items} onOpen={onOpenBundle} className="w-64 shrink-0 snap-start" />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function BundleTile({
  bundle,
  items,
  tag,
  onOpen,
  large = false,
  className,
}: {
  bundle: MarketBundle
  items: ResolvedRef[]
  tag?: string
  onOpen: (bundleId: string) => void
  large?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(bundle.id)}
      aria-label={`${bundle.name} bundle, ${items.length} pieces`}
      className={cn(
        'flex flex-col gap-2 rounded-card border-2 border-line bg-surface-1 p-3 text-left hover:bg-surface-2 transition-colors',
        large && 'p-4 sm:p-5 gap-3',
        focusRing,
        className,
      )}
    >
      <span className="flex flex-wrap items-center justify-between gap-2">
        <BundleStack items={items} size={large ? 'lg' : 'sm'} />
        {tag ? <Tag>{tag}</Tag> : null}
      </span>
      <span className={cn('font-semibold text-ink leading-tight', large ? 'text-xl' : 'text-[13px]')}>{bundle.name}</span>
      <span className="text-[12px] text-ink-muted leading-snug line-clamp-2">{bundle.blurb}</span>
      <span className="flex items-center justify-between gap-2 mt-auto">
        <BundlePrice bundle={bundle} />
        <HudBadge variant="neutral">
          Soon
        </HudBadge>
      </span>
    </button>
  )
}

/** A bundle's contents. Buying bundles opens later; each piece can be bought on its own now. */
export function MarketBundleDetail({
  bundle,
  pieces,
  onOpenPiece,
}: {
  bundle: MarketBundle
  pieces: MarketPiece[]
  onOpenPiece: (ref: PieceRef) => void
}) {
  const items = resolveBundle(pieces, bundle) ?? []
  const { full, price } = bundlePrice(bundle)
  return (
    <div className="flex flex-col gap-3" data-testid="market-bundle-detail">
      <BundleStack items={items} size="lg" />
      <div>
        <h2 className="text-lg font-semibold text-ink leading-tight">{bundle.name}</h2>
        <p className="text-[13px] text-ink-body leading-relaxed mt-1">{bundle.blurb}</p>
      </div>
      <ul className="flex flex-col gap-1">
        {items.map(({ piece, variant }) => (
          <li key={piece.baseKey}>
            <button
              type="button"
              onClick={() => onOpenPiece({ baseKey: piece.baseKey, rarity: variant.rarity })}
              className={cn(
                'w-full min-h-12 rounded-control border border-line-subtle px-2 flex items-center gap-3 text-left hover:bg-surface-2 transition-colors',
                focusRing,
              )}
            >
              <span className="grid place-items-center w-10 h-10 shrink-0 rounded-control bg-abyss/70">
                <Icon variant={variant} className="w-4/5 h-4/5" />
              </span>
              <span className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-semibold text-ink truncate">{piece.name}</span>
                <span className={cn('text-[11px] font-semibold', RARITY_FRAME[variant.rarity].text)}>
                  {RARITY_LABELS[variant.rarity]} · {CATEGORY_LABELS[piece.category]}
                </span>
              </span>
              {variant.owned ? (
                <span className="text-[12px] font-semibold text-ink-muted">Owned</span>
              ) : (
                <GemAmount value={variant.price} size="sm" />
              )}
            </button>
          </li>
        ))}
      </ul>
      <div className="rounded-card border border-line-subtle bg-surface-2 p-3 flex items-center justify-between gap-3">
        <span className="text-sm text-ink-muted">Bundle price</span>
        <span className="flex items-center gap-2">
          <GemAmount value={price} />
          <s className="text-[12px] text-ink-muted tabular-nums">{full.toLocaleString('en-US')}</s>
        </span>
      </div>
      <p className="text-xs text-ink-muted text-center">
        Bundles open soon. Until then, pick a piece above to buy it on its own.
      </p>
    </div>
  )
}
