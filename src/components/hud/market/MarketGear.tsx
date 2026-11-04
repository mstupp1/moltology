import React from 'react'
import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import type { EquipmentRarity } from '@/db/schema'
import { HudButton } from '@/components/ui/HudButton'
import { CATEGORY_LABELS, formatAffixLine, primaryStatLine, type CatalogRef } from '@/lib/chassis-loadout'
import { RARITY_LABELS } from '@/lib/gear-variants'
import { equipmentIcon, type LobsterAvatarConfig } from '@/lib/lobster-avatar'
import type { MarketPiece, MarketVariant } from '@/lib/market'
import { cn } from '@/lib/utils'
import { LobsterAvatarFullBody } from '../LobsterAvatarFullBody'
import { GemAmount } from './MarketCurrencyBar'
import { RARITY_FRAME } from './market-rarity'

export function variantAsCatalog(piece: MarketPiece, v: MarketVariant): CatalogRef {
  return {
    id: v.catalogItemId,
    slug: v.appearanceKey,
    appearanceKey: v.appearanceKey,
    name: piece.name,
    flavorText: piece.flavorText,
    category: piece.category,
    rarity: v.rarity,
    visualType: 'carapace',
    primaryStat: v.primaryStat,
    affixes: v.affixes,
    uniquePower: v.uniquePower,
    sortOrder: 0,
    kind: 'gear',
  }
}

/** One piece in the grid, shown at one rarity, with the ladder of rarities it comes in. */
export function MarketPieceCard({
  piece,
  shown,
  selected,
  onSelect,
}: {
  piece: MarketPiece
  shown: MarketVariant
  selected: boolean
  onSelect: () => void
}) {
  const icon = equipmentIcon(shown.appearanceKey)
  const style = RARITY_FRAME[shown.rarity]
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${piece.name}, ${RARITY_LABELS[shown.rarity]} ${CATEGORY_LABELS[piece.category]}`}
      className={cn(
        'group relative flex flex-col gap-2 rounded-card border-2 bg-surface-1 p-2 text-left transition-[background-color,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
        style.frame,
        selected ? 'bg-surface-3' : 'hover:bg-surface-2',
      )}
    >
      <span className="relative grid place-items-center w-full aspect-square rounded-control bg-abyss/70 overflow-hidden">
        {icon ? (
          <img
            src={icon}
            alt=""
            className="w-4/5 h-4/5 object-contain transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : null}
        {shown.owned ? (
          <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 rounded-chip bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold text-ink">
            <Check className="w-3 h-3" aria-hidden="true" />
            Owned
          </span>
        ) : null}
      </span>
      <span className="text-[13px] leading-tight text-ink font-semibold line-clamp-2 min-h-[2lh]">{piece.name}</span>
      <span className="flex items-center justify-between gap-2">
        <span className={cn('text-[11px] font-semibold', style.text)}>{RARITY_LABELS[shown.rarity]}</span>
        {shown.owned ? null : <GemAmount value={shown.price} size="sm" />}
      </span>
      <RarityLadder piece={piece} current={shown.rarity} />
    </button>
  )
}

/** Small dots for each rarity a piece comes in; filled when owned. */
function RarityLadder({ piece, current }: { piece: MarketPiece; current: EquipmentRarity }) {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {piece.variants.map((v) => (
        <span
          key={v.rarity}
          className={cn(
            'w-2 h-2 rounded-full border',
            RARITY_FRAME[v.rarity].frame.split(' ')[0],
            v.owned ? RARITY_FRAME[v.rarity].dot : 'bg-transparent',
            v.rarity === current ? 'scale-125' : '',
          )}
        />
      ))}
    </span>
  )
}

/** Detail for the selected piece: try it on, pick a rarity, see its stats, buy it. */
export function MarketPieceDetail({
  piece,
  shown,
  onPickRarity,
  config,
  balance,
  buying,
  everyItem,
  onBuy,
}: {
  piece: MarketPiece
  shown: MarketVariant
  onPickRarity: (rarity: EquipmentRarity) => void
  config: LobsterAvatarConfig | null
  balance: number
  buying: boolean
  everyItem: boolean
  onBuy: (variant: MarketVariant) => void
}) {
  const style = RARITY_FRAME[shown.rarity]
  const catalog = variantAsCatalog(piece, shown)
  const short = shown.price - balance
  return (
    <div className="flex flex-col gap-3" data-testid="market-detail">
      <div className={cn('rounded-card border-2 bg-abyss/70 overflow-hidden w-full max-w-[260px] lg:max-w-none mx-auto', style.frame)}>
        {config ? (
          <LobsterAvatarFullBody
            config={config}
            size={320}
            alt={`Your character wearing ${piece.name}`}
            className="w-full aspect-square"
          />
        ) : (
          <div className="grid place-items-center aspect-square">
            {equipmentIcon(shown.appearanceKey) ? (
              <img src={equipmentIcon(shown.appearanceKey)!} alt="" className="w-3/4 h-3/4 object-contain" />
            ) : null}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-ink leading-tight">{piece.name}</h2>
        <p className="text-xs text-ink-muted">
          <span className={cn('font-semibold', style.text)}>{RARITY_LABELS[shown.rarity]}</span>
          {' · '}
          {CATEGORY_LABELS[piece.category]}
        </p>
      </div>
      <div role="radiogroup" aria-label="Rarity" className="flex flex-col gap-1">
        {piece.variants.map((v) => {
          const s = RARITY_FRAME[v.rarity]
          const active = v.rarity === shown.rarity
          return (
            <button
              key={v.rarity}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${RARITY_LABELS[v.rarity]}${v.owned ? ', owned' : `, ${v.price} gems`}`}
              onClick={() => onPickRarity(v.rarity)}
              className={cn(
                'min-h-10 rounded-control border px-3 flex items-center justify-between gap-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
                active ? cn('bg-surface-3 shadow-nav-current', s.frame.split(' ')[0]) : 'border-line-subtle hover:bg-surface-2',
              )}
            >
              <span className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', s.dot)} aria-hidden="true" />
                <span className={cn('text-[13px] font-semibold', s.text)}>{RARITY_LABELS[v.rarity]}</span>
              </span>
              {v.owned ? (
                <span className="text-[12px] font-semibold text-ink-muted">Owned</span>
              ) : (
                <GemAmount value={v.price} size="sm" />
              )}
            </button>
          )
        })}
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <dt className="text-ink-muted">Main stat</dt>
        <dd className="text-ink text-right tabular-nums">{primaryStatLine(catalog)}</dd>
        {shown.affixes.map((a) => (
          <React.Fragment key={a.stat}>
            <dt className="text-ink-muted">Bonus</dt>
            <dd className="text-ink text-right tabular-nums">{formatAffixLine(a)}</dd>
          </React.Fragment>
        ))}
      </dl>
      {shown.uniquePower ? (
        <div className={cn('rounded-card border bg-surface-2 p-3', style.frame.split(' ')[0])}>
          <p className={cn('text-sm font-semibold', style.text)}>{shown.uniquePower.name}</p>
          <p className="text-[13px] text-ink-body leading-relaxed mt-1">{shown.uniquePower.description}</p>
        </div>
      ) : null}
      <p className="text-[13px] italic text-ink-muted leading-relaxed">{piece.flavorText}</p>
      {shown.owned ? (
        <Link
          to="/chassis"
          className="inline-flex min-h-10 items-center justify-center rounded-control border border-line bg-surface-2 px-4 text-sm font-semibold text-ink hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          {everyItem ? 'Admins own every piece · open the studio' : 'Owned · wear it in the studio'}
        </Link>
      ) : (
        <>
          <HudButton size="lg" fullWidth disabled={buying || short > 0} onClick={() => onBuy(shown)}>
            {buying ? 'Buying…' : `Buy for ${shown.price.toLocaleString('en-US')} gems`}
          </HudButton>
          {short > 0 ? (
            <p className="text-xs text-ink-muted text-center">
              You need {short.toLocaleString('en-US')} more gems. Daily liturgies, streaks and firsts all pay out.
            </p>
          ) : null}
        </>
      )}
      <p className="text-[11px] text-ink-muted">Stats are character flavor. They don't change activities or progression.</p>
    </div>
  )
}
