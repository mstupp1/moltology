import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { EquipmentCategory, EquipmentRarity } from '@/db/schema'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { HudBottomSheet } from '@/components/ui/HudBottomSheet'
import { HudPagination } from '@/components/ui/HudPagination'
import { HudSelect } from '@/components/ui/HudSelect'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useAuthSession } from '@/hooks/useAuthSession'
import { AuthModal } from '@/components/AuthModal'
import { getAuthJWTToken } from '@/lib/jwt'
import { buyGearFn, createCreditCheckoutFn, getChassisLoadoutFn, getMarketFn } from '@/lib/server/api'
import type { MoltCreditPack } from '@/lib/molt-credits'
import {
  clearChassisLoadoutCache,
  computeLoadoutTotals,
  getCachedChassisLoadout,
  previewLoadoutTotals,
  CATEGORY_LABELS,
  type ChassisLoadoutPayload,
} from '@/lib/chassis-loadout'
import { equipmentAppearance } from '@/lib/character-appearance'
import { RARITY_LABELS, RARITY_ORDER } from '@/lib/gear-variants'
import { LOBSTER_AVATAR_STYLE, type LobsterAvatarConfig } from '@/lib/lobster-avatar'
import type { MarketPayload, MarketPiece, MarketVariant } from '@/lib/market'
import { MARKET_BUNDLES, type PieceRef } from '@/lib/market-featured'
import { cn } from '@/lib/utils'
import { HudWorkspaceGhost } from '../HudGhostSkeletons'
import { MarketCreditsPanel } from './MarketCreditsPanel'
import { MarketCurrencyBar } from './MarketCurrencyBar'
import { MarketEarnPanel } from './MarketEarnPanel'
import { MarketBundleDetail, MarketFeatured } from './MarketFeatured'
import { MarketPieceCard, MarketPieceDetail, variantAsCatalog } from './MarketGear'
import './market.css'
import '../avatar-animations.css'

/** The stand-in larva guests try gear on. */
const GUEST_TRY_ON_CONFIG: LobsterAvatarConfig = { style: LOBSTER_AVATAR_STYLE, seed: 'guest-larva' }

type Tab = 'gear' | 'earn' | 'credits'
const TABS: { id: Tab; label: string }[] = [
  { id: 'gear', label: 'Gear' },
  { id: 'earn', label: 'Earn gems' },
  { id: 'credits', label: 'Credits' },
]
const SLOTS: EquipmentCategory[] = ['head', 'antennae', 'carapace', 'claws', 'belt', 'legs']
export const PAGE_SIZE = 24

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'rarity'
const SORTS: { value: Sort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rarity', label: 'Rarest first' },
]

interface GearFilters {
  slot: EquipmentCategory | null
  rarity: EquipmentRarity | null
  sort: Sort
  hideOwned: boolean
  page: number
}
const DEFAULT_FILTERS: GearFilters = { slot: null, rarity: null, sort: 'featured', hideOwned: false, page: 1 }

/** Filters live in the address so a refresh or a shared link keeps them. */
function readFilters(search: string): GearFilters {
  const q = new URLSearchParams(search)
  const slot = q.get('slot') as EquipmentCategory | null
  const rarity = q.get('rarity') as EquipmentRarity | null
  const sort = q.get('sort') as Sort | null
  const page = Number(q.get('page'))
  return {
    slot: slot && SLOTS.includes(slot) ? slot : null,
    rarity: rarity && RARITY_ORDER.includes(rarity) ? rarity : null,
    sort: sort && SORTS.some((s) => s.value === sort) ? sort : 'featured',
    hideOwned: q.get('owned') === 'hide',
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

function writeFilters(f: GearFilters) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  const set = (k: string, v: string | null) => (v ? url.searchParams.set(k, v) : url.searchParams.delete(k))
  set('slot', f.slot)
  set('rarity', f.rarity)
  set('sort', f.sort === 'featured' ? null : f.sort)
  set('owned', f.hideOwned ? 'hide' : null)
  set('page', f.page > 1 ? String(f.page) : null)
  const next = url.pathname + url.search
  if (next !== window.location.pathname + window.location.search) window.history.replaceState(window.history.state, '', next)
}

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

/**
 * Variant a card shows: the rarity filter when set, otherwise the piece's own rarity, or
 * its cheapest unowned version when owned pieces are hidden.
 */
function shownVariant(piece: MarketPiece, rarity: EquipmentRarity | null, hideOwned = false): MarketVariant | undefined {
  const v = rarity ? piece.variants.find((x) => x.rarity === rarity) : hideOwned ? piece.variants.find((x) => !x.owned) : piece.variants[0]
  return v && hideOwned && v.owned ? undefined : v
}

function sortPieces(list: { piece: MarketPiece; shown: MarketVariant }[], sort: Sort) {
  if (sort === 'featured') return list
  const rank = (v: MarketVariant) => RARITY_ORDER.indexOf(v.rarity)
  return [...list].sort((a, b) =>
    sort === 'price-asc'
      ? a.shown.price - b.shown.price
      : sort === 'price-desc'
        ? b.shown.price - a.shown.price
        : rank(b.shown) - rank(a.shown) || b.shown.price - a.shown.price,
  )
}

export function MarketShopPage() {
  const { userId, isPending } = useAuthSession()
  const toast = useOptionalToast()?.toast
  const wide = useWide()
  const [market, setMarket] = useState<MarketPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<LobsterAvatarConfig | null>(null)
  const [loadout, setLoadout] = useState<ChassisLoadoutPayload | null>(null)
  const [tab, setTab] = useState<Tab>('gear')
  const [filters, setFilters] = useState<GearFilters>(DEFAULT_FILTERS)
  const { slot, rarity, sort, hideOwned, page } = filters
  const [selected, setSelected] = useState<{ baseKey: string; rarity: EquipmentRarity } | null>(null)
  const [openBundle, setOpenBundle] = useState<string | null>(null)
  const gridTop = useRef<HTMLDivElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [buying, setBuying] = useState(false)
  const [buyingPack, setBuyingPack] = useState<string | null>(null)
  const [authOpen, setAuthOpen] = useState(false)

  // Guests get the catalog too; they sign up to buy. Wait for the session so members don't
  // see the guest version first.
  const load = useCallback(async () => {
    if (isPending) return
    try {
      const token = (await getAuthJWTToken()) ?? undefined
      const payload = await getMarketFn({ data: { token } })
      setMarket(payload)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the market.')
    }
  }, [userId, isPending])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (typeof window !== 'undefined') setFilters(readFilters(window.location.search))
  }, [])
  useEffect(() => writeFilters(filters), [filters])

  /** Changing a filter starts again from the first page. */
  const updateFilters = (patch: Partial<GearFilters>) => setFilters((f) => ({ ...f, page: 1, ...patch }))
  const goToPage = (next: number) => {
    setFilters((f) => ({ ...f, page: next }))
    gridTop.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
  }

  // Back from Stripe: the webhook adds the credits, usually within a few seconds.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const status = url.searchParams.get('credits')
    if (!status) return
    setTab('credits')
    if (status === 'success') {
      toast?.success('Your Molt Credits will show up in a moment.', { title: 'Payment received' })
      const timer = window.setTimeout(() => void load(), 4000)
      url.searchParams.delete('credits')
      window.history.replaceState(null, '', url.pathname + url.search)
      return () => window.clearTimeout(timer)
    }
    url.searchParams.delete('credits')
    window.history.replaceState(null, '', url.pathname + url.search)
  }, [load, toast])

  // The member's own character, wearing what they have on, for try-ons.
  // Guests try pieces on a stand-in larva.
  useEffect(() => {
    if (!userId) {
      if (!isPending) setConfig(GUEST_TRY_ON_CONFIG)
      return
    }
    let cancelled = false
    const apply = (p: ReturnType<typeof getCachedChassisLoadout>) => {
      if (!p?.config || cancelled) return
      setLoadout(p)
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
  }, [userId, isPending])

  const matches = useMemo(
    () =>
      sortPieces(
        (market?.pieces ?? []).flatMap((piece) => {
          const shown = !slot || piece.category === slot ? shownVariant(piece, rarity, hideOwned) : undefined
          return shown ? [{ piece, shown }] : []
        }),
        sort,
      ),
    [market, slot, rarity, hideOwned, sort],
  )
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = matches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const unfiltered = !slot && !rarity && !hideOwned && currentPage === 1
  const bundle = MARKET_BUNDLES.find((b) => b.id === openBundle) ?? null

  const selectedPiece = market?.pieces.find((p) => p.baseKey === selected?.baseKey) ?? null
  const selectedVariant =
    selectedPiece?.variants.find((v) => v.rarity === selected?.rarity) ?? selectedPiece?.variants[0] ?? null

  // Desktop keeps a piece open beside the grid.
  useEffect(() => {
    const first = pageItems[0]
    if (wide && !selected && !openBundle && first) setSelected({ baseKey: first.piece.baseKey, rarity: first.shown.rarity })
  }, [wide, selected, openBundle, pageItems])

  const openPiece = (ref: PieceRef) => {
    setOpenBundle(null)
    setSelected(ref)
    if (!wide) setSheetOpen(true)
  }
  const showBundle = (id: string) => {
    setOpenBundle(id)
    if (!wide) setSheetOpen(true)
  }

  /** The open piece follows the rarity filter when it comes in that rarity. */
  const pickRarity = (r: EquipmentRarity | null) => {
    updateFilters({ rarity: r })
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

  // What wearing the selected piece would do to the stats, against what is worn now.
  const statChange = useMemo(() => {
    if (!loadout || !selectedPiece || !selectedVariant) return null
    const slotId = selectedPiece.category === 'claws' ? 'claws-1' : selectedPiece.category
    const catalogById = new Map(loadout.catalog.map((c) => [c.id, c]))
    catalogById.set(selectedVariant.catalogItemId, variantAsCatalog(selectedPiece, selectedVariant))
    return {
      from: computeLoadoutTotals(loadout.items, catalogById),
      to: previewLoadoutTotals(loadout.items, catalogById, slotId, selectedVariant.catalogItemId),
    }
  }, [loadout, selectedPiece, selectedVariant])

  const buy = async (variant: MarketVariant) => {
    if (market?.guest) {
      setAuthOpen(true)
      return
    }
    if (!selectedPiece || buying) return
    setBuying(true)
    try {
      const token = (await getAuthJWTToken()) ?? undefined
      const result = await buyGearFn({ data: { token, catalogItemId: variant.catalogItemId } })
      if (result.ok) {
        clearChassisLoadoutCache()
        toast?.success(`${selectedPiece.name} is in your inventory. Wear it from Customize.`, {
          title: market?.addFree ? 'Added to your collection' : `${RARITY_LABELS[variant.rarity]} piece unlocked`,
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

  const buyPack = async (pack: MoltCreditPack) => {
    if (buyingPack) return
    setBuyingPack(pack.id)
    try {
      const token = (await getAuthJWTToken()) ?? undefined
      const { url } = await createCreditCheckoutFn({ data: { token, packId: pack.id } })
      window.location.assign(url)
    } catch (e) {
      toast?.error(e instanceof Error ? e.message : 'Could not open checkout. Try again.')
      setBuyingPack(null)
    }
  }

  if (!market) {
    if (error) return <p className="text-sm text-crimson-text p-4">{error}</p>
    return <HudWorkspaceGhost />
  }

  const detail = bundle ? (
    <MarketBundleDetail bundle={bundle} pieces={market.pieces} onOpenPiece={openPiece} />
  ) : selectedPiece && selectedVariant ? (
      <MarketPieceDetail
        key={selectedPiece.baseKey}
        piece={selectedPiece}
        shown={selectedVariant}
        onPickRarity={(r) => setSelected({ baseKey: selectedPiece.baseKey, rarity: r })}
        config={tryOnConfig}
        currentConfig={config}
        statChange={statChange}
        balance={market.wallet.balance}
        credits={market.moltCredits}
        buying={buying}
        addFree={market.addFree}
        guest={market.guest}
        onBuy={buy}
      />
    ) : null

  return (
    <div className="space-y-3 sm:space-y-4 font-sans pb-2">
      <HudTitlePanel
        treatment="band"
        joined
        accent="cyan"
        title="Shop"
        description="Gear for your character. Rarer versions come with bigger stats and stranger abilities."
        actions={
          market.guest ? undefined : (
            <MarketCurrencyBar chitinGems={market.wallet.balance} moltCredits={market.moltCredits} creditsLive={market.creditsLive} />
          )
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
                  tab === t.id ? 'bg-surface-3 shadow-nav-current text-ink' : 'text-ink-muted hover:text-ink hover:bg-surface-3/60',
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
            {unfiltered ? <MarketFeatured pieces={market.pieces} onOpenPiece={openPiece} onOpenBundle={showBundle} /> : null}
            <div ref={gridTop} className="scroll-mt-4 flex flex-col gap-2 rounded-card border border-line-subtle bg-surface-1 p-2">
              <div className="flex gap-1 overflow-x-auto" role="group" aria-label="Slot">
                <LitTile active={slot === null} onClick={() => updateFilters({ slot: null })}>
                  All slots
                </LitTile>
                {SLOTS.map((s) => (
                  <LitTile key={s} active={slot === s} onClick={() => updateFilters({ slot: s })}>
                    {CATEGORY_LABELS[s]}
                  </LitTile>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                <HudSelect
                  aria-label="Rarity"
                  className="min-h-9 text-[13px] sm:w-40"
                  value={rarity ?? ''}
                  onChange={(e) => pickRarity((e.target.value || null) as EquipmentRarity | null)}
                  options={[{ value: '', label: 'Any rarity' }, ...RARITY_ORDER.map((r) => ({ value: r, label: RARITY_LABELS[r] }))]}
                />
                <HudSelect
                  aria-label="Sort"
                  className="min-h-9 text-[13px] sm:w-48"
                  value={sort}
                  onChange={(e) => updateFilters({ sort: e.target.value as Sort })}
                  options={SORTS}
                />
                <LitTile active={hideOwned} onClick={() => updateFilters({ hideOwned: !hideOwned })} className="col-span-2 sm:col-span-1">
                  Hide owned
                </LitTile>
                <span className="hidden sm:block ml-auto pr-1 text-xs text-ink-muted tabular-nums" aria-live="polite">
                  {matches.length} {matches.length === 1 ? 'piece' : 'pieces'}
                </span>
              </div>
            </div>
            {matches.length === 0 ? (
              <p className="text-sm text-ink-muted p-4">
                {hideOwned && !slot && !rarity ? 'You own every piece. Nice.' : 'Nothing matches these filters.'}
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
                {pageItems.map(({ piece: p, shown: v }) => (
                  <MarketPieceCard
                    key={p.baseKey}
                    piece={p}
                    shown={v}
                    selected={!bundle && selected?.baseKey === p.baseKey}
                    onSelect={() => openPiece({ baseKey: p.baseKey, rarity: v.rarity })}
                  />
                ))}
              </div>
            )}
            {matches.length > PAGE_SIZE ? (
              <HudPagination
                currentPage={currentPage}
                totalItems={matches.length}
                pageSize={PAGE_SIZE}
                onPageChange={goToPage}
                itemName="pieces"
                className="pt-3"
              />
            ) : null}
          </div>
          {wide ? (
            <aside className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-card border border-line-subtle bg-surface-1 p-4">{detail}</aside>
          ) : (
            <HudBottomSheet
              isOpen={sheetOpen && Boolean(detail)}
              onClose={() => setSheetOpen(false)}
              ariaLabel={bundle ? bundle.name : selectedPiece ? selectedPiece.name : 'Piece'}
              maxHeight="92dvh"
            >
              <div className="p-4 pt-1">{detail}</div>
            </HudBottomSheet>
          )}
        </div>
      ) : null}

      {tab === 'earn' ? <MarketEarnPanel wallet={market.wallet} guest={market.guest} /> : null}
      {tab === 'credits' ? (
        <MarketCreditsPanel live={market.creditsLive} buyingPackId={buyingPack} onBuy={buyPack} />
      ) : null}
      {market.guest ? <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" /> : null}
    </div>
  )
}
