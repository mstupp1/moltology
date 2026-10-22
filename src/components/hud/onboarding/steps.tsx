import React from 'react'
import { Atom, BookOpen, LayoutDashboard, Users } from 'lucide-react'
import { BrandIcon } from '@/components/ui/BrandMark'
import type { LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { parseMemberHandle } from '@/lib/member-handle'
import { AvatarCreatorPanel } from '../avatar/AvatarCreatorPanel'
import { AvatarCreatorPreview } from '../avatar/AvatarCreatorPreview'
import { DesignationField } from '../DesignationField'
import { LobsterAvatarPortrait } from '../LobsterAvatarPortrait'

/** What the member has picked so far. Every step reads and writes this one draft. */
export interface OnboardingDraft {
  config: LobsterAvatarConfig
  handle: string
}

export interface OnboardingStepProps {
  draft: OnboardingDraft
  update: (patch: Partial<OnboardingDraft>) => void
  isGuest: boolean
  /** First name to greet, or null when we only have a placeholder name. */
  firstName: string | null
  /** Save error for the current step, shown under its field. */
  error: string | null
  busy: boolean
  /** Id for the step's heading. The flow labels the dialog with it and focuses it on each step. */
  headingId: string
}

export interface OnboardingStep {
  id: string
  /** Short name for the progress bar. */
  label: string
  Component: React.FC<OnboardingStepProps>
  /** Whether Next is enabled. Defaults to always. */
  canContinue?: (props: OnboardingStepProps) => boolean
  /** Label for the Next button. Defaults to "Next". */
  nextLabel?: (props: OnboardingStepProps) => string
}

function StepHeading({ id, title, children }: { id: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h2 id={id} tabIndex={-1} className="font-sans text-xl sm:text-2xl font-bold text-ink tracking-tight outline-none">
        {title}
      </h2>
      {children ? <p className="font-sans text-sm text-ink-body leading-relaxed">{children}</p> : null}
    </div>
  )
}

function WelcomeStep({ firstName, headingId }: OnboardingStepProps) {
  return (
    <div className="max-w-md mx-auto w-full flex flex-col items-center text-center gap-6 py-4">
      <div className="w-20 h-20 rounded-full flex items-center justify-center border border-line bg-surface-2 hud-sheen">
        <BrandIcon aria-hidden="true" width={44} height={44} className="w-11 h-11" />
      </div>
      <StepHeading id={headingId} title={firstName ? `Welcome to Moltology, ${firstName}` : 'Welcome to Moltology'}>
        Moltology helps you shed the noise of always-online life, one small habit at a time.
      </StepHeading>
      <p className="font-sans text-sm text-ink-muted leading-relaxed">
        This takes about a minute. We will show you around, then you will make your character and pick a username.
      </p>
    </div>
  )
}

const TOUR = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    body: 'Your day at a glance: a few small tasks, the lesson you are on, and your streak.',
  },
  {
    id: 'oracle',
    icon: Atom,
    title: 'Oracle',
    body: 'Ask when you are stuck. It helps you find a first step and plan a routine.',
  },
  {
    id: 'learn',
    icon: BookOpen,
    title: 'Academy and Codex',
    body: 'Short courses and the core texts, read at your own pace.',
  },
  {
    id: 'forum',
    icon: Users,
    title: 'Forum',
    body: 'Share progress, ask questions, and borrow routines from other members.',
  },
] as const

function TourStep({ headingId }: OnboardingStepProps) {
  return (
    <div className="max-w-xl mx-auto w-full space-y-5">
      <StepHeading id={headingId} title="What's here">
        Everything lives in the sidebar. These are the places most members start.
      </StepHeading>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TOUR.map(({ id, icon: Icon, title, body }) => (
          <li key={id} className="rounded-card border border-line-subtle bg-surface-2 hud-sheen p-4 flex gap-3">
            <Icon className="w-5 h-5 shrink-0 text-cyan-glow mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <h3 className="font-sans text-sm font-semibold text-ink">{title}</h3>
              <p className="font-sans text-xs text-ink-muted leading-relaxed mt-1">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CharacterStep({ draft, update, busy, headingId }: OnboardingStepProps) {
  return (
    <div className="w-full space-y-4">
      <StepHeading id={headingId} title="Make your character">
        Pick a lobster or a crab and dress it up. You can change it any time in Settings.
      </StepHeading>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4 md:gap-6 items-start">
        <AvatarCreatorPreview config={draft.config} className="max-w-[180px] md:max-w-none mx-auto md:sticky md:top-0" />
        <AvatarCreatorPanel value={draft.config} onChange={(config) => update({ config })} disabled={busy} />
      </div>
    </div>
  )
}

function NameStep({ draft, update, isGuest, error, busy, headingId }: OnboardingStepProps) {
  const portrait = (
    <LobsterAvatarPortrait
      config={draft.config}
      live
      size={128}
      alt="Your character"
      className="w-16 h-16 shrink-0"
    />
  )

  if (isGuest) {
    return (
      <div className="max-w-md mx-auto w-full space-y-6 py-2">
        <StepHeading id={headingId} title="Keep your character">
          You are looking around as a guest. Make a free account to keep this character, pick a username, and save your
          progress.
        </StepHeading>
        <div className="rounded-card border border-line-subtle bg-surface-2 hud-sheen p-4 flex items-center gap-4">
          {portrait}
          <p className="font-sans text-sm text-ink-body">Your character is saved on this device until you sign up.</p>
        </div>
      </div>
    )
  }

  const parsed = draft.handle ? parseMemberHandle(draft.handle) : null
  const shownName = parsed?.ok ? parsed.handle : draft.handle.trim() || 'your_username'

  return (
    <div className="max-w-md mx-auto w-full space-y-6 py-2">
      <StepHeading id={headingId} title="Pick a username">
        This is how other members see you in the forum and member lists. You can change it later in Settings.
      </StepHeading>
      <div className="rounded-card border border-line-subtle bg-surface-2 hud-sheen p-4 flex items-center gap-4">
        {portrait}
        <div className="min-w-0">
          <div className="font-sans text-[11px] tracking-[0.08em] uppercase text-ink-muted">Preview</div>
          <div className="font-sans text-base font-semibold text-ink truncate">{shownName}</div>
        </div>
      </div>
      <div className="space-y-2">
        <DesignationField id="onboarding-username" value={draft.handle} onChange={(handle) => update({ handle })} disabled={busy} />
        {error ? (
          <p role="alert" className="font-sans text-xs text-crimson-text">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/**
 * The new-member flow, in order. To add a step, write a component that takes
 * OnboardingStepProps and add an entry here; the flow handles progress, Back/Next and focus.
 */
export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { id: 'welcome', label: 'Welcome', Component: WelcomeStep, nextLabel: () => 'Get started' },
  { id: 'tour', label: "What's here", Component: TourStep },
  { id: 'character', label: 'Character', Component: CharacterStep },
  {
    id: 'name',
    label: 'Name',
    Component: NameStep,
    canContinue: ({ isGuest, draft }) => isGuest || parseMemberHandle(draft.handle).ok,
    nextLabel: ({ isGuest }) => (isGuest ? 'Sign up free' : 'Finish'),
  },
]
