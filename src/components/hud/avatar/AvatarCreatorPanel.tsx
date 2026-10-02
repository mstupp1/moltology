import React, { useMemo, useState } from 'react'
import { Dices } from 'lucide-react'
import {
  AVATAR_ACCESSORIES,
  AVATAR_ACCESSORY_LABELS,
  AVATAR_ANTENNAE,
  AVATAR_ANTENNAE_LABELS,
  AVATAR_CLAWS,
  AVATAR_CLAW_LABELS,
  AVATAR_EXPRESSION_LABELS,
  AVATAR_MOUTHS,
  AVATAR_MOUTH_LABELS,
  AVATAR_POSES,
  AVATAR_POSE_LABELS,
  AVATAR_RACES,
  AVATAR_RACE_LABELS,
  LOBSTER_BACKGROUND_PATTERNS,
  LOBSTER_BACKGROUND_THEMES,
  LOBSTER_EYELID_STYLES,
  LOBSTER_EYE_COLORS,
  LOBSTER_EYE_COLOR_LABELS,
  LOBSTER_EYE_VARIANTS,
  LOBSTER_EYE_VARIANT_LABELS,
  LOBSTER_HEIGHTS,
  LOBSTER_HEIGHT_LABELS,
  LOBSTER_PUPIL_VARIANTS,
  LOBSTER_PUPIL_VARIANT_LABELS,
  SHELL_FINISHES,
  SHELL_FINISH_LABELS,
  SHELL_MARKINGS,
  SHELL_MARKING_LABELS,
  SHELL_PALETTES,
  generateLobsterAvatarDataUri,
  rerollAvatarConfig,
  resolveAvatarTraits,
  type AvatarRace,
  type LobsterAvatarConfig,
  type ResolvedAvatarTraits,
} from '@/lib/lobster-avatar'
import { EYE_COLOR_SWATCH } from '@/lib/avatar/parts'

export interface AvatarCreatorPanelProps {
  value: LobsterAvatarConfig
  onChange: (next: LobsterAvatarConfig) => void
  disabled?: boolean
  className?: string
}

const TABS = [
  { id: 'body', label: 'Body' },
  { id: 'face', label: 'Face' },
  { id: 'gear', label: 'Gear' },
  { id: 'scene', label: 'Scene' },
] as const
type TabId = (typeof TABS)[number]['id']

function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-1.5 min-w-0">
      <legend className="text-[10px] font-grotesk font-bold tracking-wider uppercase text-[#7ea6a6] mb-1.5">{label}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  )
}

function Chip({
  selected,
  onClick,
  disabled,
  children,
}: {
  selected: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md border text-[11px] font-sans transition-colors disabled:opacity-50 ${
        selected
          ? 'border-[#00ffff]/70 bg-[#00ffff]/15 text-[#e6ffff] shadow-[0_0_10px_rgba(0,255,255,0.15)]'
          : 'border-white/10 bg-[#04111a]/70 text-[#9bbbbb] hover:border-[#00ffff]/40 hover:text-[#dfe3e3]'
      }`}
    >
      {children}
    </button>
  )
}

function Swatch({
  selected,
  onClick,
  disabled,
  label,
  background,
}: {
  selected: boolean
  onClick: () => void
  disabled?: boolean
  label: string
  background: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`w-8 h-8 rounded-full border-2 transition-transform disabled:opacity-50 ${
        selected
          ? 'border-[#00ffff] scale-110 shadow-[0_0_12px_rgba(0,255,255,0.45)]'
          : 'border-white/15 hover:scale-105 hover:border-white/40'
      }`}
      style={{ background }}
    />
  )
}

/**
 * Character creator controls. Every choice is written straight into the config,
 * so the preview next to it updates as the member taps.
 */
export const AvatarCreatorPanel: React.FC<AvatarCreatorPanelProps> = ({ value, onChange, disabled = false, className = '' }) => {
  const [tab, setTab] = useState<TabId>('body')
  const traits = useMemo(() => resolveAvatarTraits(value), [value])

  const set = <K extends keyof ResolvedAvatarTraits>(key: K, next: ResolvedAvatarTraits[K]) => {
    // Pin the resolved look first so changing one trait never reshuffles the others.
    onChange({ ...value, ...traits, [key]: next })
  }

  const racePreviews = useMemo(() => {
    const out: Partial<Record<AvatarRace, string | null>> = {}
    for (const race of AVATAR_RACES) {
      out[race] = generateLobsterAvatarDataUri({ ...value, ...traits, race, accessory: 'none' }, 128, { frame: 'portrait' })
    }
    return out
  }, [value, traits])

  return (
    <div className={`w-full space-y-3 ${className}`} data-testid="avatar-creator-panel">
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Race">
        {AVATAR_RACES.map((race) => {
          const selected = traits.race === race
          return (
            <button
              key={race}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => set('race', race)}
              className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-colors disabled:opacity-50 ${
                selected
                  ? 'border-[#00ffff]/70 bg-[#00ffff]/10 shadow-[0_0_14px_rgba(0,255,255,0.18)]'
                  : 'border-white/10 bg-[#04111a]/70 hover:border-[#00ffff]/40'
              }`}
            >
              {racePreviews[race] ? (
                <img src={racePreviews[race] ?? undefined} alt="" width={40} height={40} className="w-10 h-10 rounded-full bg-[#020810]" />
              ) : null}
              <span className={`font-grotesk text-sm font-bold ${selected ? 'text-[#00ffff]' : 'text-[#dfe3e3]'}`}>
                {AVATAR_RACE_LABELS[race]}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <div role="tablist" aria-label="Customize" className="flex flex-1 rounded-lg border border-white/10 bg-[#020a10]/80 p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-1.5 rounded-md text-[11px] font-grotesk font-bold tracking-wider uppercase transition-colors ${
                tab === t.id ? 'bg-[#00ffff]/15 text-[#00ffff]' : 'text-[#7ea6a6] hover:text-[#dfe3e3]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(rerollAvatarConfig(value))}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#00ffff]/40 bg-[#00ffff]/10 hover:bg-[#00ffff]/20 text-[#00ffff] text-[11px] font-semibold tracking-wider uppercase transition-colors active:scale-95 disabled:opacity-50"
        >
          <Dices className="w-3.5 h-3.5" />
          Surprise me
        </button>
      </div>

      <div role="tabpanel" className="space-y-3 rounded-xl border border-white/10 bg-[#030d14]/70 p-3">
        {tab === 'body' && (
          <>
            <OptionGroup label="Shell color">
              {SHELL_PALETTES.map((p) => (
                <Swatch
                  key={p.id}
                  label={p.label}
                  selected={traits.shellColor === p.id}
                  disabled={disabled}
                  onClick={() => set('shellColor', p.id)}
                  background={`radial-gradient(circle at 35% 30%, ${p.highlight} 0%, ${p.base} 48%, ${p.shade} 100%)`}
                />
              ))}
            </OptionGroup>
            <OptionGroup label="Finish">
              {SHELL_FINISHES.map((f) => (
                <Chip key={f} selected={traits.shellFinish === f} disabled={disabled} onClick={() => set('shellFinish', f)}>
                  {SHELL_FINISH_LABELS[f]}
                </Chip>
              ))}
            </OptionGroup>
            <OptionGroup label="Pattern">
              {SHELL_MARKINGS.map((m) => (
                <Chip key={m} selected={traits.marking === m} disabled={disabled} onClick={() => set('marking', m)}>
                  {SHELL_MARKING_LABELS[m]}
                </Chip>
              ))}
            </OptionGroup>
            <OptionGroup label="Height">
              {LOBSTER_HEIGHTS.map((h) => (
                <Chip key={h} selected={traits.height === h} disabled={disabled} onClick={() => set('height', h)}>
                  {LOBSTER_HEIGHT_LABELS[h]}
                </Chip>
              ))}
            </OptionGroup>
          </>
        )}

        {tab === 'face' && (
          <>
            <OptionGroup label="Eye color">
              {LOBSTER_EYE_COLORS.map((c) => {
                const s = EYE_COLOR_SWATCH[c]
                return (
                  <Swatch
                    key={c}
                    label={LOBSTER_EYE_COLOR_LABELS[c]}
                    selected={traits.eyeColor === c}
                    disabled={disabled}
                    onClick={() => set('eyeColor', c)}
                    background={`radial-gradient(circle at 50% 60%, #07070c 0 22%, ${s.inner} 26%, ${s.mid} 55%, ${s.outer} 82%, ${s.ring} 100%)`}
                  />
                )
              })}
            </OptionGroup>
            <OptionGroup label="Expression">
              {LOBSTER_EYELID_STYLES.map((e) => (
                <Chip key={e} selected={traits.eyelidStyle === e} disabled={disabled} onClick={() => set('eyelidStyle', e)}>
                  {AVATAR_EXPRESSION_LABELS[e]}
                </Chip>
              ))}
            </OptionGroup>
            <OptionGroup label="Mouth">
              {AVATAR_MOUTHS.map((m) => (
                <Chip key={m} selected={traits.mouth === m} disabled={disabled} onClick={() => set('mouth', m)}>
                  {AVATAR_MOUTH_LABELS[m]}
                </Chip>
              ))}
            </OptionGroup>
            <OptionGroup label="Eye shape">
              {LOBSTER_EYE_VARIANTS.map((v) => (
                <Chip key={v} selected={traits.eyeVariant === v} disabled={disabled} onClick={() => set('eyeVariant', v)}>
                  {LOBSTER_EYE_VARIANT_LABELS[v]}
                </Chip>
              ))}
            </OptionGroup>
            <OptionGroup label="Pupils">
              {LOBSTER_PUPIL_VARIANTS.map((v) => (
                <Chip key={v} selected={traits.pupilVariant === v} disabled={disabled} onClick={() => set('pupilVariant', v)}>
                  {LOBSTER_PUPIL_VARIANT_LABELS[v]}
                </Chip>
              ))}
            </OptionGroup>
          </>
        )}

        {tab === 'gear' && (
          <>
            <OptionGroup label="Headwear">
              {AVATAR_ACCESSORIES.map((a) => (
                <Chip key={a} selected={traits.accessory === a} disabled={disabled} onClick={() => set('accessory', a)}>
                  {AVATAR_ACCESSORY_LABELS[a]}
                </Chip>
              ))}
            </OptionGroup>
            <OptionGroup label="Antennae">
              {AVATAR_ANTENNAE.map((a) => (
                <Chip key={a} selected={traits.antennae === a} disabled={disabled} onClick={() => set('antennae', a)}>
                  {AVATAR_ANTENNAE_LABELS[a]}
                </Chip>
              ))}
            </OptionGroup>
            <OptionGroup label="Claws">
              {AVATAR_CLAWS.map((c) => (
                <Chip key={c} selected={traits.claws === c} disabled={disabled} onClick={() => set('claws', c)}>
                  {AVATAR_CLAW_LABELS[c]}
                </Chip>
              ))}
            </OptionGroup>
            <OptionGroup label="Pose">
              {AVATAR_POSES.map((p) => (
                <Chip key={p} selected={traits.pose === p} disabled={disabled} onClick={() => set('pose', p)}>
                  {AVATAR_POSE_LABELS[p]}
                </Chip>
              ))}
            </OptionGroup>
          </>
        )}

        {tab === 'scene' && (
          <>
            <OptionGroup label="Backdrop">
              {LOBSTER_BACKGROUND_THEMES.map((t) => (
                <Swatch
                  key={t.id}
                  label={t.label}
                  selected={traits.backgroundTheme === t.id}
                  disabled={disabled}
                  onClick={() => set('backgroundTheme', t.id)}
                  background={`radial-gradient(circle at 50% 35%, ${t.secondaryColor} 0%, ${t.topColor} 55%, ${t.bottomColor} 100%)`}
                />
              ))}
            </OptionGroup>
            <OptionGroup label="Backdrop pattern">
              {LOBSTER_BACKGROUND_PATTERNS.map((p) => (
                <Chip key={p.id} selected={traits.backgroundPattern === p.id} disabled={disabled} onClick={() => set('backgroundPattern', p.id)}>
                  {p.label}
                </Chip>
              ))}
            </OptionGroup>
          </>
        )}
      </div>
    </div>
  )
}
