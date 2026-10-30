import React from 'react'
import {
  Brain,
  Check,
  ChevronsUpDown,
  Fullscreen,
  MessageSquareText,
  PanelRight,
  PictureInPicture2,
  type LucideIcon,
} from 'lucide-react'
import {
  HudDropdownMenu,
  HudDropdownMenuTrigger,
  HudDropdownMenuContent,
  HudDropdownMenuItem,
} from '@/components/ui/HudDropdownMenu'
import type { OracleMode } from '../hud/OracleContext'

export type OracleDisplayMode = Exclude<OracleMode, 'closed'>
export type OracleViewMode = 'standard' | 'entity'

export const STORAGE_KEY_ORACLE_VIEW_MODE = 'moltology:oracle_view_mode'

interface DisplayModeOption {
  mode: OracleDisplayMode
  label: string
  icon: LucideIcon
  /** Sidebar mode only exists from tablet width up. */
  desktopOnly?: boolean
}

export const ORACLE_DISPLAY_MODES: DisplayModeOption[] = [
  { mode: 'sidebar', label: 'Sidebar', icon: PanelRight, desktopOnly: true },
  { mode: 'popout', label: 'Floating', icon: PictureInPicture2 },
  { mode: 'page', label: 'Fullscreen', icon: Fullscreen },
]

/** Shared look for the square icon buttons in the chat header. */
export const headerIconButtonClasses = (touch: boolean) =>
  `inline-flex items-center justify-center shrink-0 rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-ink-muted ${
    touch ? 'min-w-11 min-h-11' : 'w-8 h-8'
  }`

interface OracleEntityModeToggleProps {
  viewMode: OracleViewMode
  onToggle: () => void
  touch?: boolean
}

/**
 * Seamless toggle between standard text chat and 3D Token-Reactive Entity Mode.
 */
export const OracleEntityModeToggle: React.FC<OracleEntityModeToggleProps> = ({
  viewMode,
  onToggle,
  touch = false,
}) => {
  const isEntity = viewMode === 'entity'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isEntity}
      aria-label={isEntity ? 'Switch to standard chat' : 'Switch to 3D Entity Mode'}
      title={isEntity ? 'Switch to standard chat' : 'Switch to 3D Entity Mode'}
      className={`${headerIconButtonClasses(touch)} !w-auto px-2 gap-1.5 text-xs font-medium ${
        isEntity
          ? 'bg-cyan-soft text-cyan-glow border border-line-strong hover:bg-cyan-soft hover:text-cyan-bright'
          : 'border border-transparent'
      }`}
    >
      {isEntity ? (
        <>
          <MessageSquareText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Chat View</span>
        </>
      ) : (
        <>
          <Brain className="w-3.5 h-3.5 shrink-0 text-cyan-glow" aria-hidden="true" />
          <span className="hidden sm:inline">Entity Mode</span>
        </>
      )}
    </button>
  )
}

/** Two stacked lines, the long one on top: the chat list toggle. */
export const ChatListIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M4 9h16" />
    <path d="M4 15h10" />
  </svg>
)

interface OracleModeMenuProps {
  mode: OracleDisplayMode
  onSelect: (mode: OracleDisplayMode) => void
  touch?: boolean
}

/**
 * Display-mode switcher: the trigger shows the current mode's icon, the menu lists the others.
 * Phones only have Floating and Fullscreen, so they get a single toggle button instead.
 */
export const OracleModeMenu: React.FC<OracleModeMenuProps> = ({ mode, onSelect, touch = false }) => {
  const current = ORACLE_DISPLAY_MODES.find((option) => option.mode === mode) ?? ORACLE_DISPLAY_MODES[1]
  const CurrentIcon = current.icon

  if (touch) {
    // The icon shows where the toggle goes, like a maximize/restore button.
    const target = ORACLE_DISPLAY_MODES.find((option) => option.mode === (mode === 'page' ? 'popout' : 'page'))!
    const TargetIcon = target.icon
    return (
      <button
        type="button"
        onClick={() => onSelect(target.mode)}
        className={headerIconButtonClasses(true)}
        aria-label={`Switch to ${target.label.toLowerCase()}`}
        title={target.label}
      >
        <TargetIcon className="w-4 h-4" />
      </button>
    )
  }

  return (
    <HudDropdownMenu modal={false}>
      <HudDropdownMenuTrigger asChild>
        <button
          type="button"
          className={`${headerIconButtonClasses(touch)} gap-0.5 !w-auto px-1.5 data-[state=open]:bg-surface-2 data-[state=open]:text-ink`}
          aria-label={`Display mode: ${current.label}`}
          title="Display mode"
        >
          <CurrentIcon className="w-4 h-4" />
          <ChevronsUpDown className="w-3 h-3 opacity-70" />
        </button>
      </HudDropdownMenuTrigger>
      <HudDropdownMenuContent align="end" sideOffset={6} className="min-w-[164px]">
        {ORACLE_DISPLAY_MODES.map((option) => {
          const Icon = option.icon
          const isCurrent = option.mode === mode
          return (
            <HudDropdownMenuItem
              key={option.mode}
              onSelect={() => {
                if (!isCurrent) onSelect(option.mode)
              }}
              className={option.desktopOnly ? 'hidden md:flex' : undefined}
              aria-checked={isCurrent}
              role="menuitemradio"
            >
              <Icon className="w-4 h-4 shrink-0 text-ink-muted" />
              <span className="flex-1">{option.label}</span>
              {isCurrent && <Check className="w-3.5 h-3.5 shrink-0 text-cyan-glow" />}
            </HudDropdownMenuItem>
          )
        })}
      </HudDropdownMenuContent>
    </HudDropdownMenu>
  )
}
