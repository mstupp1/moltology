import React, { useEffect, useMemo, useRef, useState } from 'react'
import { HudTitlePanel } from '../HudTitlePanel'
import { HudWorkspaceGhost } from '../HudGhostSkeletons'
import { HudButton } from '@/components/ui/HudButton'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useHudPersist } from '@/hooks/useHudPersist'
import { getAuthJWTToken } from '@/lib/jwt'
import { getChassisLoadoutFn, saveCharacterFn } from '@/lib/server/api'
import {
  LOBSTER_AVATAR_STYLE,
  clearCachedProfileAvatarUrl,
  type LobsterAvatarConfig,
} from '@/lib/lobster-avatar'
import {
  applyMoveUpdates,
  planGearMove,
  findFirstFreeVaultIndex,
  computeLoadoutTotals,
  EQUIP_SLOT_IDS,
  equipSlotCategory,
  CATEGORY_LABELS,
  getCachedChassisLoadout,
  setCachedChassisLoadout,
  type ChassisLoadoutPayload,
  type EquipSlotId,
  type GearItemState,
} from '@/lib/chassis-loadout'
import { equipmentAppearance } from '@/lib/character-appearance'
import { AvatarCreatorPanel } from '../avatar/AvatarCreatorPanel'
import { AvatarCreatorPreview } from '../avatar/AvatarCreatorPreview'
import { GearItemCard } from './GearItemCard'
import { GearDetail } from './GearDetail'

const TABS = ['body', 'face', 'equipment', 'scene'] as const
export const SLOT_NAMES: Record<EquipSlotId, string> = {
  head: 'Head',
  carapace: 'Carapace',
  belt: 'Belt',
  legs: 'Legs',
  antennae: 'Antennae',
  'claws-1': 'Right pincer',
  'claws-2': 'Left pincer',
}

/** One local draft. A catalog try-on is deliberately separate from owned placements. */
export const ChassisStatusPage: React.FC = () => {
  const { userId } = useAuthSession()
  const toast = useOptionalToast()?.toast
  const persist = useHudPersist()
  const [saved, setSaved] = useState<ChassisLoadoutPayload | null>(() =>
    userId ? getCachedChassisLoadout(userId) : null,
  )
  const [config, setConfig] = useState<LobsterAvatarConfig | null>(null)
  const [items, setItems] = useState<GearItemState[]>([])
  const [tab, setTab] = useState<(typeof TABS)[number]>('equipment')
  const [slot, setSlot] = useState<EquipSlotId>('head')
  const [selected, setSelected] = useState<string | null>(null)
  const [tryOn, setTryOn] = useState<{ catalogId: string; slot: EquipSlotId } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [onlyOwned, setOnlyOwned] = useState(false)
  const draftTouched = useRef(false)
  const canonicalRevision = useRef(0)
  const [reload, setReload] = useState(0)
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
    setTryOn(null)
    if (userId) setCachedChassisLoadout(userId, payload)
  }
  useEffect(() => {
    let cancelled = false
    setError(null)
    setSelected(null)
    setTryOn(null)
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
        const payload = await getChassisLoadoutFn({ data: { userId, token: token ?? undefined } })
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
  }, [userId, reload])
  const catalog = saved?.catalog ?? []
  const catalogById = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog])
  const equipped = useMemo(() => equipmentAppearance(items, catalog), [items, catalog])
  const preview = useMemo(() => {
    if (!config) return null
    const equipment = { ...equipped }
    const c = tryOn ? catalogById.get(tryOn.catalogId) : null
    if (tryOn && c)
      equipment[tryOn.slot] = { visualKey: c.appearanceKey || c.slug, rarity: c.rarity }
    return { ...config, equipment }
  }, [config, equipped, tryOn, catalogById])
  const dirty = Boolean(
    saved &&
    config &&
    (JSON.stringify({ ...config, equipment: undefined }) !==
      JSON.stringify({ ...baseConfig(saved), equipment: undefined }) ||
      JSON.stringify(items) !== JSON.stringify(saved.items)),
  )
  const selectedCatalog = selected ? catalogById.get(selected) : null
  const matching = catalog.filter(
    (c) =>
      c.category === equipSlotCategory(slot) &&
      (!onlyOwned || items.some((i) => i.catalogItemId === c.id)),
  )
  const equip = (catalogId: string) => {
    const instance =
      items.find((i) => i.catalogItemId === catalogId && !i.equippedSlot) ??
      items.find((i) => i.catalogItemId === catalogId && i.equippedSlot !== slot) ??
      items.find((i) => i.catalogItemId === catalogId)
    if (!instance) {
      setTryOn({ catalogId, slot })
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
    setTryOn(null)
  }
  const unequip = () => {
    const item = items.find((i) => i.equippedSlot === slot)
    if (!item) return
    const index = findFirstFreeVaultIndex(items, saved?.vaultSize)
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
    setTryOn(null)
  }
  const save = async () => {
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
          placements: items.map((i) => ({
            id: i.id,
            equippedSlot: i.equippedSlot,
            vaultIndex: i.vaultIndex,
          })),
        },
      })
      accept(payload)
      setError(null)
      clearCachedProfileAvatarUrl(userId)
      window.dispatchEvent(new CustomEvent('profile-avatar-changed'))
      toast?.success('Character saved.')
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
  return (
    <div className="space-y-3.5 sm:space-y-5 font-sans relative" data-testid="character-workspace">
      <HudTitlePanel
        title="Your character"
        eyebrow="Character studio"
        description="Shape your shell. Find your fit."
        actions={
          <div className="flex gap-2">
            <HudButton
              variant="secondary"
              disabled={saving || (!dirty && !tryOn)}
              onClick={() => accept(saved)}
            >
              Discard
            </HudButton>
            <HudButton disabled={saving || !dirty} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save changes'}
            </HudButton>
          </div>
        }
      />
      {error && (
        <div role="alert" className="text-crimson-text">
          {error}{' '}
          <button type="button" className="underline" onClick={() => setReload((n) => n + 1)}>
            Reload character
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,1fr)] gap-4 lg:gap-6 items-start">
        <div className="lg:sticky lg:top-4 space-y-3">
          <AvatarCreatorPreview config={preview} className="max-w-[640px] mx-auto" />
          {tryOn && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 px-3 py-2 border border-cyan-glow/30 bg-cyan-soft rounded-control text-sm"
            >
              <span>Preview only · {catalogById.get(tryOn.catalogId)?.name}</span>
              <button type="button" className="underline shrink-0" onClick={() => setTryOn(null)}>
                End preview
              </button>
            </div>
          )}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5" aria-label="Equipment slots">
            {EQUIP_SLOT_IDS.map((id) => (
              <button
                type="button"
                key={id}
                disabled={saving}
                aria-label={`${SLOT_NAMES[id]} slot`}
                aria-pressed={slot === id}
                onClick={() => {
                  setSlot(id)
                  setTab('equipment')
                  setSelected(null)
                  setTryOn(null)
                }}
                className={`rounded-control border px-1.5 py-2 text-[11px] min-h-12 ${slot === id ? 'border-cyan-glow bg-cyan-soft text-ink' : 'border-line text-ink-muted bg-surface-1'}`}
              >
                <span className="block font-semibold">{SLOT_NAMES[id]}</span>
                <span className="block truncate mt-1 opacity-70">
                  {equipped[id]
                    ? catalogById.get(items.find((i) => i.equippedSlot === id)?.catalogItemId ?? '')
                        ?.name
                    : 'Empty'}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl space-y-4">
          <div role="tablist" aria-label="Character editor" className="flex border-b border-line">
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                aria-controls="character-controls"
                onClick={() => {
                  setTab(id)
                  setTryOn(null)
                }}
                className={`flex-1 py-3 text-sm capitalize border-b-2 ${tab === id ? 'border-cyan-glow text-ink' : 'border-transparent text-ink-muted'}`}
              >
                {id}
              </button>
            ))}
          </div>
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
              <div className="space-y-4">
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
                <label className="flex gap-2 items-center text-xs text-ink-muted">
                  <input
                    type="checkbox"
                    checked={onlyOwned}
                    onChange={(e) => setOnlyOwned(e.target.checked)}
                  />
                  Owned items only
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {matching.map((c) => {
                    const owned = items.filter((i) => i.catalogItemId === c.id).length
                    return (
                      <div key={c.id} className="space-y-1">
                        <GearItemCard
                          catalog={c}
                          selected={selected === c.id}
                          onClick={() => setSelected(c.id)}
                        />
                        <p className="text-[11px] text-ink-muted text-center">
                          {owned ? `Owned${owned > 1 ? ` ×${owned}` : ''}` : 'Preview only'}
                        </p>
                      </div>
                    )
                  })}
                </div>
                {selectedCatalog && selectedCatalog.category === equipSlotCategory(slot) && (
                  <div className="space-y-3">
                    <GearDetail catalog={selectedCatalog} />
                    <HudButton onClick={() => equip(selectedCatalog.id)} disabled={saving}>
                      {items.some((i) => i.catalogItemId === selectedCatalog.id)
                        ? `Equip on ${SLOT_NAMES[slot].toLowerCase()}`
                        : 'Try on'}
                    </HudButton>
                  </div>
                )}
                <p className="text-xs text-ink-muted">
                  {items.length} owned items · {items.filter((i) => !i.equippedSlot).length}/
                  {saved.vaultSize} vault spaces used. Other designs are available to preview.
                </p>
              </div>
            )}
          </div>
          <details className="border-t border-line pt-3 text-xs text-ink-muted">
            <summary className="cursor-pointer">Loadout stats · character flavor</summary>
            <div className="grid grid-cols-2 gap-2 pt-3">
              {Object.entries(computeLoadoutTotals(items, catalogById)).map(([key, value]) => (
                <p key={key} className="capitalize">
                  {key}: {value}
                </p>
              ))}
            </div>
            <p className="pt-2">Equipment values do not affect activities or progression.</p>
          </details>
        </div>
      </div>
    </div>
  )
}
