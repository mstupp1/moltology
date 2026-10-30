import { STARTER_CHARACTER_EQUIPMENT } from '@/lib/avatar/starter-equipment'
import React from 'react'
import { Atom, BookOpen, LayoutDashboard, Users } from 'lucide-react'
import { BrandIcon3D } from '@/components/ui/BrandIcon3D'
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
  /** Show only to members or only to guests. Defaults to everyone. */
  audience?: 'member' | 'guest'
  /** Whether Next is enabled. Defaults to always. */
  canContinue?: (props: OnboardingStepProps) => boolean
  /** Label for the Next button. Defaults to "Next", or "Finish" on the last step. */
  nextLabel?: (props: OnboardingStepProps) => string
}

function StepHeading({ id, title, children }: { id: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h2 id={id} tabIndex={-1} className="font-sans text-xl sm:text-2xl font-bold text-ink tracking-tight outline-hidden">
        {title}
      </h2>
      {children ? <p className="font-sans text-sm text-ink-body leading-relaxed">{children}</p> : null}
    </div>
  )
}

function WelcomeStep({ firstName, headingId }: OnboardingStepProps) {
  return (
    <div className="max-w-md mx-auto w-full flex flex-col items-center text-center gap-6 py-4">
      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center border border-line bg-surface-2 hud-sheen shadow-menu">
        <BrandIcon3D size={96} aria-hidden="true" />
      </div>
      <StepHeading id={headingId} title={firstName ? `Welcome to Moltology, ${firstName}` : 'Welcome to Moltology'}>
        Moltology helps you shed the noise of always-online life, one small habit at a time.
      </StepHeading>
      <p className="font-sans text-sm text-ink-muted leading-relaxed">
        This takes about a minute. We will show you around, then you will pick a username and make your character.
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
        Pick a lobster or a crab. Your basic equipment is included. Change your look any time in the character studio.
      </StepHeading>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4 md:gap-6 items-start">
        <AvatarCreatorPreview config={{...draft.config,equipment:STARTER_CHARACTER_EQUIPMENT}} className="max-w-[180px] md:max-w-none mx-auto md:sticky md:top-0" />
        <AvatarCreatorPanel value={draft.config} onChange={(config) => update({ config })} disabled={busy} />
      </div>
    </div>
  )
}

function UsernameStep({ draft, update, error, busy, headingId }: OnboardingStepProps) {
  return (
    <div className="max-w-md mx-auto w-full space-y-6 py-2">
      <StepHeading id={headingId} title="Pick a username">
        This is how other members see you in the forum and member lists. You can change it later in Settings.
      </StepHeading>
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

function KeepStep({ draft, headingId }: OnboardingStepProps) {
  return (
    <div className="max-w-md mx-auto w-full space-y-6 py-2">
      <StepHeading id={headingId} title="Keep your character">
        You are looking around as a guest. Make a free account to keep this character, pick a username, and save your
        progress.
      </StepHeading>
      <div className="rounded-card border border-line-subtle bg-surface-2 hud-sheen p-4 flex items-center gap-4">
        <LobsterAvatarPortrait config={{...draft.config,equipment:STARTER_CHARACTER_EQUIPMENT}} size={128} alt="Your character" className="w-16 h-16 shrink-0" />
        <p className="font-sans text-sm text-ink-body">Your character is saved on this device until you sign up.</p>
      </div>
    </div>
  )
}

/**
 * The flow, in order. To add a step, write a component that takes OnboardingStepProps and
 * add an entry here; the flow handles progress, Back/Next and focus. `audience` limits a
 * step to members or guests. The last step a viewer sees finishes the flow.
 */
export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { id: 'welcome', label: 'Welcome', Component: WelcomeStep, nextLabel: () => 'Get started' },
  { id: 'tour', label: "What's here", Component: TourStep },
  {
    id: 'username',
    label: 'Username',
    audience: 'member',
    Component: UsernameStep,
    canContinue: ({ draft }) => parseMemberHandle(draft.handle).ok,
  },
  { id: 'character', label: 'Character', Component: CharacterStep },
  { id: 'keep', label: 'Sign up', audience: 'guest', Component: KeepStep, nextLabel: () => 'Sign up free' },
]

export function stepsFor(isGuest: boolean): readonly OnboardingStep[] {
  const audience = isGuest ? 'guest' : 'member'
  return ONBOARDING_STEPS.filter((s) => !s.audience || s.audience === audience)
}
