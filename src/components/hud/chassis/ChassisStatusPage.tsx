import { Link } from '@tanstack/react-router'
import { GearIcon } from '@/components/hud/avatar3d/GearIcon'
import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Dices, UserPlus } from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { HudWorkspaceGhost } from '../HudGhostSkeletons'
import { HudButton } from '@/components/ui/HudButton'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useHudPersist } from '@/hooks/useHudPersist'
import { getAuthJWTToken } from '@/lib/jwt'
import { getChassisLoadoutFn, saveCharacterFn } from '@/lib/server/api'
import {
  LOBSTER_AVATAR_STYLE,
  lockAvatarConfig,
  rerollAvatarConfig,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
import {
  applyMoveUpdates,
  planGearMove,
  findFirstFreeVaultIndex,
  computeLoadoutTotals,
  EQUIP_SLOT_LABELS,
  previewLoadoutTotals,
  primaryStatLine,
  EQUIP_SLOT_IDS,
  equipSlotCategory,
  CATEGORY_LABELS,
  RARITY_STYLES,
  type CatalogRef,
  getCachedChassisLoadout,
  setCachedChassisLoadout,
  type ChassisLoadoutPayload,
  type EquipSlotId,
  type GearItemState,
} from '@/lib/chassis-loadout'
import { equipmentAppearance } from '@/lib/character-appearance'
import { parseVariantKey } from '@/lib/gear-variants'
import { AvatarCreatorPanel } from '../avatar/AvatarCreatorPanel'
import { AvatarCreatorPreview } from '../avatar/AvatarCreatorPreview'
import { reactAvatars } from '@/lib/avatar3d-events'
import { GearDetail } from './GearDetail'
import { BonusChange } from './VectorSheetPanel'
import { StatHud } from './StatHud'
import { buildVectorSheet, resolveVectorBase } from '@/lib/vectors'
import { readGuestCharacter, saveGuestCharacter } from '@/lib/guest-character'
import { GUEST_CHARACTER_CLAIMED_EVENT } from '@/lib/guest-character-key'
import '../avatar-animations.css'

const TABS = ['equipment', 'body', 'shell', 'face', 'scene'] as const
const TAB_LABELS: Record<(typeof TABS)[number], string> = {
  equipment: 'Gear',
  body: 'Body',
  shell: 'Shell',
  face: 'Face',
  scene: 'Scene',
}
/** Slots shown down each side of the character on wide screens. */
const LEFT_SLOTS: EquipSlotId[] = ['head', 'antennae', 'carapace', 'belt']
const RIGHT_SLOTS: EquipSlotId[] = ['claws-1', 'claws-2', 'legs']
export const SLOT_NAMES: Record<EquipSlotId, string> = EQUIP_SLOT_LABELS

const WIDE_QUERY = '(min-width: 1024px)'
const subscribeWide = (onChange: () => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const media = window.matchMedia(WIDE_QUERY)
  media.addEventListener?.('change', onChange)
  return () => media.removeEventListener?.('change', onChange)
}
/** Matches Tailwind `lg`: the two-column layout. */
function useWideLayout() {
  return useSyncExternalStore(
    subscribeWide,
    () => typeof window.matchMedia === 'function' && window.matchMedia(WIDE_QUERY).matches,
    () => false,
  )
}

/**
 * One local draft of the character. Only owned pieces are listed; trying on new ones happens in the shop.
 * Guests edit the starter character; their draft stays in this browser and saving asks them to sign up.
 */
export const ChassisStatusPage: React.FC = () => {
  const { userId, isGuest, isPending } = useAuthSession()
  const toast = useOptionalToast()?.toast
  const persist = useHudPersist()
  const wide = useWideLayout()
  const [saved, setSaved] = useState<ChassisLoadoutPayload | null>(() =>
    userId ? getCachedChassisLoadout(userId) : null,
  )
  const [config, setConfig] = useState<LobsterAvatarConfig | null>(null)
  const [items, setItems] = useState<GearItemState[]>([])
  const [tab, setTab] = useState<(typeof TABS)[number]>('equipment')
  const [slot, setSlot] = useState<EquipSlotId>('head')
  // The slot the 3D camera features. Set only when a slot is picked, so the page opens on the
  // whole character.
  const [focus, setFocus] = useState<EquipSlotId | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const draftTouched = useRef(false)
  const canonicalRevision = useRef(0)
  const [reload, setReload] = useState(0)
  const [authOpen, setAuthOpen] = useState(false)
  const [guestEdited, setGuestEdited] = useState(false)
  const baseConfig = (payload: ChassisLoadoutPayload): LobsterAvatarConfig =>
    payload.config ?? {
      style: LOBSTER_AVATAR_STYLE,
      seed: `member-${userId}`,
      shellFinish: 'satin',
      pose: 'rest',
    }
  const accept = (payload: ChassisLoadoutPayload) => {
    draftTouched.current = false
    canonicalRevision.current = payload.appearanceRevision ?? 0
    setSaved(payload)
    setConfig(baseConfig(payload))
    setItems(payload.items)
    if (userId) setCachedChassisLoadout(userId, payload)
  }
  useEffect(() => {
    let cancelled = false
    setError(null)
    setSelected(null)
    draftTouched.current = false
    if (isPending) return
    if (isGuest) {
      void (async () => {
        try {
          const payload = await getChassisLoadoutFn({ data: {} })
          if (cancelled) return
          const stored = readGuestCharacter()
          accept({
            ...payload,
            config: stored.config ?? lockAvatarConfig(rerollAvatarConfig({ race: 'lobster' })),
          })
          if (stored.items) setItems(stored.items)
          setGuestEdited(Boolean(stored.config || stored.items))
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load the character.')
        }
      })()
      return () => {
        cancelled = true
      }
    }
    const cache = userId ? getCachedChassisLoadout(userId) : null
    if (cache) accept(cache)
    else {
      canonicalRevision.current = 0
      setSaved(null)
      setConfig(null)
      setItems([])
    }
    if (!userId) return
    void (async () => {
      try {
        const token = await getAuthJWTToken()
        const payload = await getChassisLoadoutFn({
          data: { userId, token: token ?? undefined },
        })
        if (
          !cancelled &&
          !draftTouched.current &&
          (payload.appearanceRevision ?? 0) >= canonicalRevision.current
        )
          accept(payload)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load your character.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, isGuest, isPending, reload])
  // A character made as a guest was just saved to this account: show the saved one.
  useEffect(() => {
    const onClaimed = () => setReload((n) => n + 1)
    window.addEventListener(GUEST_CHARACTER_CLAIMED_EVENT, onClaimed)
    return () => window.removeEventListener(GUEST_CHARACTER_CLAIMED_EVENT, onClaimed)
  }, [])
  // Guests keep their draft in this browser, so it survives leaving and coming back.
  useEffect(() => {
    if (!isGuest || !config || !draftTouched.current) return
    saveGuestCharacter(config, items)
    setGuestEdited(true)
  }, [isGuest, config, items])
  const catalog = saved?.catalog ?? []
  const catalogById = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog])
  const equipped = useMemo(() => equipmentAppearance(items, catalog), [items, catalog])
  const preview = useMemo(
    () => (config ? { ...config, equipment: { ...equipped } } : null),
    [config, equipped],
  )
  const dirty = Boolean(
    saved &&
    config &&
    (JSON.stringify({ ...config, equipment: undefined }) !==
      JSON.stringify({ ...baseConfig(saved), equipment: undefined }) ||
      JSON.stringify(items) !== JSON.stringify(saved.items)),
  )
  const selectedCatalog = selected ? catalogById.get(selected) : null
  const unlocked = Boolean(saved?.allUnlocked)
  const matching = catalog.filter(
    (c) =>
      c.category === equipSlotCategory(slot) &&
      (unlocked || items.some((i) => i.catalogItemId === c.id)),
  )
  /** Admins: wear any catalog item. A new instance is created when the draft is saved. */
  const equipUnlocked = (catalogId: string) => {
    const occupant = items.find((i) => i.equippedSlot === slot)
    const isNew = (id: string) => !saved?.items.some((i) => i.id === id)
    let next: GearItemState[] = items
    if (occupant) {
      const index = isNew(occupant.id) ? null : findFirstFreeVaultIndex(items, saved?.vaultSize)
      // Unsaved or homeless pieces are simply let go: admins can pick them again any time.
      next =
        index === null
          ? items.filter((i) => i.id !== occupant.id)
          : items.map((i) =>
              i.id === occupant.id ? { ...i, equippedSlot: null, vaultIndex: index } : i,
            )
    }
    draftTouched.current = true
    setItems([
      ...next,
      { id: crypto.randomUUID(), catalogItemId: catalogId, equippedSlot: slot, vaultIndex: null },
    ])
  }
  const equip = (catalogId: string) => {
    const instance =
      items.find((i) => i.catalogItemId === catalogId && !i.equippedSlot) ??
      items.find((i) => i.catalogItemId === catalogId && i.equippedSlot !== slot) ??
      items.find((i) => i.catalogItemId === catalogId)
    if (!instance) {
      if (unlocked) equipUnlocked(catalogId)
      return
    }
    const plan = planGearMove(
      items,
      catalogById,
      instance.id,
      { type: 'equip', slot },
      saved?.vaultSize,
    )
    if (!plan.ok) {
      toast?.warning(plan.error)
      return
    }
    draftTouched.current = true
    setItems(applyMoveUpdates(items, plan.updates))
  }
  const unequip = () => {
    const item = items.find((i) => i.equippedSlot === slot)
    if (!item) return
    const index = findFirstFreeVaultIndex(items, saved?.vaultSize)
    if (unlocked && (index === null || !saved?.items.some((i) => i.id === item.id))) {
      draftTouched.current = true
      setItems(items.filter((i) => i.id !== item.id))
      return
    }
    if (index === null) {
      toast?.warning('Your vault is full.')
      return
    }
    const plan = planGearMove(
      items,
      catalogById,
      item.id,
      { type: 'vault', index },
      saved?.vaultSize,
    )
    if (plan.ok) {
      draftTouched.current = true
      setItems(applyMoveUpdates(items, plan.updates))
    }
  }
  const save = async () => {
    if (isGuest) {
      if (config) saveGuestCharacter(config, items)
      setAuthOpen(true)
      return
    }
    if (!config || !saved || !userId || saving) return
    setSaving(true)
    persist.begin('character')
    try {
      const token = await getAuthJWTToken()
      const { equipment: _, accessory: __, claws: ___, ...body } = config
      const payload = await saveCharacterFn({
        data: {
          userId,
          token: token ?? undefined,
          config: body,
          expectedRevision: saved.appearanceRevision ?? 0,
          ...(unlocked
            ? {
                grants: items
                  .filter((i) => !saved.items.some((s) => s.id === i.id))
                  .map((i) => ({ id: i.id, catalogItemId: i.catalogItemId })),
                release: saved.items
                  .filter((s) => !items.some((i) => i.id === s.id))
                  .map((s) => s.id),
              }
            : {}),
          placements: items.map((i) => ({
            id: i.id,
            equippedSlot: i.equippedSlot,
            vaultIndex: i.vaultIndex,
          })),
        },
      })
      accept(payload)
      setError(null)
      window.dispatchEvent(new CustomEvent('profile-avatar-changed'))
      toast?.success('Character saved.')
      // Once the saved look has settled in, the character celebrates.
      window.setTimeout(() => reactAvatars('celebrate'), 80)
    } catch (e) {
      if (e instanceof Error && e.message.includes('another session'))
        setError('A newer character is available. Reload to replace this draft.')
      toast?.error(
        e instanceof Error ? e.message : 'Could not save your character. Please try again.',
      )
    } finally {
      setSaving(false)
      persist.end('character')
    }
  }
  if (!saved || !config || !preview)
    return error ? (
      <div role="alert" className="p-5 space-y-3">
        <p>{error}</p>
        <HudButton onClick={() => setReload((n) => n + 1)}>Try again</HudButton>
      </div>
    ) : (
      <HudWorkspaceGhost />
    )
  const wearing = items.find((i) => i.equippedSlot === slot)
  const gearTotals = computeLoadoutTotals(items, catalogById)
  const sheet = buildVectorSheet(saved.vectorBase ?? resolveVectorBase(null, userId ?? ''), gearTotals)
  // While a piece for this slot is picked, the stats panel shows what wearing it would change.
  const statPreview =
    tab === 'equipment' &&
    selectedCatalog &&
    selectedCatalog.category === equipSlotCategory(slot) &&
    wearing?.catalogItemId !== selectedCatalog.id
      ? previewLoadoutTotals(items, catalogById, slot, selectedCatalog.id)
      : null
  const slotProps: SlotSharedProps = {
    active: slot,
    disabled: saving,
    itemFor: (id) => {
      const worn = items.find((i) => i.equippedSlot === id)
      return worn ? (catalogById.get(worn.catalogItemId) ?? null) : null
    },
    onPick: (id) => {
      setSlot(id)
      setFocus(id)
      setTab('equipment')
      setSelected(null)
    },
  }
  const tabBar = (
    <div
      role="tablist"
      aria-label="Character editor"
      className="flex gap-0.5 rounded-card border border-line-subtle bg-surface-1 p-0.5"
    >
      {TABS.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          aria-controls="character-controls"
          onClick={() => setTab(id)}
          className={`flex-1 min-h-9 rounded-control text-[11px] font-sans font-semibold tracking-[0.08em] uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
            tab === id
              ? 'bg-surface-3 shadow-nav-current text-ink'
              : 'text-ink-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          {TAB_LABELS[id]}
        </button>
      ))}
    </div>
  )
  return (
    // Phones: header, character and tabs stay pinned as one compact stage while
    // only the options scroll. Wide screens: character on the left, editor on the right.
    <div
      className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)] gap-x-6 gap-y-3 lg:gap-y-5 items-start font-sans relative max-lg:pb-16"
      data-testid="character-workspace"
    >
      {/* Below lg this pinned stage continues the page's header band (the section tabs sit just
          above it, from the route); on wide screens only the title row does. */}
      <div className="hud-title-band-rest max-lg:sticky max-lg:z-20 max-sm:-top-2.5 sm:max-md:-top-4 md:max-lg:-top-6 max-lg:pt-1 max-lg:pb-2 max-lg:space-y-2 max-lg:bg-surface-2/95 max-lg:backdrop-blur-md max-lg:border-b max-lg:border-line-subtle lg:contents">
        <div className="hud-title-band-rest-lg lg:col-span-2 flex items-center justify-between gap-3 lg:bg-surface-2 lg:border-b lg:border-line-subtle lg:pt-2 lg:pb-5">
          <h1 className="font-grotesk font-extrabold text-lg sm:text-2xl text-ink tracking-tight truncate">
            Character
          </h1>
          <div className="flex shrink-0 gap-2">
            <HudButton
              size="sm"
              variant="secondary"
              disabled={saving || !dirty}
              onClick={() => {
                accept(saved)
                if (isGuest && saved.config) saveGuestCharacter(saved.config, saved.items)
              }}
            >
              Discard
            </HudButton>
            {isGuest ? (
              <HudButton size="sm" onClick={() => void save()} icon={<UserPlus className="w-3.5 h-3.5" />}>
                Save my character
              </HudButton>
            ) : (
              <HudButton size="sm" disabled={saving || !dirty} onClick={() => void save()}>
                {saving ? 'Saving…' : 'Save changes'}
              </HudButton>
            )}
          </div>
        </div>
        <div className="lg:row-start-2 lg:sticky lg:top-6 lg:self-start space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-[84px_minmax(0,1fr)_84px] gap-2 items-center">
            <SlotColumn ids={LEFT_SLOTS} className="hidden lg:flex" {...slotProps} />
            <div className="relative">
              {/* The stage stays mounted across edits, so the character can react instead of reloading. */}
              <div>
                <AvatarCreatorPreview
                  config={preview}
                  portraitBeside
                  focus={tab === 'equipment' ? focus : null}
                  onResetFocus={() => setFocus(null)}
                  className="max-w-[min(212px,28svh)] lg:max-w-[560px] mx-auto"
                />
              </div>
              <HudButton
                type="button"
                variant="secondary"
                size="sm"
                className="absolute top-1 left-0 max-lg:px-2.5 lg:top-2 lg:left-2"
                disabled={saving}
                aria-label="Surprise me"
                onClick={() => {
                  draftTouched.current = true
                  setConfig(rerollAvatarConfig(config))
                }}
                icon={<Dices className="w-3.5 h-3.5 text-cyan-glow" />}
              >
                <span className="max-lg:sr-only">Surprise me</span>
              </HudButton>
              {!wide && (
                <StatHud
                  variant="rail"
                  sheet={sheet}
                  preview={statPreview}
                  className="absolute left-0 top-10 w-[72px] max-[379px]:w-[64px]"
                />
              )}
            </div>
            <SlotColumn ids={RIGHT_SLOTS} className="hidden lg:flex" {...slotProps} />
          </div>
          {wide && <StatHud variant="strip" sheet={sheet} preview={statPreview} />}
        </div>
        {!wide && tabBar}
      </div>
      <div className="lg:col-start-2 lg:row-start-2 chitin-card p-2.5 sm:p-4 lg:p-5 chamfer-corner shadow-2xl space-y-4 min-w-0">
        {wide && (
          <div className="sticky -top-6 z-10 -mx-5 -mt-5 px-5 pt-5 pb-2 rounded-t-card bg-abyss/95 backdrop-blur-md">
            {tabBar}
          </div>
        )}
        {isGuest && guestEdited && (
          <div
            className="flex items-center justify-between gap-3 rounded-control border border-line-subtle bg-surface-2 px-3 py-2"
            data-testid="guest-character-strip"
          >
            <p className="text-xs sm:text-[13px] text-ink-body">
              Your character is only saved on this device. Create a free account to keep it.
            </p>
            <HudButton size="sm" variant="secondary" className="shrink-0" onClick={() => setAuthOpen(true)}>
              Sign up
            </HudButton>
          </div>
        )}
        {error && (
          <div role="alert" className="text-crimson-text">
            {error}{' '}
            <button type="button" className="underline" onClick={() => setReload((n) => n + 1)}>
              Reload character
            </button>
          </div>
        )}
        <div id="character-controls" role="tabpanel">
          {tab !== 'equipment' ? (
            <AvatarCreatorPanel
              value={config}
              section={tab}
              onChange={(next) => {
                draftTouched.current = true
                setConfig(next)
              }}
              disabled={saving}
            />
          ) : (
            <div className="space-y-3 lg:space-y-4">
              <div
                className="flex lg:hidden gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x"
                aria-label="Equipment slots"
              >
                {EQUIP_SLOT_IDS.map((id) => (
                  <SlotButton
                    key={id}
                    id={id}
                    className="w-[68px] shrink-0 snap-start"
                    {...slotProps}
                  />
                ))}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-grotesk font-bold text-ink">{SLOT_NAMES[slot]}</h2>
                  <p className="text-xs text-ink-muted mt-1">
                    {wearing
                      ? catalogById.get(wearing.catalogItemId)?.name
                      : 'Natural shell · nothing equipped'}
                  </p>
                </div>
                <HudButton
                  variant="secondary"
                  size="sm"
                  onClick={unequip}
                  disabled={saving || !wearing}
                >
                  Unequip
                </HudButton>
              </div>
              <p className="text-xs text-ink-muted">
                {matching.length
                  ? `${matching.length} owned ${matching.length === 1 ? 'piece' : 'pieces'} for this slot. `
                  : `You don't own any ${SLOT_NAMES[slot].toLowerCase()} gear yet. `}
                <Link
                  to="/character/shop"
                  search={{ slot: equipSlotCategory(slot) }}
                  className="text-cyan-glow hover:text-ink"
                >
                  Try on more in the shop
                </Link>
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
                {matching.map((c) => {
                  const owned = items.filter((i) => i.catalogItemId === c.id).length
                  return (
                    <GearPick
                      key={c.id}
                      catalog={c}
                      owned={owned}
                      worn={wearing?.catalogItemId === c.id}
                      selected={selected === c.id}
                      onClick={() => setSelected(c.id)}
                    />
                  )
                })}
              </div>
              {selectedCatalog && selectedCatalog.category === equipSlotCategory(slot) && (
                <>
                  {/* Floats above the Oracle bar on phones so the pick is one tap from the grid. */}
                  <div className="max-lg:sticky max-lg:bottom-3 max-lg:z-10 flex items-center justify-between gap-3 rounded-card max-lg:border max-lg:border-line max-lg:bg-surface-1/95 max-lg:backdrop-blur-md max-lg:p-2 max-lg:pl-3 max-lg:shadow-2xl">
                    <span className="min-w-0 lg:order-1">
                      <span className="lg:hidden block text-sm font-semibold text-ink truncate">
                        {selectedCatalog.name}
                      </span>
                      {statPreview && (
                        <BonusChange
                          from={gearTotals}
                          to={statPreview}
                          className="block text-[12px] text-ink-muted truncate"
                        />
                      )}
                    </span>
                    <HudButton
                      size="sm"
                      className="shrink-0 lg:order-2"
                      onClick={() => equip(selectedCatalog.id)}
                      disabled={saving}
                    >
                      {`Equip on ${SLOT_NAMES[slot].toLowerCase()}`}
                    </HudButton>
                  </div>
                  <GearDetail catalog={selectedCatalog} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {isGuest && (
        <AuthModal
          isOpen={authOpen}
          initialMode="signup"
          subtitle="Create a free account to keep your character"
          onClose={() => setAuthOpen(false)}
          onSuccess={() => setAuthOpen(false)}
        />
      )}
    </div>
  )
}

interface SlotSharedProps {
  active: EquipSlotId
  disabled?: boolean
  itemFor: (id: EquipSlotId) => CatalogRef | null
  onPick: (id: EquipSlotId) => void
}

function SlotButton({
  id,
  className = '',
  active,
  disabled,
  itemFor,
  onPick,
}: SlotSharedProps & { id: EquipSlotId; className?: string }) {
  const item = itemFor(id)
  const thumb = item ? item.appearanceKey || item.slug : null
  const selected = active === id
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`${SLOT_NAMES[id]} slot`}
      aria-pressed={selected}
      onClick={() => onPick(id)}
      className={`flex flex-col items-center gap-1 rounded-control border p-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
        selected
          ? 'border-cyan-glow bg-cyan-soft'
          : 'border-line-subtle bg-surface-1 hover:border-line-hover'
      } ${className}`}
    >
      <span className="grid place-items-center w-11 h-11 rounded-chip bg-abyss/70">
        {thumb ? (
          <GearIcon appearanceKey={thumb} className="w-11 h-11 rounded-chip overflow-hidden" />
        ) : (
          <span
            className="w-5 h-5 rounded-full border border-dashed border-line"
            aria-hidden="true"
          />
        )}
      </span>
      <span
        className={`text-[10.5px] leading-tight text-center ${selected ? 'text-ink font-semibold' : 'text-ink-muted'}`}
      >
        {SLOT_NAMES[id]}
      </span>
    </button>
  )
}

function SlotColumn({
  ids,
  className = '',
  ...shared
}: SlotSharedProps & { ids: EquipSlotId[]; className?: string }) {
  return (
    <div className={`flex-col gap-2 ${className}`} aria-label="Equipment slots">
      {ids.map((id) => (
        <SlotButton key={id} id={id} {...shared} />
      ))}
    </div>
  )
}

/** Calm item card: the item on a quiet tile, its name, and a small rarity mark. */
function GearPick({
  catalog,
  owned,
  worn,
  selected,
  onClick,
}: {
  catalog: CatalogRef
  owned: number
  worn: boolean
  selected: boolean
  onClick: () => void
}) {
  const thumb = catalog.appearanceKey || catalog.slug
  const rarity = RARITY_STYLES[catalog.rarity]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${catalog.name}${parseVariantKey(catalog.appearanceKey || catalog.slug).rarity ? ` (${catalog.rarity})` : ''}, ${CATEGORY_LABELS[catalog.category]}`}
      className={`relative flex flex-col gap-1.5 rounded-control border p-1.5 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow motion-reduce:transition-none ${
        selected
          ? 'border-cyan-glow bg-cyan-soft'
          : 'border-line-subtle bg-surface-2 hover:border-line-hover'
      }`}
    >
      <span className="grid place-items-center w-full aspect-square rounded-chip bg-abyss/70 overflow-hidden">
        <GearIcon appearanceKey={thumb} className="w-full h-full" />
      </span>
      <span className="text-[12px] leading-tight text-ink font-semibold line-clamp-2 min-h-[2lh]">
        {catalog.name}
      </span>
      <span className={`inline-flex items-center gap-1 capitalize text-[11px] ${rarity.text}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
        {catalog.rarity}
      </span>
      <span className="text-[11px] font-semibold text-cyan-glow tabular-nums">{primaryStatLine(catalog)}</span>
      <span className={`text-[11px] ${worn ? 'text-cyan-glow' : 'text-ink-muted'}`}>
        {worn
          ? 'Worn'
          : owned > 1
            ? `Owned ×${owned}`
            : 'Owned'}
      </span>
    </button>
  )
}
