import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Clock, Calendar, RefreshCw, Sparkles, CheckCircle2, ChevronDown, ChevronUp, CheckSquare, Square, Award, Bell, BellOff, Zap, Radio, X, Trash2, ListTodo } from 'lucide-react'
import { HudCard, HudBadge, HudBottomSheet } from '@/components/ui'
import { useAlignmentReminders } from '@/hooks/useAlignmentReminders'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useNotifications } from '@/hooks/useNotifications'
import { Link } from '@tanstack/react-router'
import { OPEN_ALIGNMENT_PANEL_EVENT, isAlignmentPanelHostVisible } from '@/lib/alignment-panel'
import { CANONICAL_ALIGNMENT_TASKS, type AlignmentTaskItem } from '@/lib/alignment-tasks'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { ACTIVITY_INBOX_LABEL, isForumInboxKind } from '@/lib/notifications'
import { forumPostAnchorId } from '@/lib/forum-mentions'

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
  variant?: 'hero' | 'header' | 'compact'
  tasks?: AlignmentTask[]
  onCompleteTask?: (taskId: string) => void
  className?: string
}

export const HUDTaskBar: React.FC<HUDTaskBarProps> = ({
  variant = 'hero',
  tasks: propTasks,
  onCompleteTask,
  className = '',
}) => {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState<Date>(new Date())
  const [is24Hour, setIs24Hour] = useState(true)
  const [mode, setMode] = useState<TimezoneMode>('LOCAL')
  const [isSyncing, setIsSyncing] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'liturgies' | 'transmissions'>('liturgies')
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

  // ToastProvider context for notification telemetry (optional-safe)
  const toastCtx = useOptionalToast()
  const toastsList: any[] = toastCtx?.toasts || []
  const toastHistoryList: any[] = toastCtx?.toastHistory || toastCtx?.toasts || []
  const clearToastsFn = toastCtx?.clearToasts ?? (() => {})

  const {
    notifications: dbNotifications,
    unreadCount: notificationUnread,
    markAllRead,
    acceptFriendRequest,
    declineFriendRequest,
    markRead,
  } = useNotifications()

  const actionableNotifications = dbNotifications.filter((n) => n.actionable)
  const recentNotifications = dbNotifications.filter((n) => !n.actionable)
  const alertsBadgeCount = notificationUnread + toastHistoryList.length

  // Use propTasks if passed (e.g. in tests/custom usage), otherwise use global alignment tasks
  const [localPropTasks, setLocalPropTasks] = useState<AlignmentTask[] | null>(propTasks || null)

  useEffect(() => {
    if (propTasks) {
      setLocalPropTasks(propTasks)
    }
  }, [propTasks])

  const localTasks: AlignmentTask[] = localPropTasks || alignment.tasks
  const countReady = Boolean(localPropTasks) || !alignment.isLoading

  const { remindersEnabled, toggleReminders, getTaskReminderTime } =
    useAlignmentReminders(localTasks)

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

  // Click outside and escape key listener to close dropdown
  useEffect(() => {
    if (!isScheduleOpen) return

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
  }, [isScheduleOpen])

  // Dashboard Daily Alignment card (and leftover /alignment hops) open this same panel.
  useEffect(() => {
    const handleOpenAlignmentPanel = () => {
      if (variant === 'header' && !isAlignmentPanelHostVisible(headerIslandRef.current)) {
        return
      }
      setActiveTab('liturgies')
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

  const renderLiturgyCount = (className: string) =>
    countReady ? (
      <span className={className}>{liturgyCountText}</span>
    ) : (
      <span
        className={`${className} inline-flex items-center justify-center min-w-[2.25rem]`}
        aria-hidden
      >
        <span className="inline-block h-2 w-4 rounded-chip bg-cyan-glow/40 animate-pulse" />
      </span>
    )

  // Sub-renderer for Activity Center content (shared across desktop dropdown & mobile bottom sheet)
  const renderActivityContent = () => (
    <>
      {/* Header: Title & Close Button */}
      <div className="flex items-center justify-between border-b border-line-subtle pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-glow animate-pulse" />
          <span className="font-grotesk text-xs font-bold text-ink tracking-[0.08em] uppercase">
            DAILY ALIGNMENT SCHEDULE
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setIsScheduleOpen(false); }}
          aria-label="Close activity center"
          className="text-ink-muted hover:text-ink p-1 rounded-control hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Segmented Control Tabs (iOS / Dynamic Island Style) */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-abyss border border-line-subtle rounded-card">
        <button
          onClick={() => setActiveTab('liturgies')}
          className={`py-1.5 sm:py-1 px-2 rounded-control font-sans text-[11px] font-bold tracking-[0.08em] transition-colors flex items-center justify-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
            activeTab === 'liturgies'
              ? 'bg-surface-2 text-ink shadow-[inset_0_-2px_0_theme(colors.cyan.glow)]'
              : 'text-ink-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          <Zap className="w-3 h-3 text-cyan-glow" />
          <span>
            {countReady ? `LITURGIES (${liturgyCountText})` : 'LITURGIES'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('transmissions')}
          className={`py-1.5 sm:py-1 px-2 rounded-control font-sans text-[11px] font-bold tracking-[0.08em] transition-colors flex items-center justify-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow relative ${
            activeTab === 'transmissions'
              ? 'bg-surface-2 text-ink shadow-[inset_0_-2px_0_theme(colors.cyan.glow)]'
              : 'text-ink-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          <Radio className="w-3 h-3 text-crimson-text" />
          <span>ALERTS ({alertsBadgeCount})</span>
          {(toastsList.length > 0 || notificationUnread > 0) && (
            <span className="w-2 h-2 rounded-full bg-crimson-aggro animate-pulse" />
          )}
        </button>
      </div>

      {/* ── TAB 1: LITURGIES & UPCOMING SCHEDULE ── */}
      {activeTab === 'liturgies' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Spotlight "Next Up" Live Activity Card */}
          {nextTask && !allTasksCompleted ? (
            <div className="p-3 rounded-card border border-cyan-glow/40 bg-surface-2 hud-sheen space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans font-bold text-cyan-glow tracking-[0.08em] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-crimson-text animate-pulse" />
                  NEXT IMPENDING LITURGY
                </span>
                <span className="text-[11px] font-bold text-cyan-glow bg-cyan-soft border border-line-subtle px-1.5 py-0.2 rounded-chip font-sans">
                  {nextTask.time}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-sans font-bold text-crimson-text mr-1.5">
                    [{nextTask.time}]
                  </span>
                  <span className="text-xs font-bold text-ink truncate">
                    {nextTask.title}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleTask(nextTask.id)
                  }}
                  className="shrink-0 px-2.5 py-1.5 sm:py-1 bg-cyan-glow hover:bg-cyan-hover text-abyss font-bold text-[11px] uppercase tracking-[0.08em] rounded-control transition-colors active:scale-95 flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>COMPLETE</span>
                </button>
              </div>
            </div>
          ) : allTasksCompleted ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-card flex items-center gap-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ALL DAILY LITURGIES VERIFIED FOR TODAY</span>
            </div>
          ) : null}

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-ink-muted">
              {countReady ? (
                <>
                  <span>PROGRESS: {liturgyCountText} COMPLETED</span>
                  <span className="text-cyan-glow font-bold">
                    {Math.round((completedCount / Math.max(localTasks.length, 1)) * 100)}%
                  </span>
                </>
              ) : (
                <span
                  className="inline-block h-2 w-28 rounded-chip bg-cyan-glow/25 animate-pulse"
                  aria-hidden
                />
              )}
            </div>
            <div className="w-full h-1.5 bg-surface-3 rounded-chip overflow-hidden">
              <div
                className={`h-full rounded-chip ${allTasksCompleted ? 'bg-emerald-500' : 'bg-cyan-glow'} ${
                  countReady ? 'transition-all duration-300' : 'animate-pulse opacity-40'
                }`}
                style={{
                  width: countReady
                    ? `${Math.round((completedCount / Math.max(localTasks.length, 1)) * 100)}%`
                    : '35%',
                }}
              />
            </div>
          </div>

          {/* Scrollable list of 8 liturgies */}
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {localTasks.map((t) => {
              const isNext = t.id === nextTask.id && !allTasksCompleted
              const reminderTime = getTaskReminderTime(t.time)
              return (
                <div
                  key={t.id}
                  onClick={() => handleToggleTask(t.id)}
                  className={`flex items-center justify-between p-2 rounded-card border transition-colors cursor-pointer ${
                    isNext
                      ? 'bg-cyan-soft border-cyan-glow/40'
                      : t.completed
                      ? 'bg-surface-1 border-line-subtle opacity-70'
                      : 'bg-surface-1 border-line-subtle hover:bg-surface-2 hover:border-line-strong'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleTask(t.id)
                      }}
                      className="rounded-chip text-cyan-glow hover:scale-110 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                    >
                      {t.completed ? (
                        <CheckSquare className="w-3.5 h-3.5 text-cyan-glow" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-ink-muted" />
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-sans font-bold ${isNext ? 'text-crimson-text' : 'text-ink-muted'}`}>
                        [{t.time}]
                      </span>
                      {reminderTime && (
                        <span className="text-[11px] text-amber-400 bg-amber-500/15 px-1 rounded-chip border border-amber-500/30 hidden xs:inline-flex items-center gap-0.5">
                          <Bell className="w-2.5 h-2.5" /> {reminderTime}
                        </span>
                      )}
                    </div>

                    <span className={`text-[11px] font-sans font-bold truncate ${
                      t.completed ? 'line-through text-ink-muted' : 'text-ink'
                    }`}>
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-sans text-cyan-glow bg-surface-2 px-1.5 py-0.2 border border-line-subtle rounded-chip">
                      {t.completed ? 'COMPLETE' : 'PENDING'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: TRANSMISSIONS & TOAST ALERTS ── */}
      {activeTab === 'transmissions' && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px] text-ink-muted">
            <span>{ACTIVITY_INBOX_LABEL}</span>
            <div className="flex items-center gap-2">
              {notificationUnread > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    void markAllRead()
                  }}
                  className="rounded-control text-cyan-glow hover:text-ink font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  MARK ALL READ
                </button>
              )}
              {toastHistoryList.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearToastsFn(); }}
                  className="rounded-control text-crimson-text hover:text-crimson-hover flex items-center gap-1 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  <Trash2 className="w-2.5 h-2.5" /> CLEAR
                </button>
              )}
            </div>
          </div>

          {actionableNotifications.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold tracking-[0.08em] text-cyan-glow uppercase">
                Action Required
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {actionableNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2 rounded-card bg-surface-1 hud-sheen border border-line space-y-2"
                  >
                    <div className="text-[11px] font-bold text-cyan-glow font-grotesk tracking-[0.08em]">
                      {n.title}
                    </div>
                    <div className="text-ink-body text-[11px] leading-tight">{n.detail}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {n.payload.requestId && (
                        <>
                          <button
                            type="button"
                            className="px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/15 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                            onClick={(e) => {
                              e.stopPropagation()
                              void acceptFriendRequest(n.payload.requestId!, n.id)
                            }}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] border border-line text-ink-muted hover:border-crimson-aggro hover:text-crimson-text rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                            onClick={(e) => {
                              e.stopPropagation()
                              void declineFriendRequest(n.payload.requestId!, n.id)
                            }}
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {n.payload.profileId && (
                        <Link
                          to="/member/$profileId"
                          params={{
                            profileId: resolveMemberPublicParam({
                              id: n.payload.profileId,
                              handle: n.actorHandle,
                            }),
                          }}
                          className="px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] border border-line text-cyan-glow hover:border-line-strong hover:bg-surface-2 rounded-control transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                          onClick={() => setIsScheduleOpen(false)}
                        >
                          View Profile
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentNotifications.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold tracking-[0.08em] text-ink-muted uppercase">
                Recent Transmissions
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {recentNotifications.map((n) => {
                  const rowClass = `w-full text-left p-2 rounded-card bg-surface-1 hover:bg-surface-2 border flex items-start gap-2 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                    n.readAt ? 'border-line-subtle opacity-80' : 'border-line'
                  }`
                  const body = (
                    <>
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          n.readAt ? 'bg-ink-muted/40' : 'bg-cyan-glow'
                        }`}
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="text-[11px] font-bold text-cyan-glow font-grotesk tracking-[0.08em]">
                          {n.title}
                        </div>
                        <div className="text-ink-body text-[11px] leading-tight">{n.detail}</div>
                      </div>
                    </>
                  )
                  const markAndClose = () => {
                    if (!n.readAt) void markRead(n.id)
                    setIsScheduleOpen(false)
                  }
                  if (isForumInboxKind(n.kind)) {
                    const categorySlug = n.payload.categorySlug?.trim()
                    const topicSlug = n.payload.topicSlug?.trim()
                    const postId = n.payload.postId?.trim()
                    if (categorySlug && topicSlug) {
                      return (
                        <Link
                          key={n.id}
                          to="/forum/$categorySlug/$topicSlug"
                          params={{ categorySlug, topicSlug }}
                          hash={postId ? forumPostAnchorId(postId) : undefined}
                          className={rowClass}
                          onClick={(e) => {
                            e.stopPropagation()
                            markAndClose()
                          }}
                        >
                          {body}
                        </Link>
                      )
                    }
                    return (
                      <Link
                        key={n.id}
                        to="/forum"
                        className={rowClass}
                        onClick={(e) => {
                          e.stopPropagation()
                          markAndClose()
                        }}
                      >
                        {body}
                      </Link>
                    )
                  }
                  return (
                    <button
                      key={n.id}
                      type="button"
                      className={rowClass}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!n.readAt) void markRead(n.id)
                      }}
                    >
                      {body}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="text-[11px] font-bold tracking-[0.08em] text-ink-muted uppercase">
              Ephemeral Toasts
            </div>
            {toastHistoryList.length === 0 ? (
              <div className="p-4 text-center text-xs text-ink-muted space-y-1">
                {dbNotifications.length === 0 && (
                  <>
                    <Radio className="w-6 h-6 text-ink-muted/40 mx-auto animate-pulse" />
                    <div>ALL FREQUENCIES QUIET</div>
                    <div className="text-[11px] text-ink-muted">
                      No hails, replies, or friend alerts in the log.
                    </div>
                  </>
                )}
                {dbNotifications.length > 0 && (
                  <div className="text-[11px] text-ink-muted">No recent toast alerts.</div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {toastHistoryList.map((t) => (
                  <div
                    key={t.id}
                    className="p-2 rounded-card bg-surface-1 border border-line-subtle flex items-start gap-2 text-xs"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-glow mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      {t.title && (
                        <div className="text-[11px] font-bold text-cyan-glow font-grotesk tracking-[0.08em]">
                          {t.title}
                        </div>
                      )}
                      <div className="text-ink-body text-[11px] leading-tight">
                        {t.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Status Controls */}
      <div className="pt-2 border-t border-line-subtle flex items-center justify-between text-[11px]">
        <button
          onClick={toggleReminders}
          className="flex items-center gap-1 px-2 py-0.5 border border-line hover:border-line-strong bg-surface-1 hover:bg-surface-2 text-cyan-glow transition-colors rounded-control text-[11px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          title="Toggle automated 10-minute prior toast reminders"
        >
          {remindersEnabled ? <Bell className="w-2.5 h-2.5 text-cyan-glow" /> : <BellOff className="w-2.5 h-2.5 text-crimson-text" />}
          <span>{remindersEnabled ? '10M REMINDERS: ON' : 'REMINDERS: OFF'}</span>
        </button>
      </div>
    </>
  )

  // ══════════════════════════════════════════════════════════════════════════════
  // HEADER PILL VARIANT (Minimalist, for HUDHeader bar)
  // ══════════════════════════════════════════════════════════════════════════════
  if (variant === 'header') {
    return (
      <div className={`relative ${className}`} ref={headerIslandRef}>
        {/* Dynamic Island style header pill button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsScheduleOpen((prev) => !prev)
          }}
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-control bg-surface-1 hud-sheen hover:bg-surface-2 border border-line hover:border-line-strong text-ink transition-colors select-none group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          title="Open Activity Center & Liturgy Schedule"
          aria-label="Daily alignment tasks schedule"
          aria-expanded={isScheduleOpen}
          aria-busy={!countReady}
        >
          {/* Alignment status: next liturgy, or complete once 8/8 is sealed */}
          <span className="text-[11px] text-ink-muted hidden md:inline truncate max-w-[130px] font-sans">
            {countReady ? (
              allTasksCompleted ? (
                <span className="text-emerald-400 font-semibold">COMPLETE</span>
              ) : (
                <>
                  NEXT: <span className="text-ink font-semibold">{nextTask?.title || 'None'}</span>
                </>
              )
            ) : (
              <span
                className="inline-block h-2 w-20 rounded-chip bg-ink-muted/30 animate-pulse align-middle"
                aria-hidden
              />
            )}
          </span>

          {/* Liturgy Count Badge */}
          {renderLiturgyCount(
            'text-[11px] font-sans font-bold px-1.5 py-0.2 rounded-chip bg-cyan-soft text-cyan-glow border border-line-subtle',
          )}

          {notificationUnread > 0 && (
            <span className="text-[11px] font-sans font-bold px-1.5 py-0.2 rounded-chip bg-crimson-soft text-crimson-text border border-crimson-aggro/40 animate-pulse">
              {notificationUnread}
            </span>
          )}

          {/* Chevron Indicator */}
          {isScheduleOpen ? (
            <ChevronUp className="w-3 h-3 text-cyan-glow" />
          ) : (
            <ChevronDown className="w-3 h-3 text-ink-muted group-hover:text-cyan-glow" />
          )}
        </button>

        {/* ═══ DESKTOP FLOATING FLYOUT DROPDOWN (>= 640px) ═══ */}
        {isScheduleOpen && !isMobileScreen && (
          <div
            ref={dropdownRef}
            className="absolute top-full right-0 mt-2 w-80 sm:w-96 rounded-card border border-line bg-surface-1 shadow-menu p-3.5 z-50 font-sans space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {renderActivityContent()}
          </div>
        )}

        {/* ═══ MOBILE BOTTOM-ANCHORED MODAL SHEET (< 640px) ═══ */}
        {mounted && (
          <HudBottomSheet
            isOpen={isScheduleOpen && isMobileScreen}
            onClose={() => setIsScheduleOpen(false)}
            title="Activity Center"
            className="p-4 space-y-3"
          >
            {renderActivityContent()}
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
