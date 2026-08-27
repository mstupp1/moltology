import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { getChassisLoadoutFn, moveGearItemFn } from '@/lib/server/api'
import { useHudPersist } from '@/hooks/useHudPersist'
import {
  applyMoveUpdates,
  computeLoadoutTotals,
  deriveSynapticAbilities,
  emptyTotals,
  getCachedChassisLoadout,
  planGearMove,
  setCachedChassisLoadout,
  type CatalogRef,
  type ChassisLoadoutPayload,
  type GearItemState,
  type LoadoutTotals,
  type MoveTarget,
  VAULT_SIZE,
} from '@/lib/chassis-loadout'
import type { EquipSlotId } from '@/lib/chassis-loadout'
import { HudBottomSheet } from '@/components/ui/HudBottomSheet'
import { GearDetail } from './GearDetail'
import { GearItemCard } from './GearItemCard'
import { GearTooltipFloating } from './GearTooltip'
import type { GearHoverTarget } from './gear-tooltip-position'
import { LoadoutStatsPanel } from './LoadoutStatsPanel'
import { AbilitiesPanel } from './AbilitiesPanel'
import { PaperDoll } from './PaperDoll'
import { VaultGrid } from './VaultGrid'

function parseDropTarget(overId: string | number): MoveTarget | null {
  const id = String(overId)
  if (id.startsWith('equip:')) {
    const slot = id.slice('equip:'.length) as EquipSlotId
    return { type: 'equip', slot }
  }
  if (id.startsWith('vault:')) {
    const index = Number(id.slice('vault:'.length))
    if (Number.isFinite(index)) return { type: 'vault', index }
  }
  return null
}

export const ChassisStatusPage: React.FC = () => {
  const session = useAuthSession()
  const user = session.user
  const userId = session.userId
  const persist = useHudPersist()

  const cached = userId ? getCachedChassisLoadout(userId) : null

  const [catalog, setCatalog] = useState<CatalogRef[]>(() => cached?.catalog ?? [])
  const [items, setItems] = useState<GearItemState[]>(() => cached?.items ?? [])
  const [totals, setTotals] = useState<LoadoutTotals>(() => cached?.totals ?? emptyTotals())
  const [vaultSize, setVaultSize] = useState(() => cached?.vaultSize ?? VAULT_SIZE)
  const [error, setError] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [detailItemId, setDetailItemId] = useState<string | null>(null)
  const [hoverTarget, setHoverTarget] = useState<GearHoverTarget | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(max-width: 767px)')
    const updateMobile = () => setIsMobile(media.matches)
    updateMobile()
    if (media.addEventListener) {
      media.addEventListener('change', updateMobile)
      return () => media.removeEventListener('change', updateMobile)
    } else if ((media as any).addListener) {
      ;(media as any).addListener(updateMobile)
      return () => (media as any).removeListener(updateMobile)
    }
  }, [])

  const catalogById = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog])
  const abilities = useMemo(
    () => deriveSynapticAbilities(items, catalogById),
    [items, catalogById]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const applyPayload = useCallback(
    (payload: ChassisLoadoutPayload) => {
      setCatalog(payload.catalog)
      setItems(payload.items)
      setTotals(payload.totals)
      setVaultSize(payload.vaultSize)
      if (userId) setCachedChassisLoadout(userId, payload)
    },
    [userId]
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!userId) return

      const sessionCache = getCachedChassisLoadout(userId)
      if (sessionCache && !cancelled) {
        applyPayload(sessionCache)
      }

      try {
        const token = await getAuthJWTToken()
        const payload = await getChassisLoadoutFn({
          data: { token: token ?? undefined, userId },
        })
        if (!cancelled) {
          applyPayload(payload)
          setError(null)
        }
      } catch (e) {
        if (!cancelled && !getCachedChassisLoadout(userId)) {
          setError(e instanceof Error ? e.message : 'Chassis loadout could not be retrieved.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, applyPayload])

  const persistMove = useCallback(
    async (itemId: string, target: MoveTarget) => {
      const plan = planGearMove(items, catalogById, itemId, target, vaultSize)
      if (!plan.ok) {
        toast.warning(plan.error, { position: 'bottom-center' })
        return
      }
      if (plan.updates.length === 0) return

      const prevItems = items
      const nextItems = applyMoveUpdates(items, plan.updates)
      setItems(nextItems)
      setTotals(computeLoadoutTotals(nextItems, catalogById))

      persist.begin('chassis-gear')
      try {
        const token = await getAuthJWTToken()
        const payload = await moveGearItemFn({
          data: {
            itemId,
            target,
            token: token ?? undefined,
            userId: userId ?? undefined,
          },
        })
        applyPayload(payload)
      } catch (e) {
        setItems(prevItems)
        setTotals(computeLoadoutTotals(prevItems, catalogById))
        toast.warning(
          e instanceof Error ? e.message : 'Gear could not be rearranged. Try again.',
          { position: 'bottom-center' }
        )
      } finally {
        persist.end('chassis-gear')
      }
    },
    [items, catalogById, vaultSize, persist, userId, applyPayload]
  )

  const handleSelectItem = useCallback(
    (id: string | null) => {
      setSelectedItemId(id)
      if (isMobile && id) {
        setDetailItemId(id)
      } else {
        setDetailItemId(null)
      }
    },
    [isMobile]
  )

  const handleSlotActivate = useCallback(
    (slot: EquipSlotId) => {
      if (!selectedItemId) return
      void persistMove(selectedItemId, { type: 'equip', slot })
      setSelectedItemId(null)
    },
    [selectedItemId, persistMove]
  )

  const handleCellActivate = useCallback(
    (index: number) => {
      if (!selectedItemId) return
      void persistMove(selectedItemId, { type: 'vault', index })
      setSelectedItemId(null)
    },
    [selectedItemId, persistMove]
  )

  const onDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id)
    if (id.startsWith('item:')) {
      setActiveDragId(id.slice('item:'.length))
      setSelectedItemId(id.slice('item:'.length))
    }
  }

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return
    const itemId = String(active.id).startsWith('item:')
      ? String(active.id).slice('item:'.length)
      : null
    if (!itemId) return
    const target = parseDropTarget(over.id)
    if (!target) return
    void persistMove(itemId, target)
  }

  const onDragCancel = () => setActiveDragId(null)

  const detailCatalog = useMemo(() => {
    const item = items.find((i) => i.id === detailItemId)
    if (!item) return null
    return catalogById.get(item.catalogItemId) ?? null
  }, [items, detailItemId, catalogById])

  const hoverCatalog = useMemo(() => {
    const item = items.find((i) => i.id === hoverTarget?.itemId)
    if (!item) return null
    return catalogById.get(item.catalogItemId) ?? null
  }, [items, hoverTarget, catalogById])

  const dragCatalog = useMemo(() => {
    const item = items.find((i) => i.id === activeDragId)
    if (!item) return null
    return catalogById.get(item.catalogItemId) ?? null
  }, [items, activeDragId, catalogById])

  if (error && catalog.length === 0 && items.length === 0) {
    return (
      <div className="flex flex-col flex-1 min-h-0 h-full font-sans relative">
        <div className="chitin-card p-4 chamfer-corner border border-[#ff5540]/40 bg-[#1a0808] text-[#ff5540] text-sm">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full">
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex flex-col flex-1 min-h-0 h-full font-sans relative min-w-0 w-full">
          <div className="flex flex-col md:grid md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,14rem)] flex-1 min-h-0 gap-3.5 sm:gap-5 min-w-0">
            <div className="order-2 md:order-1 hidden md:flex md:flex-col md:min-h-0">
              <LoadoutStatsPanel totals={totals} variant="panel" />
            </div>

            <div className="order-1 md:order-2 flex flex-col flex-1 min-h-0 gap-3.5 sm:gap-5 min-w-0">
              <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl flex flex-col flex-1 min-h-[12rem] md:min-h-0 overflow-hidden">
                <PaperDoll
                  items={items}
                  catalogById={catalogById}
                  selectedItemId={selectedItemId}
                  onSelectItem={handleSelectItem}
                  onSlotActivate={handleSlotActivate}
                  onHoverItem={setHoverTarget}
                />
              </div>

              <div className="md:hidden space-y-3.5 shrink-0">
                <LoadoutStatsPanel totals={totals} variant="strip" />
                <AbilitiesPanel abilities={abilities} variant="strip" />
              </div>

              <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl shrink-0 overflow-hidden min-w-0">
                <VaultGrid
                  items={items}
                  catalogById={catalogById}
                  vaultSize={vaultSize}
                  selectedItemId={selectedItemId}
                  onSelectItem={handleSelectItem}
                  onCellActivate={handleCellActivate}
                  onHoverItem={setHoverTarget}
                />
              </div>
            </div>

            <div className="order-3 hidden md:flex md:flex-col md:min-h-0">
              <AbilitiesPanel abilities={abilities} variant="panel" />
            </div>
          </div>
        </div>

        {hoverCatalog && hoverTarget && (
          <GearTooltipFloating catalog={hoverCatalog} anchor={hoverTarget.anchor} />
        )}

        <DragOverlay dropAnimation={null}>
          {dragCatalog ? (
            <div className="w-16 sm:w-20 pointer-events-none">
              <GearItemCard catalog={dragCatalog} />
            </div>
          ) : null}
        </DragOverlay>

        <div className="md:hidden">
          <HudBottomSheet
            isOpen={isMobile && Boolean(detailCatalog)}
            onClose={() => setDetailItemId(null)}
            title={detailCatalog?.name ?? 'Gear'}
            ariaLabel="Gear detail"
            containerClassName="md:hidden"
          >
            {detailCatalog && <GearDetail catalog={detailCatalog} />}
            {detailCatalog && (
              <p className="px-3 pb-4 text-[10px] text-[#839493] uppercase tracking-widest">
                Close, then drag or tap a hardpoint to equip
              </p>
            )}
          </HudBottomSheet>
        </div>
      </DndContext>
    </div>
  )
}
