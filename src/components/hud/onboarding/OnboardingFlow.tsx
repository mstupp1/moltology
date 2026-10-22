import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { HudButton } from '@/components/ui/HudButton'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import {
  claimMemberHandleFn,
  getUserProfileFn,
  getUserStatsFn,
  saveLobsterAvatarFn,
  updateUserStatsFn,
} from '@/lib/server/api'
import {
  clearCachedProfileAvatarUrl,
  lockAvatarConfig,
  LOBSTER_AVATAR_STYLE,
  parseLobsterAvatarConfig,
  randomLobsterSeed,
} from '@/lib/lobster-avatar'
import { parseMemberHandle } from '@/lib/member-handle'
import { rollBaseStats, type BaseStats } from '@/lib/stats-roller'
import { stepsFor, type OnboardingDraft, type OnboardingStepProps } from './steps'

export interface OnboardingFlowProps {
  userName?: string | null
  onDismiss: () => void
  /** Start on a later step (tests and previews). */
  initialStepId?: string
}

const PLACEHOLDER_NAMES = new Set(['initiate', 'guest'])

/** First name to greet with, skipping the placeholder name email signups get and raw emails. */
export function greetingName(userName?: string | null): string | null {
  const first = userName?.trim().split(/\s+/)[0] ?? ''
  if (!first || first.includes('@') || PLACEHOLDER_NAMES.has(first.toLowerCase())) return null
  return first
}

const avatarKey = (id: string) => `moltology:avatar_config:${id}`

function readStoredConfig(id: string) {
  try {
    const raw = localStorage.getItem(avatarKey(id))
    return raw ? parseLobsterAvatarConfig(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private windows can refuse storage; the server copy still holds for members.
  }
}

function statsPayload(stats: BaseStats) {
  return {
    shellHardness: stats.defense,
    clawStrength: stats.attack,
    pincerTorque: stats.attack,
    processingPower: stats.intelligence,
    durability: stats.speed,
    socialDetachmentIndex: stats.perception,
    moltmaxDimensionScores: { ...stats },
  }
}

/**
 * First-visit flow for new members and guests: welcome, a short tour, the character
 * creator and a username. The steps themselves live in ./steps.
 */
export function OnboardingFlow({ userName, onDismiss, initialStepId }: OnboardingFlowProps) {
  const session = useAuthSession()
  const userId = session.userId
  const isGuest = !userId
  const { toast } = useToast()

  const steps = stepsFor(isGuest)
  const [stepId, setStepId] = useState(() => initialStepId ?? steps[0].id)
  const [draft, setDraft] = useState<OnboardingDraft>(() => ({
    config: readStoredConfig(userId || 'guest') ?? { style: LOBSTER_AVATAR_STYLE, seed: randomLobsterSeed() },
    handle: '',
  }))
  const [savedHandle, setSavedHandle] = useState<string | null>(null)
  /** True only once we know the member has no base stats yet, so a replay never overwrites them. */
  const [needsStats, setNeedsStats] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  const panelRef = useRef<HTMLDivElement | null>(null)
  const touched = useRef({ config: false, handle: false })
  const headingId = useId()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t)
  }, [])

  // Members replaying the flow keep what they already have: saved username, character and stats.
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      const token = (await getAuthJWTToken().catch(() => null)) ?? undefined
      const [profile, stats] = await Promise.allSettled([
        getUserProfileFn({ data: { userId, token } }),
        getUserStatsFn({ data: { userId, token } }),
      ])
      if (cancelled) return
      if (profile.status === 'fulfilled' && profile.value) {
        const handle = profile.value.handle?.trim() || ''
        setSavedHandle(handle || null)
        const saved = parseLobsterAvatarConfig(profile.value.avatarConfig)
        setDraft((d) => ({
          config: touched.current.config ? d.config : saved ?? readStoredConfig('guest') ?? d.config,
          handle: touched.current.handle ? d.handle : handle,
        }))
      }
      if (stats.status === 'fulfilled') {
        setNeedsStats(!stats.value?.moltmaxDimensionScores)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const update = useCallback((patch: Partial<OnboardingDraft>) => {
    if (patch.config) touched.current.config = true
    if (patch.handle !== undefined) {
      touched.current.handle = true
      setError(null)
    }
    setDraft((d) => ({ ...d, ...patch }))
  }, [])

  // A guest who signs up on the last step stays in the flow: their "Sign up" step is gone
  // from the member list, so carry on at the username step with the character they made.
  let index = steps.findIndex((s) => s.id === stepId)
  if (index < 0) index = Math.max(0, steps.findIndex((s) => s.id === 'username'))
  const step = steps[index]
  const isLast = index === steps.length - 1
  const goTo = (i: number) => setStepId(steps[i].id)
  const stepProps: OnboardingStepProps = {
    draft,
    update,
    isGuest,
    firstName: greetingName(userName),
    error,
    busy,
    headingId,
  }

  // Move focus to each new step's heading so screen readers announce it.
  useEffect(() => {
    if (!visible || authOpen) return
    const heading = document.getElementById(headingId)
    heading?.focus({ preventScroll: true })
    panelRef.current?.querySelector('[data-onboarding-body]')?.scrollTo?.({ top: 0 })
  }, [step.id, visible, authOpen, headingId])

  const close = useCallback(() => {
    setVisible(false)
    setTimeout(onDismiss, 200)
  }, [onDismiss])

  const saveGuestDraft = () => {
    writeLocal(avatarKey('guest'), JSON.stringify(lockAvatarConfig(draft.config)))
  }

  /** Claims the username before the member moves on, so a taken name is caught on its own step. */
  const claimUsername = async () => {
    if (!userId) return false
    const parsed = parseMemberHandle(draft.handle)
    if (!parsed.ok) {
      setError(parsed.message)
      return false
    }
    if (parsed.handle === savedHandle) return true
    setBusy(true)
    setError(null)
    try {
      const token = (await getAuthJWTToken().catch(() => null)) ?? undefined
      await claimMemberHandleFn({ data: { handle: parsed.handle, userId, token } })
      setSavedHandle(parsed.handle)
      window.dispatchEvent(new CustomEvent('member-handle-changed'))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setError(
        !message
          ? 'Could not save that username. Try another one.'
          : message.startsWith('Unauthenticated')
            ? 'Your session expired. Sign in again to save your username.'
            : message,
      )
      return false
    } finally {
      setBusy(false)
    }
  }

  const finishAsMember = async () => {
    if (!userId) return
    setBusy(true)
    try {
      const token = (await getAuthJWTToken().catch(() => null)) ?? undefined
      const config = lockAvatarConfig(draft.config)
      writeLocal(avatarKey(userId), JSON.stringify(config))
      const [avatar] = await Promise.allSettled([
        saveLobsterAvatarFn({ data: { ...config, userId, token } }),
        needsStats ? updateUserStatsFn({ data: { ...statsPayload(rollBaseStats()), token } }) : Promise.resolve(),
      ])
      clearCachedProfileAvatarUrl(userId)
      window.dispatchEvent(new CustomEvent('profile-avatar-changed'))
      window.dispatchEvent(new CustomEvent('user-stats-changed'))

      if (avatar.status === 'rejected') {
        toast.error('Your character did not save. Try again in Settings.')
      } else {
        toast.success("You're all set.")
      }
      close()
    } finally {
      setBusy(false)
    }
  }

  const next = async () => {
    if (step.id === 'username' && !(await claimUsername())) return
    if (!isLast) {
      goTo(index + 1)
      return
    }
    if (isGuest) {
      saveGuestDraft()
      setAuthOpen(true)
      return
    }
    void finishAsMember()
  }

  const skipAsGuest = () => {
    saveGuestDraft()
    close()
  }

  // Escape closes; Tab stays inside the panel.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && !busy) {
      e.stopPropagation()
      close()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (authOpen) {
    return (
      <AuthModal
        isOpen
        initialMode="signup"
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setAuthOpen(false)}
      />
    )
  }

  const canContinue = step.canContinue ? step.canContinue(stepProps) : true
  const nextLabel = step.nextLabel ? step.nextLabel(stepProps) : isLast ? 'Finish' : 'Next'
  const { Component } = step

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-stretch sm:items-center justify-center sm:p-6 transition-opacity duration-200 motion-reduce:transition-none"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="absolute inset-0 bg-abyss/85 backdrop-blur-sm" aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onKeyDown={onKeyDown}
        className="relative w-full sm:max-w-3xl h-[100dvh] sm:h-[min(760px,calc(100dvh-3rem))] flex flex-col bg-surface-1 hud-sheen sm:rounded-card sm:border sm:border-line-subtle shadow-menu overflow-hidden"
        data-testid="onboarding-flow"
      >
        <header className="shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b border-line-subtle">
          <div className="flex items-center justify-between gap-3">
            <span className="font-sans text-[11px] tracking-[0.08em] uppercase text-ink-muted">
              Step {index + 1} of {steps.length} · {step.label}
            </span>
            <button
              type="button"
              onClick={close}
              disabled={busy}
              aria-label="Close"
              className="w-8 h-8 -mr-1 flex items-center justify-center rounded-control text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <ol className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.map((s, i) => (
              <li key={s.id} className="h-1 rounded-chip bg-surface-3 overflow-hidden">
                <span className="sr-only">
                  {s.label}
                  {i < index ? ' (done)' : i === index ? ' (current)' : ''}
                </span>
                <div
                  className={`h-full bg-cyan-glow transition-[width] duration-300 motion-reduce:transition-none ${
                    i <= index ? 'w-full' : 'w-0'
                  }`}
                  aria-hidden="true"
                />
              </li>
            ))}
          </ol>
        </header>

        <div data-onboarding-body className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5">
          <div className="min-h-full flex flex-col">
            <div className="my-auto w-full">
              <Component {...stepProps} />
            </div>
          </div>
        </div>

        <footer className="shrink-0 px-4 sm:px-6 py-3 border-t border-line-subtle bg-surface-1 flex items-center gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {index > 0 ? (
            <HudButton
              type="button"
              variant="ghost"
              size="md"
              onClick={() => goTo(index - 1)}
              disabled={busy}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Back
            </HudButton>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {isLast && isGuest ? (
              <HudButton type="button" variant="ghost" size="md" onClick={skipAsGuest}>
                Not now
              </HudButton>
            ) : null}
            <HudButton
              type="button"
              variant="primary"
              size="md"
              onClick={() => void next()}
              disabled={!canContinue || busy}
              iconPosition="right"
              icon={isLast ? undefined : <ChevronRight className="w-4 h-4" />}
            >
              {busy ? 'Saving…' : nextLabel}
            </HudButton>
          </div>
        </footer>
      </div>
    </div>
  )
}
