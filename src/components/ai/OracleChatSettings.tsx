import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { HudButton } from '@/components/ui/HudButton'
import { HudSwitch } from '@/components/ui/HudSwitch'
import { getAuthJWTToken } from '@/lib/jwt'
import { getOracleChatSettingsFn, saveOracleChatSettingsFn, setOracleSkillSettingsFn } from '@/lib/server/api'
import {
  ORACLE_CUSTOM_INSTRUCTIONS_MAX,
  ORACLE_PERSONALITIES,
  type OracleChatSettingsPayload,
  type OraclePersonalityId,
} from '@/lib/oracle-chat-settings'
import { cn } from '@/lib/utils'

type Status = { tone: 'ok' | 'error'; text: string } | null

const sectionTitle = 'font-grotesk text-sm font-bold text-ink'
const sectionHint = 'text-xs text-ink-muted mt-0.5'

/**
 * Personality, custom instructions and skill auto-pick. Used in the chat's settings dialog
 * and as the Oracle card on /settings. Personality and the switch save on change; the
 * instructions save with their own button because the text is checked first.
 */
export function OracleChatSettingsForm({ className }: { className?: string }) {
  const [settings, setSettings] = useState<OracleChatSettingsPayload | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const ids = { personality: useId(), instructions: useId(), counter: useId(), autoPick: useId(), status: useId() }

  const load = useCallback(async () => {
    setLoadFailed(false)
    try {
      const token = (await getAuthJWTToken()) ?? undefined
      const next = await getOracleChatSettingsFn({ data: { token } })
      setSettings(next)
      setDraft(next.customInstructions)
    } catch {
      setLoadFailed(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async (change: { personality?: OraclePersonalityId; customInstructions?: string }) => {
    const token = (await getAuthJWTToken()) ?? undefined
    return saveOracleChatSettingsFn({ data: { token, ...change } })
  }

  const pickPersonality = async (personality: OraclePersonalityId) => {
    if (!settings || settings.personality === personality) return
    const previous = settings
    setSettings({ ...settings, personality })
    setStatus(null)
    try {
      const result = await save({ personality })
      if (!result.ok) {
        setSettings(previous)
        setStatus({ tone: 'error', text: result.error ?? 'That did not save. Try again.' })
      }
    } catch {
      setSettings(previous)
      setStatus({ tone: 'error', text: 'That did not save. Try again.' })
    }
  }

  const saveInstructions = async () => {
    if (!settings || saving) return
    setSaving(true)
    setStatus(null)
    try {
      const result = await save({ customInstructions: draft })
      if (result.ok) {
        // Only the instructions changed here; keep a personality picked meanwhile.
        setSettings((current) => (current ? { ...current, customInstructions: result.settings.customInstructions } : result.settings))
        setDraft(result.settings.customInstructions)
        setStatus({ tone: 'ok', text: result.settings.customInstructions ? 'Instructions saved.' : 'Instructions cleared.' })
      } else {
        setStatus({ tone: 'error', text: result.error ?? 'That did not save. Try again.' })
      }
    } catch {
      setStatus({ tone: 'error', text: 'That did not save. Try again.' })
    } finally {
      setSaving(false)
    }
  }

  const toggleAutoPick = async (autoPick: boolean) => {
    if (!settings) return
    setSettings({ ...settings, autoPick })
    try {
      const token = (await getAuthJWTToken()) ?? undefined
      await setOracleSkillSettingsFn({ data: { token, autoPick } })
    } catch {
      setSettings({ ...settings, autoPick: !autoPick })
      setStatus({ tone: 'error', text: 'That did not save. Try again.' })
    }
  }

  if (loadFailed) {
    return (
      <div className={cn('space-y-2 text-sm text-ink-body', className)}>
        <p>Oracle settings did not load.</p>
        <HudButton type="button" variant="secondary" size="sm" onClick={() => void load()}>Try again</HudButton>
      </div>
    )
  }
  if (!settings) {
    return (
      <div className={cn('space-y-2', className)} role="status" aria-label="Loading Oracle settings">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-control bg-surface-2 animate-pulse motion-reduce:animate-none" />
        ))}
      </div>
    )
  }

  const dirty = draft.trim() !== settings.customInstructions
  const over = draft.length > ORACLE_CUSTOM_INSTRUCTIONS_MAX

  return (
    <div className={cn('space-y-5 font-sans', className)}>
      <section aria-labelledby={ids.personality}>
        <h3 id={ids.personality} className={sectionTitle}>Personality</h3>
        <p className={sectionHint}>Sets the Oracle's tone in every chat.</p>
        <div role="radiogroup" aria-labelledby={ids.personality} className="mt-2 space-y-1.5">
          {ORACLE_PERSONALITIES.map((p) => {
            const checked = settings.personality === p.id
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => void pickPersonality(p.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-control border px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
                  checked ? 'border-line-strong bg-cyan-soft' : 'border-line-subtle bg-surface-2/60 hover:bg-surface-2',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    checked ? 'border-cyan-glow bg-cyan-glow text-abyss' : 'border-line',
                  )}
                >
                  {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{p.name}</span>
                  <span className="block text-xs text-ink-muted">{p.summary}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <label htmlFor={ids.instructions} className={sectionTitle}>Custom instructions</label>
        <p className={sectionHint}>What the Oracle should know about you, and how you like answers.</p>
        <textarea
          id={ids.instructions}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            if (status) setStatus(null)
          }}
          rows={5}
          maxLength={ORACLE_CUSTOM_INSTRUCTIONS_MAX + 200}
          aria-describedby={`${ids.counter} ${ids.status}`}
          aria-invalid={over || undefined}
          placeholder="I work night shifts and study on weekends. Keep answers short and give me one next step."
          className="mt-2 block w-full resize-y rounded-control border border-line-subtle bg-surface-2 px-3 py-2 text-base sm:text-sm text-ink placeholder-ink-muted focus:border-line-strong focus:outline-hidden"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span id={ids.counter} className={cn('text-xs tabular-nums', over ? 'text-crimson-text' : 'text-ink-muted')}>
            {draft.length.toLocaleString('en-US')} / {ORACLE_CUSTOM_INSTRUCTIONS_MAX.toLocaleString('en-US')}
          </span>
          <HudButton type="button" size="sm" variant="cyan" disabled={!dirty || over || saving} onClick={() => void saveInstructions()}>
            {saving ? 'Checking…' : 'Save'}
          </HudButton>
        </div>
        <p
          id={ids.status}
          role={status?.tone === 'error' ? 'alert' : 'status'}
          className={cn('mt-1 min-h-4 text-xs', status?.tone === 'error' ? 'text-crimson-text' : 'text-ink-muted')}
        >
          {status?.text ?? ''}
        </p>
      </section>

      <section className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 id={ids.autoPick} className={sectionTitle}>Pick skills for me</h3>
          <p className={sectionHint}>Let the Oracle use one of your skills when a message clearly fits.</p>
        </div>
        <HudSwitch checked={settings.autoPick} onChange={(next) => void toggleAutoPick(next)} aria-labelledby={ids.autoPick} />
      </section>
    </div>
  )
}

/** The chat gear's dialog. Full screen on phones, a centered card elsewhere. */
export function OracleSettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  // A new onClose each render must not re-run the focus effect and pull focus off a field.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open || !mounted) return
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onCloseRef.current()
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      previous?.focus?.()
    }
  }, [open, mounted])

  if (!mounted || !open) return null
  return createPortal(
    <div data-hud-modal-root="" className="fixed inset-0 z-[99996] flex items-stretch sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-abyss/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="oracle-settings-dialog"
        className="relative z-10 flex w-full flex-col bg-surface-1 text-ink shadow-menu pt-[env(safe-area-inset-top,0px)] sm:pt-0 sm:max-w-md sm:max-h-[85vh] sm:rounded-card sm:border sm:border-line"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-line-subtle px-4 py-3">
          <h2 id={titleId} className="min-w-0 flex-1 font-grotesk text-base font-bold">Oracle settings</h2>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close settings"
            title="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-control text-ink-muted hover:bg-surface-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <OracleChatSettingsForm />
          <a href="/settings" className="mt-5 inline-block text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline">
            All account settings
          </a>
        </div>
      </div>
    </div>,
    document.body,
  )
}
