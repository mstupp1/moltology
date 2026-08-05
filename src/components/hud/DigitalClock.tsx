import React, { useState, useEffect } from 'react'
import { Clock, Calendar, RefreshCw, Sparkles, CheckCircle2, ChevronDown, ChevronUp, CheckSquare, Square, Award, Bell, BellOff, Zap } from 'lucide-react'
import { HudCard, HudBadge } from '@/components/ui'
import { useAlignmentReminders } from '@/hooks/useAlignmentReminders'

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
      // Custom Moltology Benthic cycle calculation
      const epochSeconds = Math.floor(time.getTime() / 1000)
      const benthicTide = (epochSeconds % 86400)
      const bHours = pad(Math.floor(benthicTide / 3600))
      const bMins = pad(Math.floor((benthicTide % 3600) / 60))
      const bSecs = pad(benthicTide % 60)
      return { hours: bHours, minutes: bMins, seconds: bSecs, millis: ms, ampm: 'TIDE', label: 'BENTHIC CHRONO' }
    }

    if (mode === 'STARDATE') {
      // Stardate epoch
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

  // Find the next upcoming uncompleted alignment task
  const nextTask = localTasks.find(t => !t.completed) || localTasks[localTasks.length - 1]
  const allTasksCompleted = localTasks.length > 0 && localTasks.every(t => t.completed)

  // ---------------------------------------------------------------------------
  // HEADER / COMPACT VARIANT WITH FLOATING DROPDOWN SCHEDULE
  // ---------------------------------------------------------------------------
  if (variant === 'header' || variant === 'compact') {
    return (
      <div className="relative font-mono text-xs select-none">
        {/* Top Header Pill (Clickable) */}
        <div
          onClick={() => setIsScheduleOpen(!isScheduleOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsScheduleOpen(!isScheduleOpen) }}
          className={`flex items-center gap-2 bg-[#02080a]/90 hover:bg-[#071417] border border-[#00c3ff]/40 px-3 py-1.5 rounded-sm font-mono text-xs shadow-[0_0_12px_rgba(0,195,255,0.15)] cursor-pointer transition-colors group ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-[#00c3ff] animate-pulse shrink-0" />

          {/* Digital Time Readout */}
          <div className="flex items-baseline gap-0.5 tracking-widest font-bold">
            <span className="text-[#00ffff] filter drop-shadow-[0_0_6px_rgba(0,255,255,0.8)]">{hours}</span>
            <span className="text-[#ff5540] animate-pulse">:</span>
            <span className="text-[#00ffff] filter drop-shadow-[0_0_6px_rgba(0,255,255,0.8)]">{minutes}</span>
            <span className="text-[#ff5540] animate-pulse">:</span>
            <span className="text-[#00ffff] filter drop-shadow-[0_0_6px_rgba(0,255,255,0.8)]">{seconds}</span>
            {ampm && <span className="text-[9px] text-[#ff5540] ml-1">{ampm}</span>}
          </div>

          {/* Compact Next Alignment Pill */}
          {nextTask && !allTasksCompleted && (
            <div className="hidden lg:flex items-center gap-1.5 ml-2 border-l border-[#00c3ff]/20 pl-2 text-[10px] text-[#a8b8b8] truncate max-w-[220px] group-hover:text-[#dfe3e3] transition-colors">
              <span className="text-[#ff5540] font-bold shrink-0">NEXT:</span>
              <span className="truncate text-[#dfe3e3]">{nextTask.time} {nextTask.title}</span>
            </div>
          )}

          {/* Chevron dropdown indicator */}
          <div className="text-[#00c3ff] ml-1 shrink-0">
            {isScheduleOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Floating Header Dropdown Panel */}
        {isScheduleOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#030a0d]/95 border-2 border-[#00c3ff]/60 rounded-md p-3 sm:p-4 shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_20px_rgba(0,195,255,0.3)] backdrop-blur-md z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
            {/* Header controls bar */}
            <div className="flex items-center justify-between border-b border-[#00c3ff]/20 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff5540] animate-pulse" />
                <span className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-widest uppercase">
                  DAILY ALIGNMENT SCHEDULE
                </span>
              </div>
              
              {/* Quick 12H/24H, Mode & Reminder buttons */}
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleReminders(); }}
                  className="px-1.5 py-0.5 bg-[#071214] border border-[#00c3ff]/30 text-[#00c3ff] font-bold rounded flex items-center gap-1"
                  title="Toggle automated 10m prior toast reminders"
                >
                  {remindersEnabled ? <Bell className="w-2.5 h-2.5 text-[#00c3ff]" /> : <BellOff className="w-2.5 h-2.5 text-[#ff453a]" />}
                  <span>{remindersEnabled ? '10M' : 'OFF'}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); triggerTestReminder(); }}
                  className="px-1.5 py-0.5 bg-[#071214] border border-yellow-400/40 text-yellow-400 font-bold rounded flex items-center gap-0.5"
                  title="Dispatch instant 10m reminder test toast"
                >
                  <Zap className="w-2.5 h-2.5 text-yellow-400" />
                  <span>TEST</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setIs24Hour(!is24Hour); }}
                  className="px-1.5 py-0.5 bg-[#071214] border border-[#00c3ff]/30 text-[#00c3ff] font-bold rounded"
                >
                  {is24Hour ? '24H' : '12H'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMode(mode === 'LOCAL' ? 'UTC' : mode === 'UTC' ? 'BENTHIC' : 'LOCAL'); }}
                  className="px-1.5 py-0.5 bg-[#071214] border border-[#00c3ff]/30 text-[#00c3ff] font-bold rounded"
                >
                  {mode}
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[#839493]">
                <span>PROGRESS: {localTasks.filter(t => t.completed).length}/{localTasks.length} COMPLETED</span>
                <span className="text-[#00ffff] font-bold">
                  {localTasks.filter(t => t.completed).reduce((a, b) => a + b.xp, 0)} XP GAINED
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#020608] rounded-full overflow-hidden border border-[#00c3ff]/30">
                <div
                  className="h-full bg-gradient-to-r from-[#0099cc] via-[#00c3ff] to-[#ff5540] transition-all duration-300"
                  style={{
                    width: `${Math.round((localTasks.filter(t => t.completed).length / Math.max(localTasks.length, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* List of 8 daily tasks */}
            <div className="grid grid-cols-1 gap-1.5 max-h-72 overflow-y-auto pr-1">
              {localTasks.map((t) => {
                const isNext = t.id === nextTask.id && !allTasksCompleted
                const reminderTime = getTaskReminderTime(t.time)
                return (
                  <div
                    key={t.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleTask(t.id)
                    }}
                    className={`flex items-center justify-between p-2 rounded border transition-all cursor-pointer ${
                      isNext
                        ? 'bg-[#00c3ff]/15 border-[#00c3ff] shadow-[0_0_10px_rgba(0,195,255,0.2)] ring-1 ring-[#00c3ff]/50'
                        : t.completed
                        ? 'bg-[#020608]/70 border-[#3a4a49]/40 opacity-75 hover:opacity-100'
                        : 'bg-[#051114] border-[#00c3ff]/20 hover:border-[#00c3ff]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
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

                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-[11px] font-mono font-bold ${isNext ? 'text-[#ff5540]' : 'text-[#839493]'}`}>
                          [{t.time}]
                        </span>
                        {reminderTime && (
                          <span className="text-[9px] text-[#ffb700] bg-[#091214] px-1 rounded border border-[#ffb700]/30 hidden sm:inline-flex items-center gap-0.5">
                            <Bell className="w-2 h-2" /> {reminderTime}
                          </span>
                        )}
                      </div>

                      <span className={`text-[11px] font-mono font-bold truncate ${
                        t.completed ? 'line-through text-[#839493]' : 'text-[#dfe3e3]'
                      }`}>
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-bold text-[#00ffff] bg-[#00ffff]/10 border border-[#00c3ff]/30 px-1 py-0.5 rounded">
                        +{t.xp} XP
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer close trigger */}
            <div className="pt-2 border-t border-[#00c3ff]/20 flex justify-between items-center text-[10px] text-[#839493]">
              <span>MOLTOLOGY LITURGY ENGINE</span>
              <button
                onClick={(e) => { e.stopPropagation(); setIsScheduleOpen(false); }}
                className="text-[#00c3ff] hover:text-[#00ffff] font-bold uppercase"
              >
                CLOSE SCHEDULE ✕
              </button>
            </div>
          </div>
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
      className={`p-4 sm:p-6 relative font-mono overflow-hidden shadow-2xl border-[#00c3ff]/40 bg-[#03090b]/95 backdrop-blur-md ${className}`}
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
          <div className="w-full flex items-center justify-between text-[10px] sm:text-xs text-[#839493] mb-2 font-mono tracking-widest">
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
              className="absolute inset-0 flex items-center justify-center select-none opacity-10 pointer-events-none text-4xl sm:text-6xl md:text-7xl font-mono tracking-widest text-[#00c3ff]"
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
              <span className="text-lg sm:text-2xl md:text-3xl font-bold text-[#ff5540] ml-1 sm:ml-2 font-mono">
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
                <div className="flex items-center gap-1 text-[10px] text-[#00c3ff] bg-[#00c3ff]/10 border border-[#00c3ff]/30 px-2 py-0.5 rounded font-mono ml-auto sm:ml-2">
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
                  <span className="text-xs sm:text-sm font-bold text-[#ff5540] font-mono">
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
              <div className="flex items-center justify-between text-xs text-[#839493] font-mono px-1">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#00ffff]" />
                  <span className="font-bold text-[#dfe3e3] uppercase">FULL DAY LITURGY SCHEDULE</span>
                </div>
                <div className="text-[11px] text-[#00ffff] font-mono">
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

                        <span className={`text-xs font-mono font-bold ${isNext ? 'text-[#ff5540]' : 'text-[#839493]'}`}>
                          [{t.time}]
                        </span>

                        <span className={`text-xs font-mono font-bold truncate ${
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
