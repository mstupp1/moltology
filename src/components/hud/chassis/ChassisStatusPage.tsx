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
import { Atom } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { getAuthJWTToken } from '@/lib/jwt'
import { getChassisLoadoutFn, moveGearItemFn } from '@/lib/server/api'
import { useHudPersist } from '@/hooks/useHudPersist'
import {
  applyMoveUpdates,
  computeLoadoutTotals,
  emptyTotals,
  planGearMove,
  type CatalogRef,
  type GearItemState,
  type LoadoutTotals,
  type MoveTarget,
  VAULT_SIZE,
} from '@/lib/chassis-loadout'
import type { EquipmentCategory } from '@/db/schema'
import { HudBottomSheet } from '@/components/ui/HudBottomSheet'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'
import { ChassisStatusGhost } from '@/components/hud/HudGhostSkeletons'
import { GearDetail } from './GearDetail'
import { GearItemCard } from './GearItemCard'
import { LoadoutStatsPanel } from './LoadoutStatsPanel'
import { AbilitiesPanel } from './AbilitiesPanel'
import { PaperDoll } from './PaperDoll'
import { VaultGrid } from './VaultGrid'

function parseDropTarget(overId: string | number): MoveTarget | null {
  const id = String(overId)
  if (id.startsWith('equip:')) {
    const slot = id.slice('equip:'.length) as EquipmentCategory
    return { type: 'equip', slot }
  }
  if (id.startsWith('vault:')) {
    const index = Number(id.slice('vault:'.length))
    if (Number.isFinite(index)) return { type: 'vault', index }
  }
  return null
}

export const ChassisStatusPage: React.FC = () => {
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const userId = user?.id || user?.sub || null
  const persist = useHudPersist()

  const [catalog, setCatalog] = useState<CatalogRef[]>([])
  const [items, setItems] = useState<GearItemState[]>([])
  const [totals, setTotals] = useState<LoadoutTotals>(emptyTotals())
  const [vaultSize, setVaultSize] = useState(VAULT_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [detailItemId, setDetailItemId] = useState<string | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const catalogById = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const applyPayload = useCallback(
    (payload: {
      catalog: CatalogRef[]
      items: GearItemState[]
      totals: LoadoutTotals
      vaultSize: number
    }) => {
      setCatalog(payload.catalog)
      setItems(payload.items)
      setTotals(payload.totals)
      setVaultSize(payload.vaultSize)
    },
    []
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!userId) return
      setLoading(true)
      setError(null)
      try {
        const token = await getAuthJWTToken()
        const payload = await getChassisLoadoutFn({
          data: { token: token ?? undefined, userId },
        })
        if (!cancelled) applyPayload(payload)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Chassis loadout could not be retrieved.')
        }
      } finally {
        if (!cancelled) setLoading(false)
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
      if (id && id === selectedItemId) {
        setDetailItemId(id)
        return
      }
      setSelectedItemId(id)
      if (id) setDetailItemId(id)
    },
    [selectedItemId]
  )

  const handleSlotActivate = useCallback(
    (slot: EquipmentCategory) => {
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

  const dragCatalog = useMemo(() => {
    const item = items.find((i) => i.id === activeDragId)
    if (!item) return null
    return catalogById.get(item.catalogItemId) ?? null
  }, [items, activeDragId, catalogById])

  if (error && !loading) {
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
      <HudGhostWidget isLoading={loading} skeleton={<ChassisStatusGhost />}>
        <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex flex-col flex-1 min-h-0 h-full font-sans relative min-w-0 w-full">
          {/* Top header banner — matches pipeline / forum page chrome */}
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#0b1011]/85 via-[#0f1616]/85 to-[#0b1011]/85 backdrop-blur-md border-l-4 border-l-[#00ffff] border border-[#3a4a49] p-3.5 sm:p-4 md:p-5 chamfer-corner shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="text-[10px] text-[#00ffff] font-sans tracking-widest uppercase flex items-center gap-1.5 font-bold">
                <Atom className="w-3.5 h-3.5 text-[#00ffff]" />
                Hardware & Armor
              </div>
              <h1 className="font-grotesk font-bold text-xl text-[#dfe3e3] tracking-wide uppercase">
                Chassis Status
              </h1>
              <p className="text-xs text-[#839493] font-sans mt-0.5">
                Equip plating across five hardpoints. Drag gear between the vault and your slots, or tap
                to select and tap a target to seat it.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,14rem)] flex-1 min-h-0 gap-3.5 sm:gap-5 min-w-0 mt-3.5 sm:mt-5">
            <div className="order-2 md:order-1 hidden md:flex md:flex-col md:min-h-0">
              <LoadoutStatsPanel totals={totals} variant="panel" />
            </div>

            <div className="order-1 md:order-2 flex flex-col flex-1 min-h-0 gap-3.5 sm:gap-5 min-w-0">
              <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl flex flex-col flex-1 min-h-[12rem] md:min-h-0">
                <PaperDoll
                  items={items}
                  catalogById={catalogById}
                  selectedItemId={selectedItemId}
                  onSelectItem={handleSelectItem}
                  onSlotActivate={handleSlotActivate}
                />
              </div>

              <div className="md:hidden space-y-3.5 shrink-0">
                <LoadoutStatsPanel totals={totals} variant="strip" />
                <AbilitiesPanel variant="strip" />
              </div>

              <div className="chitin-card p-3 sm:p-4 md:p-5 chamfer-corner shadow-2xl shrink-0">
                <VaultGrid
                  items={items}
                  catalogById={catalogById}
                  vaultSize={vaultSize}
                  selectedItemId={selectedItemId}
                  onSelectItem={handleSelectItem}
                  onCellActivate={handleCellActivate}
                />
              </div>

              {selectedItemId && (
                <p className="text-[10px] text-center text-[#00ffff]/80 uppercase tracking-widest shrink-0">
                  Gear selected — tap an empty slot or vault cell to seat it
                </p>
              )}

              {detailCatalog && (
                <div className="hidden md:block chitin-card chamfer-corner shadow-2xl overflow-hidden max-w-lg shrink-0">
                  <GearDetail catalog={detailCatalog} />
                </div>
              )}
            </div>

            <div className="order-3 hidden md:flex md:flex-col md:min-h-0">
              <AbilitiesPanel variant="panel" />
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {dragCatalog ? (
            <div className="w-16 sm:w-20 pointer-events-none">
              <GearItemCard catalog={dragCatalog} />
            </div>
          ) : null}
        </DragOverlay>

        <div className="md:hidden">
          <HudBottomSheet
            isOpen={Boolean(detailCatalog)}
            onClose={() => setDetailItemId(null)}
            title={detailCatalog?.name ?? 'Gear'}
            ariaLabel="Gear detail"
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
    </HudGhostWidget>
    </div>
  )
}
