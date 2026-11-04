import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { EquipmentCategory, EquipmentRarity } from '@/db/schema'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { HudBottomSheet } from '@/components/ui/HudBottomSheet'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { buyGearFn, getChassisLoadoutFn, getMarketFn } from '@/lib/server/api'
import { clearChassisLoadoutCache, getCachedChassisLoadout, CATEGORY_LABELS } from '@/lib/chassis-loadout'
import { equipmentAppearance } from '@/lib/character-appearance'
import { RARITY_LABELS, RARITY_ORDER } from '@/lib/gear-variants'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'
import type { MarketPayload, MarketPiece, MarketVariant } from '@/lib/market'
import { cn } from '@/lib/utils'
import { HudWorkspaceGhost } from '../HudGhostSkeletons'
import { MarketCreditsPanel } from './MarketCreditsPanel'
import { MarketCurrencyBar } from './MarketCurrencyBar'
import { MarketEarnPanel } from './MarketEarnPanel'
import { MarketPieceCard, MarketPieceDetail } from './MarketGear'
import './market.css'
import '../avatar-animations.css'

type Tab = 'gear' | 'earn' | 'credits'
const TABS: { id: Tab; label: string }[] = [
  { id: 'gear', label: 'Gear' },
  { id: 'earn', label: 'Earn gems' },
  { id: 'credits', label: 'Credits' },
]
const SLOTS: EquipmentCategory[] = ['head', 'antennae', 'carapace', 'claws', 'belt', 'legs']

const WIDE_QUERY = '(min-width: 1024px)'
const subscribeWide = (onChange: () => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const media = window.matchMedia(WIDE_QUERY)
  media.addEventListener?.('change', onChange)
  return () => media.removeEventListener?.('change', onChange)
}
function useWide() {
  return useSyncExternalStore(
    subscribeWide,
    () => typeof window.matchMedia === 'function' && window.matchMedia(WIDE_QUERY).matches,
    () => false,
  )
}

function LitTile({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'min-h-9 shrink-0 rounded-control px-3 text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
        active ? 'bg-surface-3 shadow-nav-current text-ink' : 'text-ink-muted hover:text-ink hover:bg-surface-2',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Variant a card shows: the rarity filter when set, otherwise the piece's own rarity. */
function shownVariant(piece: MarketPiece, rarity: EquipmentRarity | null): MarketVariant | undefined {
  return rarity ? piece.variants.find((v) => v.rarity === rarity) : piece.variants[0]
}

export function MarketShopPage() {
  const { userId } = useAuthSession()
  const toast = useOptionalToast()?.toast
  const wide = useWide()
  const [market, setMarket] = useState<MarketPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<LobsterAvatarConfig | null>(null)
  const [tab, setTab] = useState<Tab>('gear')
  const [slot, setSlot] = useState<EquipmentCategory | null>(null)
  const [rarity, setRarity] = useState<EquipmentRarity | null>(null)
  const [selected, setSelected] = useState<{ baseKey: string; rarity: EquipmentRarity } | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [buying, setBuying] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    try {
      const token = (await getAuthJWTToken()) ?? undefined
      const payload = await getMarketFn({ data: { token } })
      setMarket(payload)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the market.')
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  // The member's own character, wearing what they have on, for try-ons.
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const apply = (p: ReturnType<typeof getCachedChassisLoadout>) => {
      if (!p?.config || cancelled) return
      setConfig({ ...p.config, equipment: equipmentAppearance(p.items, p.catalog) })
    }
    apply(getCachedChassisLoadout(userId))
    void (async () => {
      try {
        const token = (await getAuthJWTToken()) ?? undefined
        apply(await getChassisLoadoutFn({ data: { userId, token } }))
      } catch {
        // Try-ons fall back to the item icon.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const pieces = useMemo(
    () =>
      (market?.pieces ?? []).filter(
        (p) => (!slot || p.category === slot) && Boolean(shownVariant(p, rarity)),
      ),
    [market, slot, rarity],
  )

  const selectedPiece = market?.pieces.find((p) => p.baseKey === selected?.baseKey) ?? null
  const selectedVariant =
    selectedPiece?.variants.find((v) => v.rarity === selected?.rarity) ?? selectedPiece?.variants[0] ?? null

  // Desktop keeps a piece open beside the grid.
  useEffect(() => {
    if (wide && !selected && pieces[0]) {
      const v = shownVariant(pieces[0], rarity)
      if (v) setSelected({ baseKey: pieces[0].baseKey, rarity: v.rarity })
    }
  }, [wide, selected, pieces, rarity])

  /** The open piece follows the rarity filter when it comes in that rarity. */
  const pickRarity = (r: EquipmentRarity | null) => {
    setRarity(r)
    setSelected((cur) => {
      if (!cur || !r) return cur
      const piece = market?.pieces.find((p) => p.baseKey === cur.baseKey)
      return piece?.variants.some((v) => v.rarity === r) ? { ...cur, rarity: r } : null
    })
  }

  const tryOnConfig = useMemo(() => {
    if (!config || !selectedPiece || !selectedVariant) return config
    const slotId = selectedPiece.category === 'claws' ? 'claws-1' : selectedPiece.category
    return {
      ...config,
      equipment: {
        ...(config.equipment ?? {}),
        [slotId]: { visualKey: selectedVariant.appearanceKey, rarity: selectedVariant.rarity },
      },
    }
  }, [config, selectedPiece, selectedVariant])

  const buy = async (variant: MarketVariant) => {
    if (!selectedPiece || buying) return
    setBuying(true)
    try {
      const token = (await getAuthJWTToken()) ?? undefined
      const result = await buyGearFn({ data: { token, catalogItemId: variant.catalogItemId } })
      if (result.ok) {
        clearChassisLoadoutCache()
        toast?.success(`${selectedPiece.name} is yours. Wear it in the studio.`, {
          title: `${RARITY_LABELS[variant.rarity]} piece unlocked`,
        })
      } else {
        toast?.warning(result.error ?? 'That purchase did not go through.')
      }
      await load()
    } catch {
      toast?.error('That purchase did not go through. Try again.')
    } finally {
      setBuying(false)
    }
  }

  if (!market) {
    if (error) return <p className="text-sm text-crimson-text p-4">{error}</p>
    return <HudWorkspaceGhost />
  }

  const detail =
    selectedPiece && selectedVariant ? (
      <MarketPieceDetail
        piece={selectedPiece}
        shown={selectedVariant}
        onPickRarity={(r) => setSelected({ baseKey: selectedPiece.baseKey, rarity: r })}
        config={tryOnConfig}
        balance={market.wallet.balance}
        buying={buying}
        everyItem={market.everyItem}
        onBuy={buy}
      />
    ) : null

  return (
    <div className="space-y-3 sm:space-y-4 font-sans pb-2">
      <HudTitlePanel
        surface="solid"
        accent="cyan"
        title="Market"
        description="Gear for your character. Rarer versions come with bigger stats and stranger abilities."
        actions={
          <MarketCurrencyBar chitinGems={market.wallet.balance} moltCredits={market.moltCredits} creditsLive={false} />
        }
        toolbar={
          <div role="tablist" aria-label="Market sections" className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 sm:flex-none min-h-9 rounded-control px-4 text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
                  tab === t.id ? 'bg-surface-3 shadow-nav-current text-ink' : 'text-ink-muted hover:text-ink hover:bg-surface-2',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      {tab === 'gear' ? (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-col gap-2 rounded-card border border-line-subtle bg-surface-1 p-2">
              <div className="flex gap-1 overflow-x-auto" aria-label="Slot">
                <LitTile active={slot === null} onClick={() => setSlot(null)}>
                  All slots
                </LitTile>
                {SLOTS.map((s) => (
                  <LitTile key={s} active={slot === s} onClick={() => setSlot(s)}>
                    {CATEGORY_LABELS[s]}
                  </LitTile>
                ))}
              </div>
              <div className="flex gap-1 overflow-x-auto" aria-label="Rarity">
                <LitTile active={rarity === null} onClick={() => pickRarity(null)}>
                  Any rarity
                </LitTile>
                {RARITY_ORDER.map((r) => (
                  <LitTile key={r} active={rarity === r} onClick={() => pickRarity(r)}>
                    {RARITY_LABELS[r]}
                  </LitTile>
                ))}
              </div>
            </div>
            {pieces.length === 0 ? (
              <p className="text-sm text-ink-muted p-4">Nothing matches these filters.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                {pieces.map((p) => {
                  const v = shownVariant(p, rarity)!
                  return (
                    <MarketPieceCard
                      key={p.baseKey}
                      piece={p}
                      shown={v}
                      selected={selected?.baseKey === p.baseKey}
                      onSelect={() => {
                        setSelected({ baseKey: p.baseKey, rarity: v.rarity })
                        if (!wide) setSheetOpen(true)
                      }}
                    />
                  )
                })}
              </div>
            )}
          </div>
          {wide ? (
            <aside className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-card border border-line-subtle bg-surface-1 p-4">{detail}</aside>
          ) : (
            <HudBottomSheet
              isOpen={sheetOpen && Boolean(detail)}
              onClose={() => setSheetOpen(false)}
              ariaLabel={selectedPiece ? selectedPiece.name : 'Piece'}
              maxHeight="92dvh"
            >
              <div className="p-4 pt-1">{detail}</div>
            </HudBottomSheet>
          )}
        </div>
      ) : null}

      {tab === 'earn' ? <MarketEarnPanel wallet={market.wallet} /> : null}
      {tab === 'credits' ? <MarketCreditsPanel live={false} /> : null}
    </div>
  )
}
