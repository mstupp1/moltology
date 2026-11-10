import React, { useMemo, useState } from 'react'
import { baselineLook, type Avatar3DLook } from '@/lib/avatar3d/look'
import {
  AVATAR_ANTENNAE,
  AVATAR_ANTENNAE_LABELS,
  AVATAR_BUILD_LABELS,
  AVATAR_BUILDS,
  AVATAR_CLAW_LABELS,
  AVATAR_CLAWS,
  AVATAR_EXPRESSION_LABELS,
  AVATAR_HEAD_SHAPE_LABELS,
  AVATAR_HEAD_SHAPES,
  AVATAR_MOUTH_LABELS,
  AVATAR_MOUTHS,
  AVATAR_POSE_LABELS,
  AVATAR_POSES,
  AVATAR_RACE_LABELS,
  AVATAR_RACES,
  SHELL_FINISH_LABELS,
  SHELL_FINISHES,
  SHELL_MARKING_LABELS,
  SHELL_MARKINGS,
  SHELL_PALETTES,
} from '@/lib/avatar/traits'
import { AVATAR_EYE_COLORS, EYE_COLOR_SWATCH, type Expression } from '@/lib/avatar/parts'
import { STARTER_CHARACTER_EQUIPMENT } from '@/lib/avatar/starter-equipment'
import type { EquippedAppearance } from '@/lib/character-appearance'
import { EQUIP_SLOT_IDS, equipSlotCategory, type EquipSlotId } from '@/lib/chassis-loadout'
import { BASE_EQUIPMENT_CATALOG } from '@/lib/equipment-seed-data'
import { RARITY_LABELS, RARITY_ORDER, variantKey } from '@/lib/gear-variants'
import { HudSelect } from '@/components/ui/HudSelect'
import type { EquipmentRarity } from '@/db/schema'
import { cn } from '@/lib/utils'
import { Avatar3DStage } from './Avatar3DStage'

const EXPRESSIONS = Object.keys(AVATAR_EXPRESSION_LABELS) as Expression[]

const SLOT_LABELS: Record<EquipSlotId, string> = {
  head: 'Head',
  carapace: 'Chest',
  'claws-1': 'Left claw',
  'claws-2': 'Right claw',
  belt: 'Belt',
  legs: 'Legs',
  antennae: 'Antennae',
}

type GearPicks = Partial<Record<EquipSlotId, string>>

const SLOT_OPTIONS = Object.fromEntries(
  EQUIP_SLOT_IDS.map((slot) => [
    slot,
    [
      { value: '', label: 'Nothing' },
      ...BASE_EQUIPMENT_CATALOG.filter((item) => item.category === equipSlotCategory(slot)).map((item) => ({ value: item.appearanceKey || item.slug, label: item.name })),
    ],
  ]),
) as Record<EquipSlotId, { value: string; label: string }[]>

const STARTER_PICKS: GearPicks = Object.fromEntries(Object.entries(STARTER_CHARACTER_EQUIPMENT).map(([slot, item]) => [slot, item.visualKey]))

function Chips<T extends string>({ label, options, value, onChange, labels }: { label: string; options: readonly T[]; value: T; onChange: (v: T) => void; labels: Readonly<Record<string, string>> }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === value}
            onClick={() => onChange(option)}
            className={cn(
              'inline-flex min-h-8 items-center rounded-control px-2.5 text-xs font-medium transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
              option === value ? 'bg-surface-3 text-ink shadow-nav-current' : 'bg-surface-2 text-ink-muted hover:bg-surface-3/60 hover:text-ink',
            )}
          >
            {labels[option] ?? option}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function Swatches<T extends string>({ label, options, value, onChange }: { label: string; options: readonly { id: T; label: string; color: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            title={option.label}
            aria-label={option.label}
            aria-pressed={option.id === value}
            onClick={() => onChange(option.id)}
            style={{ backgroundColor: option.color }}
            className={cn(
              'h-8 w-8 rounded-full transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
              option.id === value ? 'scale-110 ring-2 ring-ink ring-offset-2 ring-offset-surface-1' : 'opacity-80 hover:opacity-100',
            )}
          />
        ))}
      </div>
    </fieldset>
  )
}

/** Admin preview of the 3D character builder: one live character and the options built so far. */
export function Avatar3DLab() {
  const [look, setLook] = useState<Avatar3DLook>(() => baselineLook('lobster'))
  const [spin, setSpin] = useState(false)
  const [gear, setGear] = useState<GearPicks>({})
  const [tier, setTier] = useState<EquipmentRarity>('common')
  const shown = useMemo<Avatar3DLook>(() => {
    const equipment: EquippedAppearance = {}
    for (const slot of EQUIP_SLOT_IDS) {
      const key = gear[slot]
      if (key) equipment[slot] = { visualKey: tier === 'common' ? key : variantKey(key, tier), rarity: tier }
    }
    return { ...look, equipment }
  }, [look, gear, tier])
  const set = <K extends keyof Avatar3DLook>(key: K, value: Avatar3DLook[K]) => setLook((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 lg:flex-row lg:gap-6" data-testid="avatar-3d-lab">
      <section className="relative h-[46vh] min-h-[300px] shrink-0 overflow-hidden rounded-card bg-surface-1 lg:h-auto lg:min-h-[520px] lg:flex-1">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(34,211,238,0.14),transparent_62%)]" />
        <Avatar3DStage look={shown} spin={spin} className="relative" />
        <p className="pointer-events-none absolute left-3 top-3 text-xs text-ink-muted">Drag to turn</p>
      </section>

      <section className="flex min-w-0 flex-col gap-4 overflow-y-auto rounded-card bg-surface-1 p-4 lg:w-[380px] lg:shrink-0">
        <div>
          <h1 className="text-base font-semibold text-ink">3D character preview</h1>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            An early look at the 3D character builder. Nothing here is saved, and your current character does not change.
          </p>
        </div>
        <Chips label="Species" options={AVATAR_RACES} value={look.race} onChange={(v) => set('race', v)} labels={AVATAR_RACE_LABELS} />
        <Chips label="Pose" options={AVATAR_POSES} value={look.pose} onChange={(v) => set('pose', v)} labels={AVATAR_POSE_LABELS} />
        <Swatches
          label="Shell colour"
          options={SHELL_PALETTES.map((p) => ({ id: p.id, label: p.label, color: p.base }))}
          value={look.palette.id}
          onChange={(id) => set('palette', SHELL_PALETTES.find((p) => p.id === id) ?? look.palette)}
        />
        <Chips label="Finish" options={SHELL_FINISHES} value={look.finish} onChange={(v) => set('finish', v)} labels={SHELL_FINISH_LABELS} />
        <Chips label="Pattern" options={SHELL_MARKINGS} value={look.marking} onChange={(v) => set('marking', v)} labels={SHELL_MARKING_LABELS} />
        <Chips label="Shell shape" options={AVATAR_HEAD_SHAPES} value={look.headShape} onChange={(v) => set('headShape', v)} labels={AVATAR_HEAD_SHAPE_LABELS[look.race]} />
        <Chips label="Build" options={AVATAR_BUILDS} value={look.build} onChange={(v) => set('build', v)} labels={AVATAR_BUILD_LABELS[look.race]} />
        <Chips label="Antennae" options={AVATAR_ANTENNAE} value={look.antennae} onChange={(v) => set('antennae', v)} labels={AVATAR_ANTENNAE_LABELS} />
        <Chips label="Claws" options={AVATAR_CLAWS} value={look.claws} onChange={(v) => set('claws', v)} labels={AVATAR_CLAW_LABELS} />
        <Chips label="Expression" options={EXPRESSIONS} value={look.expression} onChange={(v) => set('expression', v)} labels={AVATAR_EXPRESSION_LABELS} />
        <Chips label="Mouth" options={AVATAR_MOUTHS} value={look.mouth} onChange={(v) => set('mouth', v)} labels={AVATAR_MOUTH_LABELS} />
        <Swatches
          label="Eye colour"
          options={AVATAR_EYE_COLORS.map((id) => ({ id, label: id, color: EYE_COLOR_SWATCH[id].mid }))}
          value={look.eyeColor}
          onChange={(v) => set('eyeColor', v)}
        />
        <fieldset className="min-w-0">
          <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Gear</legend>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setGear(STARTER_PICKS)} className="inline-flex min-h-8 items-center rounded-control bg-surface-2 px-2.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-3/60 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow">
              Starter set
            </button>
            <button type="button" onClick={() => setGear({})} className="inline-flex min-h-8 items-center rounded-control bg-surface-2 px-2.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-3/60 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow">
              Take it all off
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {EQUIP_SLOT_IDS.map((slot) => (
              <HudSelect key={slot} fullWidth label={SLOT_LABELS[slot]} options={SLOT_OPTIONS[slot]} value={gear[slot] ?? ''} onChange={(e) => setGear((prev) => ({ ...prev, [slot]: e.target.value || undefined }))} />
            ))}
          </div>
        </fieldset>
        <Chips label="Gear tier" options={RARITY_ORDER} value={tier} onChange={setTier} labels={RARITY_LABELS} />
        <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={spin} onChange={(e) => setSpin(e.target.checked)} className="h-4 w-4 accent-cyan-glow" />
          Turn slowly
        </label>
      </section>
    </div>
  )
}

export default Avatar3DLab
