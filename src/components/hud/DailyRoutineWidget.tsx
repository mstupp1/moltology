import React, { useState } from 'react'
import { Calendar, CheckSquare, Square, Award, Flame, Trophy, TrendingUp, Zap, BarChart3, CheckCircle2, Shield, Sparkles, Bell, BellOff } from 'lucide-react'
import { HudCard, HudBadge } from '@/components/ui'
import { useAlignmentReminders } from '@/hooks/useAlignmentReminders'
import { DailyRoutineGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'

export interface DailyRoutineWidgetProps {
  isLoading?: boolean
}

interface Task {
  id: string
  time: string
  title: string
  xp: number
  completed: boolean
}

interface DayStreak {
  day: string
  dayName: string
  completed: number
  total: number
  pct: number
  isToday?: boolean
}

export function DailyRoutineWidget({ isLoading = false }: DailyRoutineWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', time: '05:30', title: 'Silent Synchronization', xp: 50, completed: true },
    { id: '2', time: '06:00–08:00', title: 'Prompt Construction', xp: 75, completed: true },
    { id: '3', time: '09:00', title: 'Skill Development', xp: 90, completed: true },
    { id: '4', time: '12:00', title: 'Nutritional Efficiency Break', xp: 60, completed: false },
    { id: '5', time: '13:00–17:00', title: 'Iterative Refinement', xp: 120, completed: false },
    { id: '6', time: '18:00', title: 'Community Outreach', xp: 70, completed: false },
    { id: '7', time: '20:00', title: 'Reflection Log', xp: 80, completed: false },
    { id: '8', time: '21:00', title: 'Alignment Review', xp: 100, completed: false },
  ])

  const [streakDays] = useState(7)
  const [hoveredDay, setHoveredDay] = useState<DayStreak | null>(null)
  const [showXpPop, setShowXpPop] = useState<number | null>(null)

  const { remindersEnabled, toggleReminders, triggerTestReminder, getTaskReminderTime } =
    useAlignmentReminders(tasks)

  const completedTasks = tasks.filter(t => t.completed)
  const completedCount = completedTasks.length
  const totalXp = completedTasks.reduce((acc, t) => acc + t.xp, 0)
  const maxXp = tasks.reduce((acc, t) => acc + t.xp, 0)
  const xpPercent = Math.round((totalXp / maxXp) * 100)

  // 14-day streak history data
  const streakHistory: DayStreak[] = [
    { day: 'JUL 22', dayName: 'MON', completed: 8, total: 8, pct: 100 },
    { day: 'JUL 23', dayName: 'TUE', completed: 8, total: 8, pct: 100 },
    { day: 'JUL 24', dayName: 'WED', completed: 7, total: 8, pct: 88 },
    { day: 'JUL 25', dayName: 'THU', completed: 8, total: 8, pct: 100 },
    { day: 'JUL 26', dayName: 'FRI', completed: 8, total: 8, pct: 100 },
    { day: 'JUL 27', dayName: 'SAT', completed: 8, total: 8, pct: 100 },
    { day: 'JUL 28', dayName: 'SUN', completed: 6, total: 8, pct: 75 },
    { day: 'JUL 29', dayName: 'MON', completed: 8, total: 8, pct: 100 },
    { day: 'JUL 30', dayName: 'TUE', completed: 8, total: 8, pct: 100 },
    { day: 'JUL 31', dayName: 'WED', completed: 8, total: 8, pct: 100 },
    { day: 'AUG 01', dayName: 'THU', completed: 8, total: 8, pct: 100 },
    { day: 'AUG 02', dayName: 'FRI', completed: 8, total: 8, pct: 100 },
    { day: 'AUG 03', dayName: 'SAT', completed: 8, total: 8, pct: 100 },
    { day: 'AUG 04', dayName: 'TODAY', completed: completedCount, total: tasks.length, pct: xpPercent, isToday: true },
  ]

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed
        if (nextCompleted) {
          setShowXpPop(t.xp)
          setTimeout(() => setShowXpPop(null), 1200)
        }
        return { ...t, completed: nextCompleted }
      }
      return t
    }))
  }

  return (
    <HudGhostWidget isLoading={isLoading} skeleton={<DailyRoutineGhost />}>
      <HudCard id="daily-routine-hub" variant="teal" className="p-4 sm:p-6 relative space-y-5 font-mono shadow-2xl border-[#00c3ff]/40">
      {/* XP Pop Notification */}
      {showXpPop && (
        <div className="absolute top-3 right-6 z-20 animate-bounce">
          <HudBadge variant="cyan" pulse className="px-3 py-1.5 text-xs font-bold shadow-[0_0_15px_rgba(0,195,255,0.4)]">
            +{showXpPop} XP GAINED! ⚡
          </HudBadge>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#3a4a49]/80 pb-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#00c3ff] animate-pulse" />
            <h2 className="font-grotesk text-base sm:text-lg font-bold tracking-wider text-[#dfe3e3] uppercase">
              DAILY ALIGNMENT ROUTINE
            </h2>
            <HudBadge variant="cyan" className="text-[10px]">
              MANDATORY LITURGY
            </HudBadge>
          </div>
          <p className="text-xs text-[#839493]">
            Complete your 8 scheduled alignment items daily to maintain carapace density and preserve your active streak.
          </p>
        </div>

        {/* Stats Summary Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
          <HudBadge variant="crimson" dot pulse className="px-3 py-1.5 font-bold">
            <Flame className="w-4 h-4 text-[#ff453a] fill-[#ff453a] inline mr-1.5" />
            {streakDays} DAY STREAK
          </HudBadge>
          <HudBadge variant="cyan" className="px-3 py-1.5 font-bold">
            <Zap className="w-3.5 h-3.5 text-[#00c3ff] inline mr-1" />
            {totalXp}/{maxXp} XP
          </HudBadge>
          <HudBadge variant="emerald" className="px-3 py-1.5 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
            {completedCount}/{tasks.length} COMPLETE
          </HudBadge>
        </div>
      </div>

      {/* 2-Column Layout: Left (Vertical Task List) + Right (Streak Calendar & Alignment Metrics) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Clean Vertical List of 8 Tasks */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between border-b border-[#3a4a49]/60 pb-2 gap-2">
            <span className="font-grotesk text-xs font-bold text-[#dfe3e3] uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00c3ff]" />
              DAILY ALIGNMENT SCHEDULE ({completedCount}/{tasks.length})
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleReminders}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 border border-[#3a4a49] hover:border-[#00c3ff] bg-[#030606] text-[#00c3ff] transition-colors"
                title="Toggle automated 10-minute prior toast reminders"
              >
                {remindersEnabled ? <Bell className="w-3 h-3 text-[#00c3ff]" /> : <BellOff className="w-3 h-3 text-[#ff453a]" />}
                <span>{remindersEnabled ? '10M REMINDERS: ON' : 'REMINDERS: OFF'}</span>
              </button>

              <button
                onClick={() => triggerTestReminder()}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 border border-[#3a4a49] hover:border-yellow-400 bg-[#030606] text-yellow-400 transition-colors"
                title="Dispatch instant 10m reminder toast alert"
              >
                <Zap className="w-3 h-3 text-yellow-400" />
                <span>TEST TOAST</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {tasks.map((task) => {
              const reminderTime = getTaskReminderTime(task.time)
              return (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3 border transition-all cursor-pointer flex items-center justify-between chamfer-corner group ${
                    task.completed
                      ? 'bg-[#0b1010] border-[#00c3ff]/50 text-[#839493]'
                      : 'bg-[#0f1414] border-[#3a4a49] text-[#dfe3e3] hover:border-[#00c3ff] hover:bg-[#121919]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {task.completed ? (
                      <CheckSquare className="w-4.5 h-4.5 text-[#00c3ff] shrink-0" />
                    ) : (
                      <Square className="w-4.5 h-4.5 text-[#839493] shrink-0 group-hover:text-[#00c3ff]" />
                    )}
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-[#00c3ff] bg-[#030606] px-1.5 py-0.2 border border-[#3a4a49]">
                          {task.time}
                        </span>
                        {reminderTime && (
                          <span className="text-[9px] text-[#ffb700] bg-[#091214] px-1.5 py-0.2 border border-[#ffb700]/30 flex items-center gap-1">
                            <Bell className="w-2.5 h-2.5 text-[#ffb700]" />
                            {reminderTime} (10m REMINDER)
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-bold block truncate ${task.completed ? 'line-through opacity-75 text-[#839493]' : 'text-[#dfe3e3]'}`}>
                        {task.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    <HudBadge variant={task.completed ? 'cyan' : 'warning'}>
                      +{task.xp} XP
                    </HudBadge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column (5 cols): Streak Calendar, Heatmap & Alignment Stats */}
        <div className="lg:col-span-5 space-y-4">
          {/* 14-Day Streak Calendar Grid */}
          <div className="bg-[#070b0b] border border-[#3a4a49] p-4 chamfer-corner space-y-3">
            <div className="flex items-center justify-between border-b border-[#3a4a49]/60 pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00c3ff]" />
                <span className="text-xs font-bold font-grotesk text-[#dfe3e3] uppercase tracking-wider">
                  STREAK CALENDAR & MATRIX
                </span>
              </div>
              <span className="text-[10px] text-[#00c3ff] font-bold">14-DAY RECORD</span>
            </div>

            {/* Streak Bar Graph */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-7 gap-1.5 items-end h-24 pt-4 px-1 border-b border-[#3a4a49]/40 pb-2">
                {streakHistory.slice(-7).map((item, idx) => {
                  const heightPct = Math.max(item.pct, 15)
                  const isFull = item.pct === 100

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredDay(item)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer group relative"
                    >
                      {/* Tooltip */}
                      {hoveredDay?.day === item.day && (
                        <div className="absolute -top-9 z-30 bg-[#0b1010] border border-[#00c3ff] px-2 py-0.5 text-[9px] whitespace-nowrap text-[#dfe3e3] shadow-lg chamfer-corner">
                          <span className="text-[#00c3ff] font-bold">{item.day}:</span> {item.completed}/{item.total}
                        </div>
                      )}

                      {/* Bar */}
                      <div className="w-full bg-[#0d1414] border border-[#3a4a49] relative overflow-hidden group-hover:border-[#00c3ff] transition-all rounded-none h-full flex items-end">
                        <div
                          className={`w-full transition-all duration-500 relative ${
                            item.isToday
                              ? 'bg-gradient-to-t from-[#00c3ff] to-emerald-400 animate-pulse'
                              : isFull
                              ? 'bg-[#00c3ff]'
                              : 'bg-emerald-500/80'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>

                      {/* Day Name */}
                      <span className={`text-[9px] font-mono ${item.isToday ? 'text-[#00c3ff] font-bold' : 'text-[#839493]'}`}>
                        {item.dayName}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Progress Readout */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-[#839493]">
                  <span>TODAY'S ALIGNMENT ({xpPercent}%)</span>
                  <span className="text-[#00c3ff] font-bold">{completedCount} / {tasks.length} TASKS</span>
                </div>
                <div className="w-full h-2.5 bg-[#030606] border border-[#3a4a49] overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#00c3ff] via-emerald-400 to-yellow-400 transition-all duration-500 relative"
                    style={{ width: `${xpPercent}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-1.5 bg-white animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Level & Streak Perks Card */}
          <div className="bg-[#070b0b] border border-[#3a4a49] p-3.5 chamfer-corner space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#3a4a49]/60 pb-2">
              <span className="flex items-center gap-1.5 text-yellow-400 font-bold font-grotesk text-xs uppercase">
                <Trophy className="w-4 h-4 text-yellow-400" /> STREAK BONUSES & PERKS
              </span>
              <span className="text-[#00c3ff] text-[10px] font-bold">LEVEL 4 INITIATE</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between bg-[#0f1414] p-2 border border-[#3a4a49]">
                <span className="text-[#839493] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#00c3ff]" /> XP MULTIPLIER
                </span>
                <span className="text-[#00c3ff] font-bold">1.5x ACTIVE</span>
              </div>

              <div className="flex items-center justify-between bg-[#0f1414] p-2 border border-[#3a4a49]">
                <span className="text-[#839493] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> CHITIN HARDNESS
                </span>
                <span className="text-emerald-400 font-bold">+12 BONUS</span>
              </div>

              <div className="flex items-center justify-between bg-[#0f1414] p-2 border border-[#3a4a49]">
                <span className="text-[#839493] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> ABYSSAL SYNC
                </span>
                <span className="text-yellow-400 font-bold">VERIFIED</span>
              </div>
            </div>

            {/* Unlocked Badges Ribbon */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-1 text-[10px]">
              <span className="text-[#839493]">UNLOCKED BADGES:</span>
              <div className="flex items-center gap-1">
                <HudBadge variant="cyan">🛡️ CHITIN PROOF</HudBadge>
                <HudBadge variant="sacred">🔥 ABYSSAL</HudBadge>
                <HudBadge variant="warning">⚡ 7-DAY</HudBadge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HudCard>
    </HudGhostWidget>
  )
}

