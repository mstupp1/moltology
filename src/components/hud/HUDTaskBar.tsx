import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Clock, Calendar, RefreshCw, Sparkles, CheckCircle2, ChevronDown, ChevronUp, CheckSquare, Square, Award, Bell, BellOff, Zap, Radio, X, Trash2, ListTodo } from 'lucide-react'
import { HudCard, HudBadge, HudBottomSheet } from '@/components/ui'
import { useAlignmentReminders } from '@/hooks/useAlignmentReminders'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { useNotifications } from '@/hooks/useNotifications'
import { Link } from '@tanstack/react-router'
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
        <span className="inline-block h-2 w-4 rounded-full bg-[#00c3ff]/40 animate-pulse" />
      </span>
    )

  // Sub-renderer for Activity Center content (shared across desktop dropdown & mobile bottom sheet)
  const renderActivityContent = () => (
    <>
      {/* Header: Title & Close Button */}
      <div className="flex items-center justify-between border-b border-[#00c3ff]/20 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00c3ff] animate-pulse" />
          <span className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-widest uppercase">
            DAILY ALIGNMENT SCHEDULE
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setIsScheduleOpen(false); }}
          aria-label="Close activity center"
          className="text-[#839493] hover:text-[#00c3ff] p-1 rounded-full hover:bg-[#ffffff]/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Segmented Control Tabs (iOS / Dynamic Island Style) */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-[#020507] border border-[#00c3ff]/20 rounded-lg">
        <button
          onClick={() => setActiveTab('liturgies')}
          className={`py-1.5 sm:py-1 px-2 rounded font-sans text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'liturgies'
              ? 'bg-[#00c3ff]/20 border border-[#00c3ff]/60 text-[#00ffff] shadow-[0_0_10px_rgba(0,195,255,0.3)]'
              : 'text-[#839493] hover:text-[#dfe3e3]'
          }`}
        >
          <Zap className="w-3 h-3 text-[#00c3ff]" />
          <span>
            {countReady ? `LITURGIES (${liturgyCountText})` : 'LITURGIES'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('transmissions')}
          className={`py-1.5 sm:py-1 px-2 rounded font-sans text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 relative ${
            activeTab === 'transmissions'
              ? 'bg-[#00c3ff]/20 border border-[#00c3ff]/60 text-[#00ffff] shadow-[0_0_10px_rgba(0,195,255,0.3)]'
              : 'text-[#839493] hover:text-[#dfe3e3]'
          }`}
        >
          <Radio className="w-3 h-3 text-[#ff5540]" />
          <span>ALERTS ({alertsBadgeCount})</span>
          {(toastsList.length > 0 || notificationUnread > 0) && (
            <span className="w-2 h-2 rounded-full bg-[#ff5540] animate-pulse" />
          )}
        </button>
      </div>

      {/* ── TAB 1: LITURGIES & UPCOMING SCHEDULE ── */}
      {activeTab === 'liturgies' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Spotlight "Next Up" Live Activity Card */}
          {nextTask && !allTasksCompleted ? (
            <div className="p-3 bg-gradient-to-r from-[#00c3ff]/15 via-[#006f85]/10 to-[#02080a] border border-[#00c3ff]/60 rounded-xl shadow-[0_0_15px_rgba(0,195,255,0.15)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-[#00ffff] tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#ff5540] animate-pulse" />
                  NEXT IMPENDING LITURGY
                </span>
                <span className="text-[9px] font-bold text-[#00ffff] bg-[#00ffff]/10 border border-[#00c3ff]/40 px-1.5 py-0.2 rounded font-sans">
                  {nextTask.time}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-sans font-bold text-[#ff5540] mr-1.5">
                    [{nextTask.time}]
                  </span>
                  <span className="text-xs font-bold text-[#dfe3e3] truncate">
                    {nextTask.title}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleTask(nextTask.id)
                  }}
                  className="shrink-0 px-2.5 py-1.5 sm:py-1 bg-gradient-to-r from-[#0099cc] to-[#00c3ff] hover:from-[#00c3ff] hover:to-[#00ffff] text-[#02080a] font-bold text-[10px] uppercase rounded-md shadow-[0_0_10px_rgba(0,195,255,0.4)] transition-transform active:scale-95 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>COMPLETE</span>
                </button>
              </div>
            </div>
          ) : allTasksCompleted ? (
            <div className="p-3 bg-[#00ff88]/10 border border-[#00ff88]/40 rounded-xl flex items-center gap-2 text-xs font-bold text-[#00ff88]">
              <CheckCircle2 className="w-4 h-4 text-[#00ff88] shrink-0" />
              <span>ALL DAILY LITURGIES VERIFIED FOR TODAY</span>
            </div>
          ) : null}

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-[#839493]">
              {countReady ? (
                <>
                  <span>PROGRESS: {liturgyCountText} COMPLETED</span>
                  <span className="text-[#00ffff] font-bold">
                    {Math.round((completedCount / Math.max(localTasks.length, 1)) * 100)}%
                  </span>
                </>
              ) : (
                <span
                  className="inline-block h-2 w-28 rounded-full bg-[#00c3ff]/25 animate-pulse"
                  aria-hidden
                />
              )}
            </div>
            <div className="w-full h-1.5 bg-[#020608] rounded-full overflow-hidden border border-[#00c3ff]/30">
              <div
                className={`h-full bg-gradient-to-r from-[#0099cc] via-[#00c3ff] to-[#00ff88] ${
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
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                    isNext
                      ? 'bg-[#00c3ff]/10 border-[#00c3ff]/70 shadow-[0_0_10px_rgba(0,195,255,0.2)]'
                      : t.completed
                      ? 'bg-[#020608]/80 border-[#3a4a49]/40 opacity-70'
                      : 'bg-[#040a0d] border-[#00c3ff]/20 hover:border-[#00c3ff]/50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleTask(t.id)
                      }}
                      className="text-[#00ffff] hover:scale-110 transition-transform"
                    >
                      {t.completed ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#00ffff]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-[#839493]" />
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-sans font-bold ${isNext ? 'text-[#ff5540]' : 'text-[#839493]'}`}>
                        [{t.time}]
                      </span>
                      {reminderTime && (
                        <span className="text-[8px] text-[#ffb700] bg-[#091214] px-1 rounded border border-[#ffb700]/30 hidden xs:inline-flex items-center gap-0.5">
                          <Bell className="w-2 h-2" /> {reminderTime}
                        </span>
                      )}
                    </div>

                    <span className={`text-[11px] font-sans font-bold truncate ${
                      t.completed ? 'line-through text-[#839493]' : 'text-[#dfe3e3]'
                    }`}>
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-sans text-[#00c3ff] bg-[#070b0b] px-1.5 py-0.2 border border-[#3a4a49] rounded">
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
          <div className="flex items-center justify-between text-[10px] text-[#839493]">
            <span>{ACTIVITY_INBOX_LABEL}</span>
            <div className="flex items-center gap-2">
              {notificationUnread > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    void markAllRead()
                  }}
                  className="text-[#00c3ff] hover:text-[#00ffff] font-bold"
                >
                  MARK ALL READ
                </button>
              )}
              {toastHistoryList.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearToastsFn(); }}
                  className="text-[#ff453a] hover:text-[#ff6b6b] flex items-center gap-1 font-bold"
                >
                  <Trash2 className="w-2.5 h-2.5" /> CLEAR
                </button>
              )}
            </div>
          </div>

          {actionableNotifications.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold tracking-wider text-[#00ffff] uppercase">
                Action Required
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {actionableNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2 rounded-lg bg-[#040a0d] border border-[#00ff9d]/30 space-y-2"
                  >
                    <div className="text-[10px] font-bold text-[#00ffff] font-grotesk tracking-wider">
                      {n.title}
                    </div>
                    <div className="text-[#dfe3e3] text-[11px] leading-tight">{n.detail}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {n.payload.requestId && (
                        <>
                          <button
                            type="button"
                            className="px-2 py-1 text-[9px] font-bold uppercase border border-[#00ff9d]/50 text-[#00ff9d] rounded"
                            onClick={(e) => {
                              e.stopPropagation()
                              void acceptFriendRequest(n.payload.requestId!, n.id)
                            }}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 text-[9px] font-bold uppercase border border-[#3a4a49] text-[#839493] hover:border-[#ff453a] hover:text-[#ff453a] rounded"
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
                          className="px-2 py-1 text-[9px] font-bold uppercase border border-[#00c3ff]/40 text-[#00c3ff] rounded"
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
              <div className="text-[9px] font-bold tracking-wider text-[#839493] uppercase">
                Recent Transmissions
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {recentNotifications.map((n) => {
                  const rowClass = `w-full text-left p-2 rounded-lg bg-[#040a0d] border flex items-start gap-2 text-xs ${
                    n.readAt ? 'border-[#3a4a49]/60 opacity-80' : 'border-[#00c3ff]/30'
                  }`
                  const body = (
                    <>
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          n.readAt ? 'bg-[#3a4a49]' : 'bg-[#00c3ff]'
                        }`}
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="text-[10px] font-bold text-[#00ffff] font-grotesk tracking-wider">
                          {n.title}
                        </div>
                        <div className="text-[#dfe3e3] text-[11px] leading-tight">{n.detail}</div>
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
            <div className="text-[9px] font-bold tracking-wider text-[#839493] uppercase">
              Ephemeral Toasts
            </div>
            {toastHistoryList.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#839493] space-y-1">
                {dbNotifications.length === 0 && (
                  <>
                    <Radio className="w-6 h-6 text-[#3a4a49] mx-auto animate-pulse" />
                    <div>ALL FREQUENCIES QUIET</div>
                    <div className="text-[10px] text-[#839493]/60">
                      No hails, replies, or friend alerts in the log.
                    </div>
                  </>
                )}
                {dbNotifications.length > 0 && (
                  <div className="text-[10px] text-[#839493]/60">No recent toast alerts.</div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {toastHistoryList.map((t) => (
                  <div
                    key={t.id}
                    className="p-2 rounded-lg bg-[#040a0d] border border-[#00c3ff]/20 flex items-start gap-2 text-xs"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00c3ff] mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      {t.title && (
                        <div className="text-[10px] font-bold text-[#00ffff] font-grotesk tracking-wider">
                          {t.title}
                        </div>
                      )}
                      <div className="text-[#dfe3e3] text-[11px] leading-tight">
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
      <div className="pt-2 border-t border-[#00c3ff]/20 flex items-center justify-between text-[10px]">
        <button
          onClick={toggleReminders}
          className="flex items-center gap-1 px-2 py-0.5 border border-[#3a4a49] hover:border-[#00c3ff] bg-[#030606] text-[#00c3ff] transition-colors rounded text-[9px] font-bold"
          title="Toggle automated 10-minute prior toast reminders"
        >
          {remindersEnabled ? <Bell className="w-2.5 h-2.5 text-[#00c3ff]" /> : <BellOff className="w-2.5 h-2.5 text-[#ff453a]" />}
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
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-full bg-[#03090b]/90 hover:bg-[#061417] border border-[#00c3ff]/40 hover:border-[#00c3ff] text-[#dfe3e3] shadow-[0_0_12px_rgba(0,195,255,0.2)] transition-all select-none group"
          title="Open Activity Center & Liturgy Schedule"
          aria-label="Daily alignment tasks schedule"
          aria-expanded={isScheduleOpen}
          aria-busy={!countReady}
        >
          {/* Alignment status: next liturgy, or complete once 8/8 is sealed */}
          <span className="text-[10px] text-[#839493] hidden md:inline truncate max-w-[130px] font-sans">
            {countReady ? (
              allTasksCompleted ? (
                <span className="text-[#00ff88] font-semibold">COMPLETE</span>
              ) : (
                <>
                  NEXT: <span className="text-[#dfe3e3] font-semibold">{nextTask?.title || 'None'}</span>
                </>
              )
            ) : (
              <span
                className="inline-block h-2 w-20 rounded-full bg-[#839493]/30 animate-pulse align-middle"
                aria-hidden
              />
            )}
          </span>

          {/* Liturgy Count Badge */}
          {renderLiturgyCount(
            'text-[9px] font-sans font-bold px-1.5 py-0.2 rounded-full bg-[#00c3ff]/15 text-[#00ffff] border border-[#00c3ff]/30',
          )}

          {notificationUnread > 0 && (
            <span className="text-[9px] font-sans font-bold px-1.5 py-0.2 rounded-full bg-[#ff5540]/20 text-[#ff5540] border border-[#ff5540]/40 animate-pulse">
              {notificationUnread}
            </span>
          )}

          {/* Chevron Indicator */}
          {isScheduleOpen ? (
            <ChevronUp className="w-3 h-3 text-[#00c3ff]" />
          ) : (
            <ChevronDown className="w-3 h-3 text-[#839493] group-hover:text-[#00c3ff]" />
          )}
        </button>

        {/* ═══ DESKTOP FLOATING FLYOUT DROPDOWN (>= 640px) ═══ */}
        {isScheduleOpen && !isMobileScreen && (
          <div
            ref={dropdownRef}
            className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-[#03090b] border border-[#00c3ff]/50 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_20px_rgba(0,195,255,0.25)] p-3.5 z-50 font-sans space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
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
      className={`p-4 sm:p-5 relative font-sans shadow-2xl border-[#00c3ff]/50 ${className}`}
    >
      {/* ── TOP BAR: Mode Selector & Resync ── */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#00c3ff]/30 pb-3 gap-2">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#00ffff] animate-pulse" />
          <span className="font-grotesk text-xs sm:text-sm font-bold tracking-widest text-[#dfe3e3] uppercase">
            BENTHIC CHRONOMETER
          </span>
          <span className="text-[10px] text-[#839493] hidden xs:inline">• {label}</span>
        </div>

        {/* Timezone Switcher Tabs & Resync */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 text-[10px]">
          {(['LOCAL', 'UTC', 'BENTHIC', 'STARDATE'] as TimezoneMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-0.5 rounded font-sans font-semibold transition-all ${
                mode === m
                  ? 'bg-[#00c3ff] text-[#02080a] font-bold shadow-[0_0_8px_rgba(0,195,255,0.6)]'
                  : 'bg-[#03090b] text-[#839493] hover:text-[#dfe3e3] border border-[#3a4a49]'
              }`}
            >
              {m}
            </button>
          ))}

          {/* 12H / 24H Toggle */}
          <button
            onClick={() => setIs24Hour(!is24Hour)}
            className="px-1.5 py-0.5 rounded bg-[#03090b] text-[#839493] hover:text-[#00ffff] border border-[#3a4a49] font-sans font-semibold text-[9px] transition-colors"
            title="Toggle 12h/24h format"
          >
            {is24Hour ? '24H' : '12H'}
          </button>

          {/* Resync Button */}
          <button
            onClick={handleResync}
            className="p-1 rounded bg-[#03090b] text-[#839493] hover:text-[#00ffff] border border-[#3a4a49] transition-colors"
            title="Resync internal clock cycle"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#00ffff]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── CENTER: Hero Digits & Calendar Date ── */}
      <div className="py-4 flex flex-col items-center justify-center space-y-1">
        {/* Large Neon Seven-Segment Digits */}
        <div className="flex items-baseline space-x-1 sm:space-x-2 select-none">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#00ffff] drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">
              {hours}
            </span>
            <span className="text-[9px] text-[#839493] font-sans">HOURS</span>
          </div>

          {/* Colon Separator (Blinking) */}
          <span className="font-mono text-3xl sm:text-5xl md:text-6xl text-[#00c3ff] animate-pulse">
            :
          </span>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#00ffff] drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]">
              {minutes}
            </span>
            <span className="text-[9px] text-[#839493] font-sans">MINUTES</span>
          </div>

          {/* Colon Separator */}
          <span className="font-mono text-3xl sm:text-5xl md:text-6xl text-[#00c3ff]/60">
            :
          </span>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#00c3ff]">
              {seconds}
            </span>
            <span className="text-[9px] text-[#839493] font-sans">SECONDS</span>
          </div>

          {/* Milliseconds (Tactical Hud Accent) */}
          <div className="flex flex-col items-center hidden sm:flex">
            <span className="font-mono text-lg sm:text-2xl font-bold text-[#ff5540]">
              .{millis}
            </span>
            <span className="text-[8px] text-[#839493] font-sans">MS</span>
          </div>

          {/* AM/PM or Mode Badge */}
          {ampm && (
            <div className="self-start ml-1 mt-1">
              <span className="font-mono text-xs sm:text-sm font-bold text-[#ffb076] bg-[#ffb076]/10 border border-[#ffb076]/40 px-1.5 py-0.5 rounded">
                {ampm}
              </span>
            </div>
          )}
        </div>

        {/* Date & Global Sync Telemetry */}
        <div className="flex items-center space-x-3 text-xs text-[#839493] pt-1">
          <div className="flex items-center space-x-1 font-mono">
            <Calendar className="w-3.5 h-3.5 text-[#00ffff]" />
            <span>{formatDateString()}</span>
          </div>
          <span>•</span>
          <span className="font-mono text-[#00c3ff]">SYNC: OPTIMAL (±0.02ms)</span>
        </div>
      </div>

      {/* ── BOTTOM: Alignment Liturgies Hub & Next Task ── */}
      <div className="border-t border-[#00c3ff]/30 pt-3 space-y-3">
        {/* Next Task Banner */}
        <div className="bg-[#03090b]/80 border border-[#00c3ff]/40 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div
            onClick={() => setIsScheduleOpen(!isScheduleOpen)}
            className="cursor-pointer group flex-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#839493]">
                <Sparkles className="w-3.5 h-3.5 text-[#ff5540] animate-pulse" />
                <span className="font-bold text-[#00ffff] uppercase tracking-wider">
                  NEXT UPCOMING ALIGNMENT TASK
                </span>
              </div>
              <div className="text-[#00c3ff] group-hover:text-[#00ffff] transition-colors">
                {isScheduleOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </div>

            {allTasksCompleted ? (
              <div className="text-xs sm:text-sm font-bold text-[#00ffff] flex items-center gap-2 pt-1">
                <CheckCircle2 className="w-4 h-4 text-[#00ffff]" />
                <span>ALL DAILY ALIGNMENT LITURGIES VERIFIED FOR TODAY!</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
                <span className="text-xs sm:text-sm font-bold text-[#ff5540] font-sans">
                  [{nextTask.time}]
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#dfe3e3] group-hover:text-[#00ffff] transition-colors truncate">
                  {nextTask.title}
                </span>
                <span className="text-[10px] text-[#839493] underline decoration-dotted">
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
              className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0099cc] to-[#00c3ff] hover:from-[#00c3ff] hover:to-[#00ffff] text-[#02080a] font-bold text-xs uppercase tracking-wider rounded shadow-[0_0_15px_rgba(0,195,255,0.4)] transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>COMPLETE ALIGNMENT</span>
            </button>
          )}
        </div>

        {/* ═══ EXPANDABLE FULL DAY SCHEDULE DROPDOWN ═══ */}
        {isScheduleOpen && (
          <div className="mt-4 pt-3 border-t border-[#00c3ff]/20 space-y-3 animate-in fade-in duration-200">
            {/* Dropdown Summary Bar */}
            <div className="flex items-center justify-between text-xs text-[#839493] font-sans px-1">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#00ffff]" />
                <span className="font-bold text-[#dfe3e3] uppercase">FULL DAY LITURGY SCHEDULE</span>
              </div>
              <div className="text-[11px] text-[#00ffff] font-sans">
                {countReady ? (
                  `${completedCount} of ${localTasks.length} COMPLETED`
                ) : (
                  <span
                    className="inline-block h-2 w-24 rounded-full bg-[#00c3ff]/40 animate-pulse"
                    aria-hidden
                  />
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-[#03090b] rounded-full overflow-hidden border border-[#00c3ff]/30">
              <div
                className="h-full bg-gradient-to-r from-[#0099cc] via-[#00c3ff] to-[#00ff88] transition-all duration-300"
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
                    className={`flex items-center justify-between p-2.5 rounded border transition-all cursor-pointer ${
                      isNext
                        ? 'bg-[#00c3ff]/15 border-[#00c3ff] shadow-[0_0_12px_rgba(0,195,255,0.25)] ring-1 ring-[#00c3ff]/50'
                        : t.completed
                        ? 'bg-[#03090b]/60 border-[#3a4a49]/60 opacity-75 hover:opacity-100'
                        : 'bg-[#071417] border-[#00c3ff]/20 hover:border-[#00c3ff]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleTask(t.id)
                        }}
                        className="text-[#00ffff] hover:scale-110 transition-transform"
                      >
                        {t.completed ? (
                          <CheckSquare className="w-4 h-4 text-[#00ffff]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#839493]" />
                        )}
                      </button>

                      <span className={`text-xs font-sans font-bold ${isNext ? 'text-[#ff5540]' : 'text-[#839493]'}`}>
                        [{t.time}]
                      </span>

                      <span className={`text-xs font-sans font-bold truncate ${
                        t.completed ? 'line-through text-[#839493]' : 'text-[#dfe3e3]'
                      }`}>
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold text-[#00c3ff] bg-[#00c3ff]/10 border border-[#00c3ff]/30 px-1.5 py-0.5 rounded font-sans">
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
