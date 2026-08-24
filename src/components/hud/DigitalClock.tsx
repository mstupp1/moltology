import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Clock, Calendar, RefreshCw, Sparkles, CheckCircle2, ChevronDown, ChevronUp, CheckSquare, Square, Award, Bell, BellOff, Zap, Radio, X, Trash2, ListTodo } from 'lucide-react'
import { HudCard, HudBadge, HudBottomSheet } from '@/components/ui'
import { useAlignmentReminders } from '@/hooks/useAlignmentReminders'
import { useToast } from '@/components/ui/ToastProvider'

export interface AlignmentTask {
  id: string
  time: string
  title: string
  xp: number
  completed: boolean
}

const DEFAULT_ALIGNMENT_TASKS: AlignmentTask[] = [
  { id: '1', time: '05:30', title: 'Silent Synchronization', xp: 50, completed: true },
  { id: '2', time: '06:00', title: 'Prompt Construction', xp: 75, completed: true },
  { id: '3', time: '09:00', title: 'Skill Development', xp: 90, completed: true },
  { id: '4', time: '12:00', title: 'Nutritional Efficiency Break', xp: 60, completed: false },
  { id: '5', time: '13:00', title: 'Iterative Refinement', xp: 120, completed: false },
  { id: '6', time: '18:00', title: 'Community Outreach', xp: 70, completed: false },
  { id: '7', time: '20:00', title: 'Reflection Log', xp: 80, completed: false },
  { id: '8', time: '21:00', title: 'Alignment Review', xp: 100, completed: false },
]

export type TimezoneMode = 'LOCAL' | 'UTC' | 'BENTHIC' | 'STARDATE'

export interface DigitalClockProps {
  variant?: 'hero' | 'header' | 'compact'
  tasks?: AlignmentTask[]
  onCompleteTask?: (taskId: string) => void
  className?: string
}

export const DigitalClock: React.FC<DigitalClockProps> = ({
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => setIsMobileScreen(window.innerWidth < 640)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Safe access to ToastProvider context for notification telemetry
  let toastsList: any[] = []
  let toastHistoryList: any[] = []
  let clearToastsFn = () => {}
  try {
    const toastCtx = useToast()
    toastsList = toastCtx.toasts || []
    toastHistoryList = toastCtx.toastHistory || toastCtx.toasts || []
    clearToastsFn = toastCtx.clearToasts
  } catch {
    // Render safely without ToastContext
  }

  // Local state for tasks if not passed via props
  const [localTasks, setLocalTasks] = useState<AlignmentTask[]>(propTasks || DEFAULT_ALIGNMENT_TASKS)

  const { remindersEnabled, toggleReminders, triggerTestReminder, getTaskReminderTime } =
    useAlignmentReminders(localTasks)

  // Sync prop tasks if updated
  useEffect(() => {
    if (propTasks) {
      setLocalTasks(propTasks)
    }
  }, [propTasks])

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    } else {
      setLocalTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t))
      )
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
    if (!mounted) return 'AUG 04, 2026'
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
  const totalXpGained = localTasks.filter(t => t.completed).reduce((a, b) => a + b.xp, 0)
  const maxXp = localTasks.reduce((a, b) => a + b.xp, 0)

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
          <span>LITURGIES ({completedCount}/{localTasks.length})</span>
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
          <span>ALERTS ({toastHistoryList.length})</span>
          {toastsList.length > 0 && (
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
                <span className="text-[9px] font-bold text-[#00ffff] bg-[#00ffff]/10 border border-[#00c3ff]/40 px-1.5 py-0.2 rounded">
                  +{nextTask.xp} XP
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
              <span>ALL DAILY LITURGIES VERIFIED FOR TODAY (+{maxXp} XP)</span>
            </div>
          ) : null}

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-[#839493]">
              <span>PROGRESS: {completedCount}/{localTasks.length} COMPLETED</span>
              <span className="text-[#00ffff] font-bold">{totalXpGained} XP GAINED</span>
            </div>
            <div className="w-full h-1.5 bg-[#020608] rounded-full overflow-hidden border border-[#00c3ff]/30">
              <div
                className="h-full bg-gradient-to-r from-[#0099cc] via-[#00c3ff] to-[#ff5540] transition-all duration-300"
                style={{
                  width: `${Math.round((completedCount / Math.max(localTasks.length, 1)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Task List */}
          <div className="grid grid-cols-1 gap-1.5 max-h-60 sm:max-h-56 overflow-y-auto pr-1">
            {localTasks.map((t) => {
              const isNext = t.id === nextTask?.id && !allTasksCompleted
              const reminderTime = getTaskReminderTime(t.time)

              return (
                <div
                  key={t.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleTask(t.id)
                  }}
                  className={`flex items-center justify-between p-2.5 sm:p-2 rounded-lg border transition-all cursor-pointer ${
                    isNext
                      ? 'bg-[#00c3ff]/15 border-[#00c3ff] shadow-[0_0_10px_rgba(0,195,255,0.2)] ring-1 ring-[#00c3ff]/40'
                      : t.completed
                      ? 'bg-[#020608]/70 border-[#3a4a49]/40 opacity-75 hover:opacity-100'
                      : 'bg-[#051114] border-[#00c3ff]/20 hover:border-[#00c3ff]/50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleTask(t.id)
                      }}
                      className="text-[#00ffff] hover:scale-110 transition-transform shrink-0"
                    >
                      {t.completed ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#00ffff]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-[#839493]" />
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 min-w-0">
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
                    <span className="text-[9px] font-bold text-[#00ffff] bg-[#00ffff]/10 border border-[#00c3ff]/30 px-1.5 py-0.2 rounded">
                      +{t.xp} XP
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
            <span>RECENT NEURAL DISPATCHES</span>
            {toastHistoryList.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); clearToastsFn(); }}
                className="text-[#ff453a] hover:text-[#ff6b6b] flex items-center gap-1 font-bold"
              >
                <Trash2 className="w-2.5 h-2.5" /> CLEAR
              </button>
            )}
          </div>

          {toastHistoryList.length === 0 ? (
            <div className="p-4 bg-[#020608]/80 border border-[#00c3ff]/20 rounded-xl text-center space-y-1">
              <Radio className="w-5 h-5 text-[#00c3ff]/40 mx-auto" />
              <p className="text-xs text-[#839493]">No active transmissions.</p>
              <p className="text-[10px] text-[#506060]">Neural broadcast telemetry nominal.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 max-h-60 sm:max-h-56 overflow-y-auto pr-1">
              {toastHistoryList.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 bg-[#040e12] border border-[#00c3ff]/25 rounded-lg space-y-1 text-left"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-sans font-bold text-[#00ffff] uppercase">
                      {t.type} ALERT
                    </span>
                    <span className="text-[8px] text-[#839493] font-sans">
                      {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {t.title && (
                    <div className="text-[11px] font-bold text-[#dfe3e3] truncate">
                      {t.title}
                    </div>
                  )}
                  <div className="text-[10px] text-[#a8b8b8] font-sans leading-tight break-words">
                    {t.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )

  // ---------------------------------------------------------------------------
  // HEADER / COMPACT VARIANT WITH MOBILE BOTTOM SHEET & DESKTOP FLOATING MODAL
  // ---------------------------------------------------------------------------
  if (variant === 'header' || variant === 'compact') {
    return (
      <div ref={dropdownRef} className="relative font-sans text-xs select-none">
        {/* Dynamic Activity Capsule Pill */}
        <div
          onClick={() => setIsScheduleOpen(!isScheduleOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsScheduleOpen(!isScheduleOpen) }}
          aria-expanded={isScheduleOpen}
          aria-haspopup="dialog"
          aria-label="Daily alignment tasks schedule"
          className={`flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 bg-[#02080a]/90 hover:bg-[#061418] border border-[#00c3ff]/40 hover:border-[#00c3ff]/70 rounded-md font-sans text-xs shadow-[0_0_12px_rgba(0,195,255,0.15)] cursor-pointer transition-all duration-200 group active:scale-95 ${className}`}
        >
          {/* Mobile: Task List Icon */}
          <div className="flex sm:hidden items-center justify-center relative">
            <ListTodo className="w-4 h-4 text-[#00c3ff] group-hover:text-[#00ffff] transition-colors" />
            {toastsList.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#ff5540] animate-ping" />
            )}
          </div>

          {/* Desktop (sm and up): Next Task Indicator & Chevron */}
          <div className="hidden sm:flex items-center gap-1.5">
            {nextTask && !allTasksCompleted ? (
              <div className="flex items-center gap-1.5 text-xs text-[#dfe3e3] truncate max-w-[260px] group-hover:text-[#00ffff] transition-colors">
                <span className="text-[#ff5540] font-bold shrink-0">NEXT:</span>
                <span className="truncate">{nextTask.title}</span>
              </div>
            ) : (
              <span className="text-xs font-bold text-[#00ffff] tracking-wide">
                TASKS COMPLETE
              </span>
            )}

            {toastsList.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#ff5540] animate-ping ml-0.5" />
            )}

            <ChevronDown
              className={`w-3.5 h-3.5 text-[#00c3ff] shrink-0 transition-transform duration-200 ${
                isScheduleOpen ? 'rotate-180 text-[#00ffff]' : 'group-hover:text-[#00ffff]'
              }`}
            />
          </div>
        </div>

        {/* ═══ DESKTOP FLOATING DROPDOWN MODAL (sm and up) ═══ */}
        {isScheduleOpen && !isMobileScreen && (
          <div
            role="dialog"
            aria-label="Activity Center"
            className="hidden sm:block absolute right-0 top-full mt-2 w-[26rem] bg-[#03090cf8] border border-[#142630] border-t-2 border-t-[#00c3ff]/70 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(0,195,255,0.2)] backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 space-y-3"
          >
            {renderActivityContent()}
          </div>
        )}

        {/* ═══ MOBILE FULL-WIDTH BOTTOM ANCHORED MODAL SHEET (< sm) ═══ */}
        {isMobileScreen && (
          <HudBottomSheet
            isOpen={isScheduleOpen}
            onClose={() => setIsScheduleOpen(false)}
            ariaLabel="Activity Center"
          >
            {renderActivityContent()}
          </HudBottomSheet>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // HERO VARIANT (Big Cool Digital Clock)
  // ---------------------------------------------------------------------------
  return (
    <HudCard
      id="benthic-digital-clock-hero"
      variant="cyan"
      className={`p-4 sm:p-6 relative font-sans overflow-hidden shadow-2xl border-[#00c3ff]/40 bg-[#03090b]/95 backdrop-blur-md ${className}`}
    >
      {/* HUD Background Grid & Glow FX */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(0, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 255, 0.2) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="absolute top-0 right-0 w-72 h-72 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.15)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[radial-gradient(circle_at_center,rgba(255,85,64,0.12)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 space-y-5">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3a4a49]/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#00ffff] animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-[#00ffff]/20 blur-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-grotesk text-sm sm:text-base font-bold tracking-widest text-[#dfe3e3] uppercase">
                  BENTHIC CHRONOMETER
                </span>
                <HudBadge variant="cyan" className="text-[9px] uppercase tracking-wider">
                  {label}
                </HudBadge>
              </div>
              <p className="text-[10px] text-[#839493]">
                TEMPORAL SYNCHRONIZATION MATRIX & ALIGNMENT TRACKER
              </p>
            </div>
          </div>

          {/* Interactive Clock Mode Controls */}
          <div className="flex items-center gap-1.5 text-xs">
            {/* Mode Switcher */}
            <div className="flex items-center bg-[#071214] border border-[#00c3ff]/30 rounded p-0.5">
              {(['LOCAL', 'UTC', 'BENTHIC', 'STARDATE'] as TimezoneMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                    mode === m
                      ? 'bg-[#00c3ff] text-[#02080a] shadow-[0_0_8px_rgba(0,195,255,0.6)]'
                      : 'text-[#839493] hover:text-[#dfe3e3]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* 12H / 24H Toggle */}
            <button
              onClick={() => setIs24Hour(!is24Hour)}
              className="px-2 py-1 bg-[#071214] hover:bg-[#0e1f23] border border-[#00c3ff]/30 text-[#00c3ff] font-bold text-[10px] rounded transition-colors"
              title="Toggle 12/24 hour format"
            >
              {is24Hour ? '24H' : '12H'}
            </button>

            {/* Resync Button */}
            <button
              onClick={handleResync}
              disabled={isSyncing}
              className={`p-1.5 bg-[#071214] hover:bg-[#0e1f23] border border-[#00c3ff]/30 text-[#00c3ff] rounded transition-transform active:scale-95 ${
                isSyncing ? 'animate-spin text-[#ff5540]' : ''
              }`}
              title="Resync temporal node"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ═══ THE BIG COOL DIGITAL DISPLAY ═══ */}
        <div className="relative bg-[#020608] border-2 border-[#00c3ff]/50 rounded-lg p-4 sm:p-6 shadow-[inset_0_0_25px_rgba(0,0,0,0.9),0_0_30px_rgba(0,195,255,0.25)] flex flex-col items-center justify-center overflow-hidden">
          {/* Outer Specular Top Highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00c3ff]/80 to-transparent" />

          {/* Date & Submergence Status Header inside frame */}
          <div className="w-full flex items-center justify-between text-[10px] sm:text-xs text-[#839493] mb-2 font-sans tracking-widest">
            <div className="flex items-center gap-1.5 text-[#00ffff]">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#ff5540] animate-pulse">● DRIFT: 0.02ms</span>
              <span className="hidden sm:inline text-[#3a4a49]">|</span>
              <span className="hidden sm:inline text-[#00c3ff]">STRENGTH: 99.8%</span>
            </div>
          </div>

          {/* MAIN DIGITAL TIME NUMBERS (With 7-Segment Digital Aesthetic & Ghost Backdrop) */}
          <div className="relative my-2 py-2 flex items-center justify-center">
            {/* Ghost 88:88:88 background for authentic 7-segment LED feel */}
            <div
              className="absolute inset-0 flex items-center justify-center select-none opacity-10 pointer-events-none text-4xl sm:text-6xl md:text-7xl font-sans tracking-widest text-[#00c3ff]"
              aria-hidden
            >
              88:88:88<span className="text-xl sm:text-2xl md:text-3xl ml-1">.88</span>
            </div>

            {/* Glowing Active LED Digits */}
            <div className="relative z-10 flex items-baseline tracking-wider font-extrabold text-4xl sm:text-6xl md:text-7xl filter drop-shadow-[0_0_15px_rgba(0,255,255,0.9)]">
              {/* Hours */}
              <span className="text-[#00ffff] bg-gradient-to-b from-[#ffffff] via-[#00ffff] to-[#0099cc] bg-clip-text text-transparent">
                {hours}
              </span>

              {/* Pulsing Colon */}
              <span className="text-[#ff5540] mx-1 sm:mx-2 animate-pulse filter drop-shadow-[0_0_10px_rgba(255,85,64,0.9)]">
                :
              </span>

              {/* Minutes */}
              <span className="text-[#00ffff] bg-gradient-to-b from-[#ffffff] via-[#00ffff] to-[#0099cc] bg-clip-text text-transparent">
                {minutes}
              </span>

              {/* Pulsing Colon */}
              <span className="text-[#ff5540] mx-1 sm:mx-2 animate-pulse filter drop-shadow-[0_0_10px_rgba(255,85,64,0.9)]">
                :
              </span>

              {/* Seconds */}
              <span className="text-[#00ffff] bg-gradient-to-b from-[#ffffff] via-[#00ffff] to-[#0099cc] bg-clip-text text-transparent">
                {seconds}
              </span>

              {/* Milliseconds Ticker */}
              <span className="text-lg sm:text-2xl md:text-3xl font-bold text-[#ff5540] ml-1 sm:ml-2 font-sans">
                .{millis}
              </span>

              {/* AM / PM Badge */}
              {ampm && (
                <span className="text-xs sm:text-base font-bold text-[#00c3ff] ml-2 tracking-normal border border-[#00c3ff]/40 px-1.5 py-0.5 rounded bg-[#00c3ff]/10">
                  {ampm}
                </span>
              )}
            </div>
          </div>

          {/* Sub-Second Oscillating Gauge Bar */}
          <div className="w-full h-1 bg-[#06181c] rounded-full overflow-hidden mt-2 relative">
            <div
              className="h-full bg-gradient-to-r from-[#00c3ff] via-[#ff5540] to-[#00c3ff] transition-all duration-75"
              style={{ width: `${(time.getMilliseconds() / 1000) * 100}%` }}
            />
          </div>
        </div>

        {/* ═══ NEXT UPCOMING DAILY ALIGNMENT TASK MODULE & SCHEDULE DROPDOWN ═══ */}
        <div className="bg-[#051114] border border-[#00c3ff]/30 rounded-lg p-3 sm:p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Clickable Header area to toggle dropdown */}
            <div
              onClick={() => setIsScheduleOpen(!isScheduleOpen)}
              className="space-y-1 min-w-0 cursor-pointer group flex-1"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsScheduleOpen(!isScheduleOpen) }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff5540] animate-pulse shrink-0" />
                <span className="text-[10px] sm:text-xs text-[#00ffff] font-bold tracking-widest uppercase group-hover:text-[#00ffff] transition-colors">
                  NEXT UPCOMING ALIGNMENT TASK
                </span>
                {allTasksCompleted ? (
                  <HudBadge variant="cyan" className="text-[9px]">
                    ALL COMPLETE
                  </HudBadge>
                ) : (
                  <HudBadge variant="warning" pulse className="text-[9px]">
                    PENDING LITURGY
                  </HudBadge>
                )}
                {/* Dropdown Indicator Pill */}
                <div className="flex items-center gap-1 text-[10px] text-[#00c3ff] bg-[#00c3ff]/10 border border-[#00c3ff]/30 px-2 py-0.5 rounded font-sans ml-auto sm:ml-2">
                  <span>FULL SCHEDULE ({localTasks.filter(t => t.completed).length}/{localTasks.length})</span>
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
                  <span className="text-[10px] font-bold text-[#00ffff] bg-[#00ffff]/10 border border-[#00c3ff]/30 px-1.5 py-0.5 rounded">
                    +{nextTask.xp} XP
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
                  {localTasks.filter(t => t.completed).length} of {localTasks.length} COMPLETED ({localTasks.filter(t => t.completed).reduce((a, b) => a + b.xp, 0)} XP)
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-[#03090b] rounded-full overflow-hidden border border-[#00c3ff]/30">
                <div
                  className="h-full bg-gradient-to-r from-[#0099cc] via-[#00c3ff] to-[#ff5540] transition-all duration-300"
                  style={{
                    width: `${Math.round((localTasks.filter(t => t.completed).length / Math.max(localTasks.length, 1)) * 100)}%`,
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
                        <span className="text-[10px] font-bold text-[#00ffff] bg-[#00ffff]/10 border border-[#00c3ff]/30 px-1.5 py-0.5 rounded">
                          +{t.xp} XP
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </HudCard>
  )
}
