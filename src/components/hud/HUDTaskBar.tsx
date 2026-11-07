import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Clock, Calendar, RefreshCw, Sparkles, CheckCircle2, ChevronDown, ChevronUp, CheckSquare, Square, Award, Check, X, ListTodo } from 'lucide-react'
import { HudCard, HudBadge, HudBottomSheet } from '@/components/ui'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { Link } from '@tanstack/react-router'
import { OPEN_ALIGNMENT_PANEL_EVENT, isAlignmentPanelHostVisible } from '@/lib/alignment-panel'
import { CANONICAL_ALIGNMENT_TASKS, type AlignmentTaskItem } from '@/lib/alignment-tasks'

export interface AlignmentTask {
  id: string
  key?: string
  time: string
  title: string
  xp?: number
  completed: boolean
}

export type TimezoneMode = 'LOCAL' | 'UTC' | 'BENTHIC' | 'STARDATE'

export interface HUDTaskBarProps {
  variant?: 'hero' | 'header' | 'compact' | 'sidebar'
  /** `sidebar` variant only: render as a collapsed-rail cell. */
  collapsed?: boolean
  tasks?: AlignmentTask[]
  onCompleteTask?: (taskId: string) => void
  className?: string
}

export const HUDTaskBar: React.FC<HUDTaskBarProps> = ({
  variant = 'hero',
  tasks: propTasks,
  onCompleteTask,
  className = '',
  collapsed = false,
}) => {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState<Date>(new Date())
  const [is24Hour, setIs24Hour] = useState(true)
  const [mode, setMode] = useState<TimezoneMode>('LOCAL')
  const [isSyncing, setIsSyncing] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isMobileScreen, setIsMobileScreen] = useState(false)

  const alignment = useDailyAlignment()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => setIsMobileScreen(window.innerWidth < 640)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const headerIslandRef = useRef<HTMLDivElement>(null)

  // Use propTasks if passed (e.g. in tests/custom usage), otherwise use global alignment tasks
  const [localPropTasks, setLocalPropTasks] = useState<AlignmentTask[] | null>(propTasks || null)

  useEffect(() => {
    if (propTasks) {
      setLocalPropTasks(propTasks)
    }
  }, [propTasks])

  const localTasks: AlignmentTask[] = localPropTasks || alignment.tasks
  const countReady = Boolean(localPropTasks) || !alignment.isLoading

  // SSR hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  // Timer ticker loop (runs once per second globally)
  useEffect(() => {
    if (!mounted) return
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [mounted])

  // Click outside and escape key listener to close the desktop dropdown.
  // The phone sheet is portalled outside these refs and closes from its own backdrop and Escape.
  useEffect(() => {
    if (!isScheduleOpen || isMobileScreen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const insideDropdown = dropdownRef.current?.contains(target)
      const insideIsland = headerIslandRef.current?.contains(target)
      if (!insideDropdown && !insideIsland) {
        setIsScheduleOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsScheduleOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isScheduleOpen, isMobileScreen])

  // Other HUD controls can request the same quick liturgies panel.
  useEffect(() => {
    const handleOpenAlignmentPanel = () => {
      if ((variant === 'header' || variant === 'sidebar') && !isAlignmentPanelHostVisible(headerIslandRef.current)) {
        return
      }
      setIsScheduleOpen(true)
    }

    window.addEventListener(OPEN_ALIGNMENT_PANEL_EVENT, handleOpenAlignmentPanel)
    return () => {
      window.removeEventListener(OPEN_ALIGNMENT_PANEL_EVENT, handleOpenAlignmentPanel)
    }
  }, [variant])

  // Handle manual resync click
  const handleResync = () => {
    setIsSyncing(true)
    setTimeout(() => {
      setTime(new Date())
      setIsSyncing(false)
    }, 600)
  }

  const handleToggleTask = (taskId: string) => {
    const task = localTasks.find((item) => item.id === taskId || item.key === taskId)
    if ((task?.key === 'silent-synchronization' || taskId === 'silent-synchronization') && !onCompleteTask && !localPropTasks) {
      setIsScheduleOpen(false)
      alignment.openSilentSynchronization()
      return
    }
    if (onCompleteTask) {
      onCompleteTask(taskId)
    } else if (localPropTasks) {
      setLocalPropTasks((prev) =>
        prev ? prev.map((t) => (t.id === taskId || t.key === taskId ? { ...t, completed: !t.completed } : t)) : prev
      )
    } else {
      alignment.toggleTask(taskId)
    }
  }

  // Format digital numbers with leading zeros
  const pad = (num: number, size = 2) => String(num).padStart(size, '0')

  // Derive display time based on mode
  const getFormattedTimeParts = () => {
    if (!mounted) {
      return { hours: '00', minutes: '00', seconds: '00', millis: '00', ampm: '', label: 'SYSTEM TIME' }
    }

    const ms = pad(Math.floor(time.getMilliseconds() / 10))

    if (mode === 'UTC') {
      const h = time.getUTCHours()
      const m = pad(time.getUTCMinutes())
      const s = pad(time.getUTCSeconds())
      if (!is24Hour) {
        const h12 = h % 12 || 12
        const ampm = h >= 12 ? 'PM' : 'AM'
        return { hours: pad(h12), minutes: m, seconds: s, millis: ms, ampm, label: 'ZULU / UTC' }
      }
      return { hours: pad(h), minutes: m, seconds: s, millis: ms, ampm: 'UTC', label: 'ZULU / UTC' }
    }

    if (mode === 'BENTHIC') {
      const epochSeconds = Math.floor(time.getTime() / 1000)
      const benthicTide = (epochSeconds % 86400)
      const bHours = pad(Math.floor(benthicTide / 3600))
      const bMins = pad(Math.floor((benthicTide % 3600) / 60))
      const bSecs = pad(benthicTide % 60)
      return { hours: bHours, minutes: bMins, seconds: bSecs, millis: ms, ampm: 'TIDE', label: 'BENTHIC CHRONO' }
    }

    if (mode === 'STARDATE') {
      const year = time.getUTCFullYear()
      const dayOfYear = Math.floor((time.getTime() - new Date(year, 0, 0).getTime()) / 86400000)
      const stardate = `${year}.${pad(dayOfYear, 3)}`
      const sMins = pad(time.getMinutes())
      const sSecs = pad(time.getSeconds())
      return { hours: pad(time.getHours()), minutes: sMins, seconds: sSecs, millis: ms, ampm: `SD ${stardate}`, label: 'NEURAL STARDATE' }
    }

    // Default LOCAL mode
    const rawHours = time.getHours()
    const m = pad(time.getMinutes())
    const s = pad(time.getSeconds())

    if (!is24Hour) {
      const h12 = rawHours % 12 || 12
      const ampm = rawHours >= 12 ? 'PM' : 'AM'
      return { hours: pad(h12), minutes: m, seconds: s, millis: ms, ampm, label: 'LOCAL CHRONO' }
    }
    return { hours: pad(rawHours), minutes: m, seconds: s, millis: ms, ampm: '', label: 'LOCAL CHRONO' }
  }

  const { hours, minutes, seconds, millis, ampm, label } = getFormattedTimeParts()

  // Format date display
  const formatDateString = () => {
    if (!mounted) return 'AUG 24, 2026'
    return time.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).toUpperCase()
  }

  // Body scroll lock on mobile when modal sheet is open
  useEffect(() => {
    if (isScheduleOpen && typeof document !== 'undefined') {
      const originalOverflow = document.body.style.overflow
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        document.body.style.overflow = 'hidden'
      }
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isScheduleOpen])

  // Find the next upcoming uncompleted alignment task
  const nextTask = localTasks.find(t => !t.completed) || localTasks[localTasks.length - 1]
  const allTasksCompleted = localTasks.length > 0 && localTasks.every(t => t.completed)
  const completedCount = localTasks.filter(t => t.completed).length
  const liturgyCountText = `${completedCount}/${localTasks.length}`
  const progressPct = Math.round((completedCount / Math.max(localTasks.length, 1)) * 100)
  const nextTaskId = allTasksCompleted ? undefined : nextTask?.id
  const todayLabel = mounted
    ? time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : ''

  const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
  const listFrame = 'rounded-control border border-line-subtle divide-y divide-line-subtle overflow-hidden'

  // Shared body for the desktop dropdown and the phone bottom sheet
  const renderTodayContent = () => (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase">Today</span>
          {todayLabel && <span className="text-xs text-ink-muted truncate">{todayLabel}</span>}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsScheduleOpen(false); }}
          aria-label="Close today's tasks"
          className={`-mr-1 p-1.5 rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors ${focusRing}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            {countReady ? (
              <span className={`text-xs ${allTasksCompleted ? 'text-emerald-500 font-bold' : 'text-ink-muted'}`}>
                {allTasksCompleted ? 'All eight done for today' : `${completedCount} of ${localTasks.length} done`}
              </span>
            ) : (
              <span className="inline-block h-2 w-24 rounded-chip bg-surface-3 animate-pulse" aria-hidden />
            )}
          </div>
          <div className="w-full h-1 bg-surface-3 rounded-chip overflow-hidden" aria-hidden="true">
            <div
              className={`h-full rounded-chip transition-[width] duration-300 ${allTasksCompleted ? 'bg-emerald-500' : 'bg-cyan-glow'} ${
                countReady ? '' : 'opacity-0'
              }`}
              style={{ width: `${countReady ? progressPct : 0}%` }}
            />
          </div>

          <ul className={listFrame}>
            {localTasks.map((t) => {
              const isNext = t.id === nextTaskId
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleTask(t.id)
                    }}
                    aria-pressed={t.completed}
                    className={`w-full min-h-[44px] sm:min-h-10 px-3 py-2 flex items-center gap-3 text-left text-xs transition-colors touch-manipulation group focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
                      isNext ? 'bg-surface-3 shadow-nav-current' : t.completed ? 'bg-abyss/30 hover:bg-surface-2' : 'hover:bg-surface-2'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-4 h-4 shrink-0 rounded-chip border flex items-center justify-center transition-colors ${
                        t.completed ? 'bg-emerald-500 border-emerald-500 text-abyss' : 'border-line-strong group-hover:border-cyan-glow'
                      }`}
                    >
                      {t.completed && <Check className="w-3 h-3" strokeWidth={3} />}
                    </span>
                    <span className={`w-24 shrink-0 text-[11px] ${isNext ? 'text-cyan-glow font-bold' : 'text-ink-muted'}`}>
                      {t.time}
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate ${
                        t.completed ? 'line-through decoration-ink-muted/60 text-ink-muted' : 'text-ink font-bold'
                      }`}
                    >
                      {t.title}
                    </span>
                    {isNext && (
                      <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-glow">Next</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
    </>
  )

  // ══════════════════════════════════════════════════════════════════════════════
  // SIDEBAR ROW VARIANT (desktop sidebar footer; the panel opens beside the sidebar)
  // ══════════════════════════════════════════════════════════════════════════════
  if (variant === 'sidebar') {
    const countTone = allTasksCompleted ? 'text-emerald-500' : 'text-ink'
    const icon = allTasksCompleted && countReady ? (
      <Check className="w-4 h-4 shrink-0 text-emerald-500" aria-hidden="true" />
    ) : (
      <ListTodo
        className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
          isScheduleOpen ? 'text-cyan-glow' : 'text-ink-muted group-hover/align:text-ink'
        }`}
        aria-hidden="true"
      />
    )

    return (
      <div className={`relative overflow-visible ${className}`} ref={headerIslandRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsScheduleOpen((prev) => !prev)
          }}
          title="Today's tasks"
          aria-label="Daily alignment tasks schedule"
          aria-expanded={isScheduleOpen}
          aria-haspopup="dialog"
          aria-busy={!countReady}
          className={`w-full text-left relative flex transition-colors duration-150 group/align cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
            isScheduleOpen ? 'bg-surface-2' : 'bg-surface-1 hover:bg-surface-2'
          } ${collapsed ? 'flex-col items-center justify-center py-2 px-1 gap-1' : 'items-center min-h-[44px] px-4 py-2.5 pl-5 gap-3'}`}
        >
          {collapsed ? (
            <>
              {icon}
              <span className={`text-[11px] font-sans font-bold leading-none tabular-nums ${countReady ? countTone : 'text-ink-muted'}`}>
                {countReady ? liturgyCountText : '–'}
              </span>
            </>
          ) : (
            <>
              {icon}
              <span className="flex flex-col min-w-0 flex-1 leading-tight">
                <span className="text-xs md:text-[12.5px] font-sans font-medium tracking-wide uppercase text-ink-body group-hover/align:text-ink">
                  Daily alignment
                </span>
                {countReady && !allTasksCompleted && nextTask?.title && (
                  <span data-testid="header-next" className="text-[11px] font-sans text-ink-muted truncate mt-0.5">
                    Next: {nextTask.title}
                  </span>
                )}
              </span>
              {countReady ? (
                <span className={`shrink-0 text-xs font-bold tabular-nums ${countTone}`}>
                  {allTasksCompleted ? 'Done' : liturgyCountText}
                </span>
              ) : (
                <span className="inline-block shrink-0 h-2 w-6 rounded-chip bg-surface-3 animate-pulse" aria-hidden />
              )}
            </>
          )}
        </button>

        {isScheduleOpen && (
          <div
            ref={dropdownRef}
            data-testid="alignment-panel"
            className="absolute left-full bottom-0 ml-2 w-96 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-card border border-line bg-surface-1 shadow-menu p-4 z-[200] font-sans space-y-3 animate-in fade-in slide-in-from-left-2 duration-150"
          >
            {renderTodayContent()}
          </div>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // HEADER TILE VARIANT (HUDHeader bar and phone top bar)
  // ══════════════════════════════════════════════════════════════════════════════
  if (variant === 'header') {
    return (
      <div className={`relative ${className}`} ref={headerIslandRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsScheduleOpen((prev) => !prev)
          }}
          className={`relative w-11 h-11 -my-1 flex items-center justify-center rounded-control transition-colors select-none touch-manipulation shrink-0 ${focusRing} ${
            isScheduleOpen ? 'bg-surface-2' : 'hover:bg-surface-2'
          }`}
          title="Today's tasks"
          aria-label="Daily alignment tasks schedule"
          aria-description={countReady ? `${completedCount} of ${localTasks.length} done today` : undefined}
          aria-expanded={isScheduleOpen}
          aria-haspopup="dialog"
          aria-busy={!countReady}
        >
          <AlignmentRing
            done={countReady ? completedCount : 0}
            total={countReady ? localTasks.length : 0}
            label={countReady ? liturgyCountText : ''}
            complete={countReady && allTasksCompleted}
          />
        </button>

        {/* Desktop dropdown (>= 640px) */}
        {isScheduleOpen && !isMobileScreen && (
          <div
            ref={dropdownRef}
            data-testid="alignment-panel"
            className="absolute top-full right-0 mt-2 w-96 rounded-card border border-line bg-surface-1 shadow-menu p-4 z-50 font-sans space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {renderTodayContent()}
          </div>
        )}

        {/* Phone bottom sheet (< 640px) */}
        {mounted && (
          <HudBottomSheet
            isOpen={isScheduleOpen && isMobileScreen}
            onClose={() => setIsScheduleOpen(false)}
            title="Today's tasks"
            className="p-4 space-y-3"
          >
            <div data-testid="alignment-panel" className="space-y-3">
              {renderTodayContent()}
            </div>
          </HudBottomSheet>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // HERO DASHBOARD VARIANT
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <HudCard
      variant="cyan"
      className={`p-4 sm:p-5 relative font-sans ${className}`}
    >
      {/* ── TOP BAR: Mode Selector & Resync ── */}
      <div className="flex flex-wrap items-center justify-between border-b border-line-subtle pb-3 gap-2">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-cyan-glow animate-pulse" />
          <span className="font-grotesk text-xs sm:text-sm font-bold tracking-[0.08em] text-ink uppercase">
            BENTHIC CHRONOMETER
          </span>
          <span className="text-[11px] text-ink-muted hidden xs:inline">• {label}</span>
        </div>

        {/* Timezone Switcher Tabs & Resync */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 text-[11px]">
          {(['LOCAL', 'UTC', 'BENTHIC', 'STARDATE'] as TimezoneMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-0.5 rounded-control font-sans font-semibold border border-line transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                mode === m
                  ? 'bg-surface-2 text-ink font-bold shadow-[inset_0_-2px_0_theme(colors.cyan.glow)]'
                  : 'bg-surface-1 text-ink-muted hover:text-ink hover:bg-surface-2'
              }`}
            >
              {m}
            </button>
          ))}

          {/* 12H / 24H Toggle */}
          <button
            onClick={() => setIs24Hour(!is24Hour)}
            className="px-1.5 py-0.5 rounded-control bg-surface-1 text-ink-muted hover:text-ink hover:bg-surface-2 border border-line font-sans font-semibold text-[11px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            title="Toggle 12h/24h format"
          >
            {is24Hour ? '24H' : '12H'}
          </button>

          {/* Resync Button */}
          <button
            onClick={handleResync}
            className="p-1 rounded-control bg-surface-1 text-ink-muted hover:text-ink hover:bg-surface-2 border border-line transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            title="Resync internal clock cycle"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-cyan-glow' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── CENTER: Hero Digits & Calendar Date ── */}
      <div className="py-4 flex flex-col items-center justify-center space-y-1">
        {/* Large Neon Seven-Segment Digits */}
        <div className="flex items-baseline space-x-1 sm:space-x-2 select-none">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-cyan-glow">
              {hours}
            </span>
            <span className="text-[11px] text-ink-muted font-sans">HOURS</span>
          </div>

          {/* Colon Separator (Blinking) */}
          <span className="font-mono text-3xl sm:text-5xl md:text-6xl text-cyan-glow animate-pulse">
            :
          </span>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-cyan-glow">
              {minutes}
            </span>
            <span className="text-[11px] text-ink-muted font-sans">MINUTES</span>
          </div>

          {/* Colon Separator */}
          <span className="font-mono text-3xl sm:text-5xl md:text-6xl text-cyan-glow/60">
            :
          </span>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-cyan-glow">
              {seconds}
            </span>
            <span className="text-[11px] text-ink-muted font-sans">SECONDS</span>
          </div>

          {/* Milliseconds (Tactical Hud Accent) */}
          <div className="flex flex-col items-center hidden sm:flex">
            <span className="font-mono text-lg sm:text-2xl font-bold text-crimson-text">
              .{millis}
            </span>
            <span className="text-[11px] text-ink-muted font-sans">MS</span>
          </div>

          {/* AM/PM or Mode Badge */}
          {ampm && (
            <div className="self-start ml-1 mt-1">
              <span className="font-mono text-xs sm:text-sm font-bold text-amber-400 bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 rounded-chip">
                {ampm}
              </span>
            </div>
          )}
        </div>

        {/* Date & Global Sync Telemetry */}
        <div className="flex items-center space-x-3 text-xs text-ink-muted pt-1">
          <div className="flex items-center space-x-1 font-mono">
            <Calendar className="w-3.5 h-3.5 text-cyan-glow" />
            <span>{formatDateString()}</span>
          </div>
          <span>•</span>
          <span className="font-mono text-cyan-glow">SYNC: OPTIMAL (±0.02ms)</span>
        </div>
      </div>

      {/* ── BOTTOM: Alignment Liturgies Hub & Next Task ── */}
      <div className="border-t border-line-subtle pt-3 space-y-3">
        {/* Next Task Banner */}
        <div className="rounded-card border border-cyan-glow/40 bg-surface-2 hud-sheen p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div
            onClick={() => setIsScheduleOpen(!isScheduleOpen)}
            className="cursor-pointer group flex-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                <Sparkles className="w-3.5 h-3.5 text-crimson-text animate-pulse" />
                <span className="font-bold text-cyan-glow uppercase tracking-[0.08em]">
                  NEXT UPCOMING ALIGNMENT TASK
                </span>
              </div>
              <div className="text-cyan-glow group-hover:text-ink transition-colors">
                {isScheduleOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </div>

            {allTasksCompleted ? (
              <div className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-2 pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ALL DAILY ALIGNMENT LITURGIES VERIFIED FOR TODAY!</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
                <span className="text-xs sm:text-sm font-bold text-crimson-text font-sans">
                  [{nextTask.time}]
                </span>
                <span className="text-xs sm:text-sm font-bold text-ink group-hover:text-cyan-glow transition-colors truncate">
                  {nextTask.title}
                </span>
                <span className="text-[11px] text-ink-muted underline decoration-dotted">
                  (Click to view full day schedule)
                </span>
              </div>
            )}
          </div>

          {/* Quick Action Button for Next Task */}
          {!allTasksCompleted && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggleTask(nextTask.id)
              }}
              className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-glow hover:bg-cyan-hover hover:drop-shadow-[0_0_10px_rgba(0,195,255,0.45)] text-abyss font-bold text-xs uppercase tracking-[0.08em] rounded-control transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>COMPLETE ALIGNMENT</span>
            </button>
          )}
        </div>

        {/* ═══ EXPANDABLE FULL DAY SCHEDULE DROPDOWN ═══ */}
        {isScheduleOpen && (
          <div className="mt-4 pt-3 border-t border-line-subtle space-y-3 animate-in fade-in duration-200">
            {/* Dropdown Summary Bar */}
            <div className="flex items-center justify-between text-xs text-ink-muted font-sans px-1">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-glow" />
                <span className="font-bold text-ink uppercase">FULL DAY LITURGY SCHEDULE</span>
              </div>
              <div className="text-[11px] text-cyan-glow font-sans">
                {countReady ? (
                  `${completedCount} of ${localTasks.length} COMPLETED`
                ) : (
                  <span
                    className="inline-block h-2 w-24 rounded-chip bg-cyan-glow/40 animate-pulse"
                    aria-hidden
                  />
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-surface-3 rounded-chip overflow-hidden">
              <div
                className={`h-full rounded-chip transition-all duration-300 ${allTasksCompleted ? 'bg-emerald-500' : 'bg-cyan-glow'}`}
                style={{
                  width: countReady
                    ? `${Math.round((completedCount / Math.max(localTasks.length, 1)) * 100)}%`
                    : '35%',
                }}
              />
            </div>

            {/* All Tasks List in Chronological Order */}
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
              {localTasks.map((t) => {
                const isNext = t.id === nextTask.id && !allTasksCompleted
                return (
                  <div
                    key={t.id}
                    onClick={() => handleToggleTask(t.id)}
                    className={`flex items-center justify-between p-2.5 rounded-card border transition-colors cursor-pointer ${
                      isNext
                        ? 'bg-cyan-soft border-cyan-glow/40'
                        : t.completed
                        ? 'bg-surface-1 border-line-subtle opacity-75 hover:opacity-100'
                        : 'bg-surface-1 border-line-subtle hover:bg-surface-2 hover:border-line-strong'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleTask(t.id)
                        }}
                        className="rounded-chip text-cyan-glow hover:scale-110 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                      >
                        {t.completed ? (
                          <CheckSquare className="w-4 h-4 text-cyan-glow" />
                        ) : (
                          <Square className="w-4 h-4 text-ink-muted" />
                        )}
                      </button>

                      <span className={`text-xs font-sans font-bold ${isNext ? 'text-crimson-text' : 'text-ink-muted'}`}>
                        [{t.time}]
                      </span>

                      <span className={`text-xs font-sans font-bold truncate ${
                        t.completed ? 'line-through text-ink-muted' : 'text-ink'
                      }`}>
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold text-cyan-glow bg-cyan-soft border border-line-subtle px-1.5 py-0.5 rounded-chip font-sans">
                        {t.completed ? 'COMPLETE' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </HudCard>
  )
}

// Backward-compatibility alias
export const DigitalClock = HUDTaskBar
export type DigitalClockProps = HUDTaskBarProps

/** Small progress ring for the phone top bar: today's done/total count inside a thin arc. */
function AlignmentRing({ done, total, label, complete }: { done: number; total: number; label: string; complete: boolean }) {
  const size = 32
  const stroke = 3
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const filled = total > 0 ? (c * done) / total : 0
  return (
    <span data-testid="alignment-ring" className="relative inline-flex items-center justify-center w-8 h-8" aria-hidden>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-3" />
        {filled > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${c}`}
            className={`${complete ? 'stroke-emerald-500' : 'stroke-cyan-glow'} transition-[stroke-dasharray] duration-300 motion-reduce:transition-none`}
          />
        )}
      </svg>
      {label ? (
        <span
          data-testid="header-count"
          className={`relative text-[11px] font-bold leading-none tabular-nums ${complete ? 'text-emerald-500' : 'text-ink'}`}
        >
          {label}
        </span>
      ) : (
        <span className="relative h-1.5 w-3 rounded-chip bg-surface-3 animate-pulse" />
      )}
    </span>
  )
}
