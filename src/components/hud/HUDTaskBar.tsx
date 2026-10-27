import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Clock, Calendar, RefreshCw, Sparkles, CheckCircle2, ChevronDown, ChevronUp, CheckSquare, Square, Award, Bell, Check, X, ListTodo } from 'lucide-react'
import { HudCard, HudBadge, HudBottomSheet } from '@/components/ui'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useNotifications } from '@/hooks/useNotifications'
import { Link } from '@tanstack/react-router'
import { OPEN_ALIGNMENT_PANEL_EVENT, isAlignmentPanelHostVisible } from '@/lib/alignment-panel'
import { CANONICAL_ALIGNMENT_TASKS, type AlignmentTaskItem } from '@/lib/alignment-tasks'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { isForumInboxKind } from '@/lib/notifications'
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
  const progressPct = Math.round((completedCount / Math.max(localTasks.length, 1)) * 100)
  const nextTaskId = allTasksCompleted ? undefined : nextTask?.id
  const alertsCount = notificationUnread + toastHistoryList.length
  const hasAnyAlerts = dbNotifications.length > 0 || toastHistoryList.length > 0
  const todayLabel = mounted
    ? time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : ''

  const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
  const sectionLabel = 'text-[11px] font-bold tracking-[0.08em] uppercase text-ink-muted'
  const listFrame = 'rounded-control border border-line-subtle divide-y divide-line-subtle overflow-hidden'

  const renderTab = (id: 'liturgies' | 'transmissions', label: string, meta: React.ReactNode, Icon: typeof ListTodo) => {
    const selected = activeTab === id
    return (
      <button
        type="button"
        role="tab"
        aria-selected={selected}
        onClick={() => setActiveTab(id)}
        className={`min-h-10 sm:min-h-8 px-2 rounded-control text-xs font-bold flex items-center justify-center gap-2 transition-colors touch-manipulation ${focusRing} ${
          selected ? 'bg-surface-3 shadow-nav-current text-ink' : 'text-ink-muted hover:text-ink hover:bg-surface-2'
        }`}
      >
        <Icon className={`w-3.5 h-3.5 ${selected ? 'text-cyan-glow' : ''}`} aria-hidden="true" />
        <span>{label}</span>
        {meta}
      </button>
    )
  }

  const renderAlertRow = (key: string, title: React.ReactNode, detail: React.ReactNode, unread: boolean) => (
    <div key={key} className="flex items-start gap-2.5 min-w-0">
      <span
        aria-hidden="true"
        className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${unread ? 'bg-cyan-glow' : 'bg-surface-3'}`}
      />
      <span className="min-w-0 flex-1 space-y-0.5">
        {title && <span className="block text-xs font-bold text-ink">{title}</span>}
        {detail && <span className="block text-xs text-ink-body leading-snug">{detail}</span>}
      </span>
    </div>
  )

  // Shared body for the desktop dropdown and the phone bottom sheet
  const renderActivityContent = () => (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase">Today</span>
          {todayLabel && <span className="text-xs text-ink-muted truncate">{todayLabel}</span>}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsScheduleOpen(false); }}
          aria-label="Close activity center"
          className={`-mr-1 p-1.5 rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors ${focusRing}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div role="tablist" aria-label="Today" className="grid grid-cols-2 gap-1 p-1 bg-abyss border border-line-subtle rounded-card">
        {renderTab(
          'liturgies',
          'Tasks',
          countReady ? (
            <span className={`tabular-nums ${allTasksCompleted ? 'text-emerald-500' : 'text-ink-muted'}`}>{liturgyCountText}</span>
          ) : null,
          ListTodo,
        )}
        {renderTab(
          'transmissions',
          'Alerts',
          alertsCount > 0 ? (
            <span className="min-w-5 px-1 rounded-chip bg-crimson-soft text-crimson-text text-[11px] tabular-nums">
              {alertsCount}
            </span>
          ) : null,
          Bell,
        )}
      </div>

      {activeTab === 'liturgies' && (
        <div role="tabpanel" aria-label="Tasks" className="space-y-2.5">
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
      )}

      {activeTab === 'transmissions' && (
        <div role="tabpanel" aria-label="Alerts" className="space-y-3">
          {(notificationUnread > 0 || toastHistoryList.length > 0) && (
            <div className="flex items-center justify-end gap-3 text-[11px]">
              {notificationUnread > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    void markAllRead()
                  }}
                  className={`min-h-8 px-1 rounded-control font-bold text-ink-muted hover:text-ink transition-colors ${focusRing}`}
                >
                  Mark all read
                </button>
              )}
              {toastHistoryList.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearToastsFn(); }}
                  className={`min-h-8 px-1 rounded-control font-bold text-ink-muted hover:text-ink transition-colors ${focusRing}`}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {!hasAnyAlerts && (
            <div className="py-6 text-center space-y-1">
              <Bell className="w-5 h-5 text-ink-muted mx-auto" aria-hidden="true" />
              <div className="text-sm font-bold text-ink">Nothing new</div>
              <div className="text-xs text-ink-muted">Alerts from this visit show up here.</div>
            </div>
          )}

          {actionableNotifications.length > 0 && (
            <section className="space-y-1.5">
              <h3 className={sectionLabel}>Needs you</h3>
              <ul className={`${listFrame} max-h-60 overflow-y-auto`}>
                {actionableNotifications.map((n) => (
                  <li key={n.id} className="p-3 space-y-2">
                    {renderAlertRow(n.id, n.title, n.detail, !n.readAt)}
                    <div className="flex flex-wrap gap-1.5 pl-4">
                      {n.payload.requestId && (
                        <>
                          <button
                            type="button"
                            className={`min-h-8 px-2.5 text-[11px] font-bold rounded-control bg-cyan-glow hover:bg-cyan-hover text-abyss transition-colors ${focusRing}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              void acceptFriendRequest(n.payload.requestId!, n.id)
                            }}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className={`min-h-8 px-2.5 text-[11px] font-bold rounded-control border border-line text-ink-muted hover:text-ink hover:border-line-strong transition-colors ${focusRing}`}
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
                          className={`min-h-8 inline-flex items-center px-2.5 text-[11px] font-bold rounded-control border border-line text-ink-muted hover:text-ink hover:border-line-strong transition-colors ${focusRing}`}
                          onClick={() => setIsScheduleOpen(false)}
                        >
                          View profile
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recentNotifications.length > 0 && (
            <section className="space-y-1.5">
              <h3 className={sectionLabel}>Recent</h3>
              <ul className={`${listFrame} max-h-60 overflow-y-auto`}>
                {recentNotifications.map((n) => {
                  const rowClass = `block w-full text-left px-3 py-2.5 hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
                    n.readAt ? 'opacity-75' : ''
                  }`
                  const body = renderAlertRow(n.id, n.title, n.detail, !n.readAt)
                  const markAndClose = () => {
                    if (!n.readAt) void markRead(n.id)
                    setIsScheduleOpen(false)
                  }
                  if (isForumInboxKind(n.kind)) {
                    const categorySlug = n.payload.categorySlug?.trim()
                    const topicSlug = n.payload.topicSlug?.trim()
                    const postId = n.payload.postId?.trim()
                    return (
                      <li key={n.id}>
                        {categorySlug && topicSlug ? (
                          <Link
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
                        ) : (
                          <Link
                            to="/forum"
                            className={rowClass}
                            onClick={(e) => {
                              e.stopPropagation()
                              markAndClose()
                            }}
                          >
                            {body}
                          </Link>
                        )}
                      </li>
                    )
                  }
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={rowClass}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!n.readAt) void markRead(n.id)
                        }}
                      >
                        {body}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {toastHistoryList.length > 0 && (
            <section className="space-y-1.5">
              <h3 className={sectionLabel}>This session</h3>
              <ul className={`${listFrame} max-h-60 overflow-y-auto`}>
                {toastHistoryList.map((t) => (
                  <li key={t.id} className="px-3 py-2.5">
                    {renderAlertRow(t.id, t.title, t.message, false)}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  )

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
          className={`relative flex items-center gap-2 h-9 md:h-8 md:w-[260px] md:min-w-[260px] px-2.5 rounded-control border text-xs transition-colors select-none touch-manipulation ${focusRing} ${
            isScheduleOpen
              ? 'bg-surface-3 shadow-nav-current border-transparent text-ink'
              : 'bg-surface-1 border-line hover:bg-surface-2 hover:border-line-strong text-ink'
          }`}
          title="Today's tasks and alerts"
          aria-label="Daily alignment tasks schedule"
          aria-expanded={isScheduleOpen}
          aria-haspopup="dialog"
          aria-busy={!countReady}
        >
          {allTasksCompleted && countReady ? (
            <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
          ) : (
            <ListTodo className={`w-3.5 h-3.5 shrink-0 ${isScheduleOpen ? 'text-cyan-glow' : 'text-ink-muted'}`} aria-hidden="true" />
          )}

          {countReady ? (
            allTasksCompleted ? (
              <span className="hidden md:inline text-emerald-500 font-bold">All done</span>
            ) : (
              <span data-testid="header-next" className="hidden md:inline min-w-0 truncate text-ink-muted">
                Next <span className="text-ink font-bold">{nextTask?.title || 'None'}</span>
              </span>
            )
          ) : (
            <span className="hidden md:inline-block h-2 w-20 rounded-chip bg-surface-3 animate-pulse" aria-hidden />
          )}

          {countReady ? (
            <span className={`shrink-0 font-bold tabular-nums md:ml-auto md:pl-2 md:border-l md:border-line-subtle ${allTasksCompleted ? 'text-emerald-500' : 'text-ink'}`}>
              {liturgyCountText}
            </span>
          ) : (
            <span className="inline-block shrink-0 md:ml-auto h-2 w-6 rounded-chip bg-surface-3 animate-pulse" aria-hidden />
          )}

          {notificationUnread > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-chip bg-crimson-aggro text-abyss text-[11px] font-bold leading-[18px] text-center tabular-nums"
              aria-label={`${notificationUnread} new alerts`}
            >
              {notificationUnread}
            </span>
          )}
        </button>

        {/* Desktop dropdown (>= 640px) */}
        {isScheduleOpen && !isMobileScreen && (
          <div
            ref={dropdownRef}
            data-testid="alignment-panel"
            className="absolute top-full right-0 mt-2 w-96 rounded-card border border-line bg-surface-1 shadow-menu p-4 z-50 font-sans space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {renderActivityContent()}
          </div>
        )}

        {/* Phone bottom sheet (< 640px) */}
        {mounted && (
          <HudBottomSheet
            isOpen={isScheduleOpen && isMobileScreen}
            onClose={() => setIsScheduleOpen(false)}
            title="Today's tasks and alerts"
            className="p-4 space-y-3"
          >
            <div data-testid="alignment-panel" className="space-y-3">
              {renderActivityContent()}
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
