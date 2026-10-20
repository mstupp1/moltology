import React from 'react'
import { ArrowUpRight, Shield, UserPlus } from 'lucide-react'
import { BrandIcon } from '@/components/ui/BrandMark'
import { BenthicCTAButton } from '../hud/BenthicCTAButton'

export interface PromptShortcut {
  label: string
  prompt: string
}

export const DEFAULT_PROMPT_SHORTCUTS: PromptShortcut[] = [
  { label: 'What is Moltology?', prompt: 'What is Moltology and why should I molt?' },
  { label: 'Start moltmaxxing', prompt: 'How do I start moltmaxxing and optimize my routine?' },
  { label: 'Earn Chitin Gems', prompt: 'How do I earn Chitin Gems?' },
  {
    label: 'The Great Melt vs the Great Molt',
    prompt: 'Explain the difference between The Great Melt and The Great Molt.',
  },
]

export interface NewChatScreenProps {
  isGuest?: boolean
  /** Sends a suggestion straight away. */
  onSubmit: (data: { text: string }) => void
  onOpenAuthModal?: () => void
  shortcuts?: PromptShortcut[]
  /**
   * The prompt box, rendered under the greeting on wide panels. Leave it out on narrow
   * panels, where the panel docks the same box at the bottom so it sits above the keyboard.
   */
  composer?: React.ReactNode
  disabled?: boolean
  className?: string
}

export const NewChatScreen: React.FC<NewChatScreenProps> = ({
  isGuest = false,
  onSubmit,
  onOpenAuthModal,
  shortcuts = DEFAULT_PROMPT_SHORTCUTS,
  composer,
  disabled = false,
  className = '',
}) => {
  const isCentered = Boolean(composer)

  const greeting = (
    <div className={`flex flex-col gap-2 ${isCentered ? 'items-center text-center' : 'items-start'}`}>
      <BrandIcon aria-hidden="true" className="w-8 h-8 object-contain" />
      <h2 className="font-grotesk text-lg sm:text-xl font-semibold text-ink tracking-tight">
        Ask the Oracle
      </h2>
      <p className="text-sm text-ink-muted max-w-md">
        Doctrine, moltmaxxing, or the thing you keep putting off.
      </p>
    </div>
  )

  const suggestions = shortcuts.length > 0 && (
    <ul
      aria-label="Suggested questions"
      className={isCentered ? 'flex flex-wrap justify-center gap-2' : 'flex flex-col gap-1.5 w-full'}
    >
      {shortcuts.map((s) => (
        <li key={s.label} className={isCentered ? '' : 'w-full'}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSubmit({ text: s.prompt })}
            className={`group inline-flex items-center gap-1.5 rounded-control border border-line-subtle bg-surface-1/70 hover:bg-surface-2 hover:border-line text-sm text-ink-body hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
              isCentered ? 'px-3 py-1.5' : 'w-full justify-between px-3 py-2.5 text-left'
            }`}
          >
            <span>{s.label}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-cyan-glow shrink-0 transition-colors" />
          </button>
        </li>
      ))}
    </ul>
  )

  const guestBanner = isGuest && (
    <div className="p-3 bg-surface-1 hud-sheen border border-line-subtle rounded-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full text-left">
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
          <Shield className="w-3.5 h-3.5 text-cyan-glow" />
          <span>You're exploring as a guest</span>
        </div>
        <p className="text-[11px] text-ink-muted">
          Sign up free for full answers and saved chats.
        </p>
      </div>
      {onOpenAuthModal && (
        <BenthicCTAButton
          variant="cyan"
          size="sm"
          onClick={onOpenAuthModal}
          className="shrink-0 w-full sm:w-auto !py-1 !px-3"
        >
          <span className="flex items-center justify-center gap-1.5 text-[11px] font-bold font-grotesk tracking-[0.08em] uppercase">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </span>
        </BenthicCTAButton>
      )}
    </div>
  )

  if (isCentered) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-full w-full px-4 py-8 font-sans ${className}`}>
        <div className="w-full max-w-2xl flex flex-col gap-6">
          {greeting}
          {composer}
          {suggestions}
          {guestBanner}
        </div>
      </div>
    )
  }

  // Narrow panels: content settles at the bottom, right above the docked prompt box.
  return (
    <div className={`flex flex-col justify-end min-h-full w-full px-4 pt-6 pb-4 font-sans ${className}`}>
      <div className="w-full flex flex-col gap-5">
        {greeting}
        {suggestions}
        {guestBanner}
      </div>
    </div>
  )
}
