import React, { useState } from 'react'
import { Calendar, CheckSquare, Square, Flame, TrendingUp, BarChart3, CheckCircle2, Shield, Sparkles, Bell, BellOff, Zap, RefreshCw } from 'lucide-react'
import { HudCard, HudBadge } from '@/components/ui'
import { useAlignmentReminders } from '@/hooks/useAlignmentReminders'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { DailyRoutineGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'
import type { DailyStreakDay } from '@/lib/alignment-tasks'

export interface DailyRoutineWidgetProps {
  isLoading?: boolean
}

export function DailyRoutineWidget({ isLoading = false }: DailyRoutineWidgetProps) {
  const {
    tasks,
    completedCount,
    totalCount,
    streakDays,
    streakHistory,
    isLoading: isAlignmentLoading,
    isSyncing,
    toggleTask,
  } = useDailyAlignment()

  const [hoveredDay, setHoveredDay] = useState<DailyStreakDay | null>(null)

  const { remindersEnabled, toggleReminders, triggerTestReminder, getTaskReminderTime } =
    useAlignmentReminders(tasks)

  const completionPercent = Math.round((completedCount / Math.max(totalCount, 1)) * 100)

  return (
    <HudGhostWidget isLoading={isLoading || isAlignmentLoading} skeleton={<DailyRoutineGhost />}>
      <HudCard id="daily-routine-hub" variant="teal" className="p-4 sm:p-6 relative space-y-5 font-sans shadow-2xl border-[#00c3ff]/40">
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
              {isSyncing && (
                <HudBadge variant="warning" pulse className="text-[9px] flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  SYNCING
                </HudBadge>
              )}
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
            <HudBadge variant={completedCount === totalCount ? 'emerald' : 'cyan'} className="px-3 py-1.5 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
              {completedCount}/{totalCount} COMPLETE
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
                DAILY ALIGNMENT SCHEDULE ({completedCount}/{totalCount})
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

            <div className="space-y-2 font-sans text-xs">
              {tasks.map((task) => {
                const reminderTime = getTaskReminderTime(task.time)
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.key || task.id)}
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
                      <HudBadge variant={task.completed ? 'cyan' : 'neutral'} className="text-[10px]">
                        {task.completed ? 'COMPLETE' : 'PENDING'}
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
                        <span className={`text-[9px] font-sans ${item.isToday ? 'text-[#00c3ff] font-bold' : 'text-[#839493]'}`}>
                          {item.dayName}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Progress Readout */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-[#839493]">
                    <span>TODAY'S ALIGNMENT ({completionPercent}%)</span>
                    <span className="text-[#00c3ff] font-bold">{completedCount} / {totalCount} TASKS</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#030606] border border-[#3a4a49] overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-[#00c3ff] via-emerald-400 to-[#00ff88] transition-all duration-500 relative"
                      style={{ width: `${completionPercent}%` }}
                    >
                      <div className="absolute top-0 right-0 bottom-0 w-1.5 bg-white animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carapace Alignment Status Card */}
            <div className="bg-[#070b0b] border border-[#3a4a49] p-3.5 chamfer-corner space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#3a4a49]/60 pb-2">
                <span className="flex items-center gap-1.5 text-[#00c3ff] font-bold font-grotesk text-xs uppercase">
                  <Shield className="w-4 h-4 text-[#00c3ff]" /> CARAPACE ALIGNMENT STATUS
                </span>
                <span className="text-emerald-400 text-[10px] font-bold">
                  {completedCount === totalCount ? 'OPTIMAL' : 'ACTIVE'}
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between bg-[#0f1414] p-2 border border-[#3a4a49]">
                  <span className="text-[#839493] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00c3ff]" /> DAILY COMPLIANCE
                  </span>
                  <span className="text-[#00c3ff] font-bold">
                    {completedCount === totalCount ? '100% COMPLETE' : `${completedCount}/${totalCount} LOGGED`}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#0f1414] p-2 border border-[#3a4a49]">
                  <span className="text-[#839493] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#ff453a]" /> ACTIVE STREAK
                  </span>
                  <span className="text-[#ffb076] font-bold">{streakDays} DAYS</span>
                </div>

                <div className="flex items-center justify-between bg-[#0f1414] p-2 border border-[#3a4a49]">
                  <span className="text-[#839493] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> LITURGY PROTOCOL
                  </span>
                  <span className="text-yellow-400 font-bold">
                    {completedCount === totalCount ? 'ALL VERIFIED' : 'IN PROGRESS'}
                  </span>
                </div>
              </div>

              {/* Badges Ribbon */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                <span className="text-[#839493]">STATUS MATRIX:</span>
                <div className="flex items-center gap-1">
                  <HudBadge variant="cyan">🛡️ CARAPACE STABLE</HudBadge>
                  <HudBadge variant="sacred">🔥 BENTHIC SYNC</HudBadge>
                  <HudBadge variant="emerald">⚡ DISCIPLINE</HudBadge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </HudCard>
    </HudGhostWidget>
  )
}
