import React, { useEffect, useMemo, useState } from 'react'
import { Check, ScrollText } from 'lucide-react'
import { HudBottomSheet } from '@/components/ui/HudBottomSheet'
import { HudButton } from '@/components/ui/HudButton'
import { HudSwitch } from '@/components/ui/HudSwitch'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useSafeOracle } from '@/components/hud/OracleContext'
import { useOracleSkills } from '@/hooks/useOracleSkills'
import { getAuthJWTToken } from '@/lib/jwt'
import type { OracleSkillCard, OracleSkillsPayload } from '@/lib/oracle-skills'
import { buyOracleSkillFn, setOracleSkillSettingsFn } from '@/lib/server/api'
import { cn } from '@/lib/utils'
import { GemAmount } from './MarketCurrencyBar'

const ACCESS_NOTE: Record<NonNullable<OracleSkillCard['access']>, string> = {
  starter: 'Free for every member.',
  owned: 'You own this skill.',
  max: 'Included with Oracle MAX.',
  admin: 'Admin · every skill is on.',
}

function SkillStatus({ skill }: { skill: OracleSkillCard }) {
  if (skill.access) {
    return (
      <span className="inline-flex items-center gap-1 rounded-chip bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold text-ink">
        <Check className="w-3 h-3" aria-hidden="true" />
        {{ max: 'MAX', starter: 'Free', admin: 'Admin', owned: 'Owned' }[skill.access]}
      </span>
    )
  }
  return <GemAmount value={skill.price} size="sm" />
}

function SkillCardButton({ skill, selected, onSelect }: { skill: OracleSkillCard; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex flex-col gap-1.5 rounded-card border border-line-subtle bg-surface-1 p-3 text-left transition-[background-color,transform] duration-150 active:scale-[0.99] motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
        selected ? 'bg-surface-3 border-line' : 'hover:bg-surface-2',
      )}
    >
      <span className="flex min-h-6 items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">{skill.category}</span>
        <SkillStatus skill={skill} />
      </span>
      <span className="text-[14px] font-semibold leading-tight text-ink">{skill.name}</span>
      <span className="text-[13px] leading-snug text-ink-muted line-clamp-2">{skill.summary}</span>
    </button>
  )
}

function SkillDetail({
  skill,
  payload,
  busy,
  onBuy,
  onUse,
  onToggle,
}: {
  skill: OracleSkillCard
  payload: OracleSkillsPayload
  busy: boolean
  onBuy: () => void
  onUse: () => void
  onToggle: (enabled: boolean) => void
}) {
  const short = skill.price - payload.gems - payload.credits
  const creditPart = Math.max(0, skill.price - payload.gems)
  const switchLabel = `skill-auto-${skill.id}`
  return (
    <div className="flex flex-col gap-3" data-testid="skill-detail">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">{skill.category}</p>
        <h2 className="text-lg font-semibold text-ink leading-tight">{skill.name}</h2>
        <p className="mt-1 text-sm text-ink-body leading-relaxed">{skill.summary}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-ink-muted mb-1.5">Try saying</h3>
        <ul className="flex flex-col gap-1">
          {skill.examples.map((example) => (
            <li key={example} className="rounded-control bg-surface-2 px-2.5 py-1.5 text-[13px] text-ink-body">
              “{example}”
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-card border border-line-subtle bg-abyss/40 p-3 flex flex-col gap-2" aria-label="Sample exchange">
        <p className="self-end max-w-[85%] rounded-control bg-surface-3 px-2.5 py-1.5 text-[13px] text-ink">{skill.preview.member}</p>
        <p className="max-w-[92%] text-[13px] leading-relaxed text-ink-body">
          <span className="block text-[11px] font-semibold text-cyan-glow mb-0.5">Oracle</span>
          {skill.preview.oracle}
        </p>
      </div>

      {skill.access ? (
        <>
          <HudButton size="lg" fullWidth onClick={onUse}>
            <ScrollText className="w-4 h-4" aria-hidden="true" />
            Use in Oracle
          </HudButton>
          <div className="flex items-center justify-between gap-3 rounded-control border border-line-subtle px-3 py-2">
            <span id={switchLabel} className="text-[13px] text-ink-body">
              The Oracle can pick this on its own
            </span>
            <HudSwitch
              checked={skill.enabled}
              disabled={!payload.autoPick}
              onChange={onToggle}
              aria-labelledby={switchLabel}
            />
          </div>
          <p className="text-xs text-ink-muted text-center">{ACCESS_NOTE[skill.access]}</p>
        </>
      ) : payload.guest ? (
        <>
          <HudButton size="lg" fullWidth onClick={onBuy}>
            Sign up to get it
          </HudButton>
          <p className="text-xs text-ink-muted text-center">
            {skill.price.toLocaleString('en-US')} gems. Accounts are free and start with four skills.
          </p>
        </>
      ) : (
        <>
          <HudButton size="lg" fullWidth disabled={busy || short > 0} onClick={onBuy}>
            {busy ? 'Buying…' : `Buy for ${skill.price.toLocaleString('en-US')} gems`}
          </HudButton>
          {short <= 0 && creditPart > 0 ? (
            <p className="text-xs text-ink-muted text-center">
              Uses {payload.gems.toLocaleString('en-US')} gems and {creditPart.toLocaleString('en-US')} Molt Credits.
            </p>
          ) : null}
          {short > 0 ? (
            <p className="text-xs text-ink-muted text-center">
              You need {short.toLocaleString('en-US')} more gems. Daily liturgies, streaks and firsts all pay out.
            </p>
          ) : null}
          <p className="text-xs text-ink-muted text-center">
            Every skill is included with{' '}
            <a href="/max" className="text-cyan-glow hover:underline">
              Oracle MAX
            </a>
            .
          </p>
        </>
      )}
    </div>
  )
}

/**
 * The Shop's Skills tab: methods the Oracle can walk a member through. Members buy them with
 * gems (or get them with Oracle MAX), use one from here or the chat box, and choose whether
 * the Oracle may pick one on its own.
 */
export function MarketSkillsPanel({
  userId,
  ready,
  wide,
  initialSkillId,
  onNeedAuth,
  onPurchased,
}: {
  userId: string | null
  /** False until the session is known, so members don't see the guest catalog first. */
  ready: boolean
  wide: boolean
  initialSkillId?: string | null
  onNeedAuth: () => void
  /** A purchase changed the gem and credit balances. */
  onPurchased: () => void
}) {
  const toast = useOptionalToast()?.toast
  const oracle = useSafeOracle()
  const { data, error, setData, refresh } = useOracleSkills(userId, ready)
  const [selectedId, setSelectedId] = useState<string | null>(initialSkillId ?? null)
  const [sheetOpen, setSheetOpen] = useState(Boolean(initialSkillId) && !wide)
  const [buying, setBuying] = useState(false)

  const skills = data?.skills ?? []
  const selected = skills.find((s) => s.id === selectedId) ?? null
  const ownedCount = useMemo(() => skills.filter((s) => s.access).length, [skills])

  // Desktop keeps a skill open beside the grid.
  useEffect(() => {
    if (wide && !selectedId && skills[0]) setSelectedId(skills[0].id)
  }, [wide, selectedId, skills])

  const select = (id: string) => {
    setSelectedId(id)
    if (!wide) setSheetOpen(true)
  }

  const saveSettings = async (change: { autoPick?: boolean; skillId?: string; enabled?: boolean }) => {
    setData((prev) => ({
      ...prev,
      autoPick: change.autoPick ?? prev.autoPick,
      skills: prev.skills.map((s) => (s.id === change.skillId && change.enabled !== undefined ? { ...s, enabled: change.enabled } : s)),
    }))
    try {
      const token = (await getAuthJWTToken()) ?? undefined
      await setOracleSkillSettingsFn({ data: { token, ...change } })
    } catch {
      toast?.error('That setting did not save. Try again.')
      void refresh()
    }
  }

  const buy = async () => {
    if (!selected || buying) return
    if (data?.guest) {
      onNeedAuth()
      return
    }
    setBuying(true)
    try {
      const token = (await getAuthJWTToken()) ?? undefined
      const result = await buyOracleSkillFn({ data: { token, skillId: selected.id } })
      if (result.ok) {
        toast?.success(`Use it from the chat box, or let the Oracle pick it when it fits.`, { title: `${selected.name} is yours` })
        onPurchased()
      } else {
        toast?.warning(result.error ?? 'That purchase did not go through.')
      }
      await refresh()
    } catch {
      toast?.error('That purchase did not go through. Try again.')
    } finally {
      setBuying(false)
    }
  }

  const use = () => {
    if (!selected) return
    setSheetOpen(false)
    oracle?.openWithSkill(selected.id)
  }

  if (!data) {
    if (error) return <p className="text-sm text-crimson-text p-4">Could not load skills. Try again in a moment.</p>
    return <div className="h-40 rounded-card border border-line-subtle bg-surface-1 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
  }

  const detail = selected ? (
    <SkillDetail
      key={selected.id}
      skill={selected}
      payload={data}
      busy={buying}
      onBuy={buy}
      onUse={use}
      onToggle={(enabled) => void saveSettings({ skillId: selected.id, enabled })}
    />
  ) : null

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="space-y-3 min-w-0">
        <div className="flex items-center justify-between gap-3 rounded-card border border-line-subtle bg-surface-1 p-3">
          <div className="min-w-0">
            <p id="skills-auto-pick" className="text-sm font-semibold text-ink">
              {data.guest ? 'Skills for the Oracle' : 'Let the Oracle pick skills on its own'}
            </p>
            <p className="text-xs text-ink-muted leading-snug mt-0.5">
              {data.guest
                ? 'Methods the Oracle walks you through. New accounts start with four.'
                : `It uses one only when your message clearly fits. Type / in the chat box to pick one yourself. ${ownedCount} of ${skills.length} ready.`}
            </p>
          </div>
          {data.guest ? null : (
            <HudSwitch
              checked={data.autoPick}
              onChange={(autoPick) => void saveSettings({ autoPick })}
              aria-labelledby="skills-auto-pick"
            />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {skills.map((skill) => (
            <SkillCardButton key={skill.id} skill={skill} selected={selected?.id === skill.id} onSelect={() => select(skill.id)} />
          ))}
        </div>
      </div>
      {wide ? (
        <aside className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-card border border-line-subtle bg-surface-1 p-4">
          {detail}
        </aside>
      ) : (
        <HudBottomSheet
          isOpen={sheetOpen && Boolean(detail)}
          onClose={() => setSheetOpen(false)}
          ariaLabel={selected?.name ?? 'Skill'}
          maxHeight="92dvh"
        >
          <div className="p-4 pt-1">{detail}</div>
        </HudBottomSheet>
      )}
    </div>
  )
}
