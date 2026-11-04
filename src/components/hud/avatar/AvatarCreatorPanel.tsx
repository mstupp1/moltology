import React, { useMemo, useState } from 'react'
import { Dices } from 'lucide-react'
import {
  AVATAR_ANTENNAE,
  AVATAR_ANTENNAE_LABELS,
  AVATAR_BUILDS,
  AVATAR_BUILD_LABELS,
  AVATAR_EXPRESSION_LABELS,
  AVATAR_HEAD_SHAPES,
  AVATAR_HEAD_SHAPE_LABELS,
  AVATAR_MOUTHS,
  AVATAR_MOUTH_LABELS,
  AVATAR_POSES,
  AVATAR_POSE_LABELS,
  AVATAR_RACES,
  AVATAR_RACE_LABELS,
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
import { HudButton } from '@/components/ui/HudButton'

export interface AvatarCreatorPanelProps {
  value: LobsterAvatarConfig
  onChange: (next: LobsterAvatarConfig) => void
  disabled?: boolean
  className?: string
  section?: CreatorSection
}

export type CreatorSection = 'body' | 'shell' | 'face' | 'scene'

export const CREATOR_SECTIONS: readonly { id: CreatorSection; label: string }[] = [
  { id: 'body', label: 'Body' },
  { id: 'shell', label: 'Shell' },
  { id: 'face', label: 'Face' },
  { id: 'scene', label: 'Scene' },
]

function OptionGroup({ label, children, tiles = false }: { label: string; children: React.ReactNode; tiles?: boolean }) {
  return (
    <fieldset className="space-y-1.5 min-w-0">
      <legend className="text-[11px] font-sans font-semibold tracking-[0.08em] uppercase text-ink-muted mb-1.5">
        {label}
      </legend>
      <div className={tiles ? 'grid grid-cols-[repeat(auto-fill,minmax(68px,1fr))] gap-1.5' : 'flex flex-wrap gap-1.5'}>
        {children}
      </div>
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
      className={`min-h-8 px-2.5 rounded-control border text-xs font-sans transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
        selected
          ? 'border-cyan-glow bg-cyan-soft text-ink'
          : 'border-line bg-surface-2 text-ink-body hover:border-line-hover hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

/** A picture of the character with this option applied, so members choose by looking. */
function Tile({
  selected,
  onClick,
  disabled,
  label,
  src,
  zoom = false,
}: {
  selected: boolean
  onClick: () => void
  disabled?: boolean
  label: string
  src: string | null
  /** Face options zoom in on the eyes and mouth. */
  zoom?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`group flex flex-col items-center gap-1 rounded-control border p-1 pb-1.5 transition-[border-color,background-color,transform] duration-150 active:scale-[0.97] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow motion-reduce:transition-none ${
        selected
          ? 'border-cyan-glow bg-cyan-soft'
          : 'border-line-subtle bg-surface-2 hover:border-line-hover'
      }`}
    >
      <span className="block w-full aspect-square rounded-chip bg-abyss/70 overflow-hidden">
        {src ? (
          <img src={src} alt="" width={96} height={96} loading="lazy" decoding="async" className={`w-full h-full object-contain transition-transform duration-150 motion-reduce:transition-none ${zoom ? 'scale-[1.45] translate-y-[6%] group-hover:scale-[1.5]' : 'group-hover:scale-105'}`} />
        ) : null}
      </span>
      <span className={`text-[11px] leading-tight font-sans text-center ${selected ? 'text-ink font-semibold' : 'text-ink-body'}`}>
        {label}
      </span>
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
      className={`w-9 h-9 rounded-full border-2 transition-transform disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow motion-reduce:transition-none ${
        selected
          ? 'border-ink scale-110'
          : 'border-line hover:scale-105 hover:border-line-hover'
      }`}
      style={{ background }}
    />
  )
}

type TileFrame = 'portrait' | 'fullBody'

/**
 * Character creator controls. Every choice is written straight into the config,
 * so the preview next to it updates as the member taps. Shape, face, and pose
 * options are shown as small renders of the member's own character.
 */
export const AvatarCreatorPanel: React.FC<AvatarCreatorPanelProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  section,
}) => {
  const [localTab, setTab] = useState<CreatorSection>('body')
  const tab = section ?? localTab
  const traits = useMemo(() => resolveAvatarTraits(value), [value])

  const set = <K extends keyof ResolvedAvatarTraits>(key: K, next: ResolvedAvatarTraits[K]) => {
    // Pin the resolved look first so changing one trait never reshuffles the others.
    onChange({ ...value, ...traits, [key]: next })
  }

  // One look shared by every tile: the member's current character, no backdrop, no gear.
  const base = useMemo(
    () => ({ ...value, ...traits, accessory: 'none' as const, equipment: undefined, transparentBackground: true }),
    [value, traits],
  )
  const tile = (patch: Partial<LobsterAvatarConfig>, frame: TileFrame) =>
    generateLobsterAvatarDataUri({ ...base, ...patch }, 96, { frame, staticMotion: true })

  const racePreviews = useMemo(() => {
    const out: Partial<Record<AvatarRace, string | null>> = {}
    for (const race of AVATAR_RACES) out[race] = tile({ race }, 'portrait')
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base])

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
              className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-card border transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                selected
                  ? 'border-cyan-glow bg-cyan-soft'
                  : 'border-line bg-surface-2 hover:border-line-hover'
              }`}
            >
              {racePreviews[race] ? (
                <img
                  src={racePreviews[race] ?? undefined}
                  alt=""
                  width={44}
                  height={44}
                  className="w-11 h-11 rounded-full bg-abyss"
                />
              ) : null}
              <span
                className={`font-sans text-sm font-semibold ${selected ? 'text-cyan-glow' : 'text-ink'}`}
              >
                {AVATAR_RACE_LABELS[race]}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        {!section && (
          <div
            role="tablist"
            aria-label="Customize"
            className="flex flex-1 gap-0.5 rounded-card border border-line-subtle bg-surface-1 p-0.5"
          >
            {CREATOR_SECTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 min-h-8 rounded-control text-[11px] font-sans font-semibold tracking-[0.08em] uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                  tab === t.id
                    ? 'bg-surface-3 shadow-nav-current text-ink'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-2'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        <HudButton
          type="button"
          variant="secondary"
          size="sm"
          className={section ? 'ml-auto shrink-0' : 'shrink-0'}
          disabled={disabled}
          onClick={() => onChange(rerollAvatarConfig(value))}
          icon={<Dices className="w-3.5 h-3.5 text-cyan-glow" />}
        >
          Surprise me
        </HudButton>
      </div>

      <div
        role="tabpanel"
        className="space-y-4 rounded-card border border-line-subtle bg-surface-1 p-3"
      >
        {tab === 'body' && (
          <>
            <OptionGroup label={traits.race === 'crab' ? 'Shell shape' : 'Head shape'} tiles>
              {AVATAR_HEAD_SHAPES.map((h) => (
                <Tile
                  key={h}
                  label={AVATAR_HEAD_SHAPE_LABELS[traits.race][h]}
                  src={tile({ headShape: h }, 'portrait')}
                  selected={traits.headShape === h}
                  disabled={disabled}
                  onClick={() => set('headShape', h)}
                />
              ))}
            </OptionGroup>
            <OptionGroup label="Build" tiles>
              {AVATAR_BUILDS.map((b) => (
                <Tile
                  key={b}
                  label={AVATAR_BUILD_LABELS[traits.race][b]}
                  src={tile({ build: b, pose: 'rest' }, 'fullBody')}
                  selected={traits.build === b}
                  disabled={disabled}
                  onClick={() => set('build', b)}
                />
              ))}
            </OptionGroup>
            <OptionGroup label="Height">
              {LOBSTER_HEIGHTS.map((h) => (
                <Chip
                  key={h}
                  selected={traits.height === h}
                  disabled={disabled}
                  onClick={() => set('height', h)}
                >
                  {LOBSTER_HEIGHT_LABELS[h]}
                </Chip>
              ))}
            </OptionGroup>
            <OptionGroup label="Pose" tiles>
              {AVATAR_POSES.map((p) => (
                <Tile
                  key={p}
                  label={AVATAR_POSE_LABELS[p]}
                  src={tile({ pose: p }, 'fullBody')}
                  selected={traits.pose === p}
                  disabled={disabled}
                  onClick={() => set('pose', p)}
                />
              ))}
            </OptionGroup>
            <OptionGroup label="Antennae" tiles>
              {AVATAR_ANTENNAE.map((a) => (
                <Tile
                  key={a}
                  label={AVATAR_ANTENNAE_LABELS[a]}
                  src={tile({ antennae: a }, 'portrait')}
                  selected={traits.antennae === a}
                  disabled={disabled}
                  onClick={() => set('antennae', a)}
                />
              ))}
            </OptionGroup>
          </>
        )}

        {tab === 'shell' && (
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
            <OptionGroup label="Finish" tiles>
              {SHELL_FINISHES.map((f) => (
                <Tile
                  key={f}
                  label={SHELL_FINISH_LABELS[f]}
                  src={tile({ shellFinish: f }, 'portrait')}
                  selected={traits.shellFinish === f}
                  disabled={disabled}
                  onClick={() => set('shellFinish', f)}
                />
              ))}
            </OptionGroup>
            <OptionGroup label="Pattern" tiles>
              {SHELL_MARKINGS.map((m) => (
                <Tile
                  key={m}
                  label={SHELL_MARKING_LABELS[m]}
                  src={tile({ marking: m }, 'portrait')}
                  selected={traits.marking === m}
                  disabled={disabled}
                  onClick={() => set('marking', m)}
                />
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
            <OptionGroup label="Expression" tiles>
              {LOBSTER_EYELID_STYLES.map((e) => (
                <Tile
                  key={e}
                  label={AVATAR_EXPRESSION_LABELS[e]}
                  src={tile({ eyelidStyle: e }, 'portrait')}
                  zoom
                  selected={traits.eyelidStyle === e}
                  disabled={disabled}
                  onClick={() => set('eyelidStyle', e)}
                />
              ))}
            </OptionGroup>
            <OptionGroup label="Mouth" tiles>
              {AVATAR_MOUTHS.map((m) => (
                <Tile
                  key={m}
                  label={AVATAR_MOUTH_LABELS[m]}
                  src={tile({ mouth: m }, 'portrait')}
                  zoom
                  selected={traits.mouth === m}
                  disabled={disabled}
                  onClick={() => set('mouth', m)}
                />
              ))}
            </OptionGroup>
            <OptionGroup label="Eye shape" tiles>
              {LOBSTER_EYE_VARIANTS.map((v) => (
                <Tile
                  key={v}
                  label={LOBSTER_EYE_VARIANT_LABELS[v]}
                  src={tile({ eyeVariant: v }, 'portrait')}
                  zoom
                  selected={traits.eyeVariant === v}
                  disabled={disabled}
                  onClick={() => set('eyeVariant', v)}
                />
              ))}
            </OptionGroup>
            <OptionGroup label="Pupils" tiles>
              {LOBSTER_PUPIL_VARIANTS.map((v) => (
                <Tile
                  key={v}
                  label={LOBSTER_PUPIL_VARIANT_LABELS[v]}
                  src={tile({ pupilVariant: v }, 'portrait')}
                  zoom
                  selected={traits.pupilVariant === v}
                  disabled={disabled}
                  onClick={() => set('pupilVariant', v)}
                />
              ))}
            </OptionGroup>
          </>
        )}

        {tab === 'scene' && (
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
        )}
      </div>
    </div>
  )
}
