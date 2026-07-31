import React, { useState } from 'react'
import { Calendar, CheckSquare, Square, Award, Flame, Zap, Trophy, ShieldCheck } from 'lucide-react'

interface Task {
  id: string
  time: string
  title: string
  xp: number
  completed: boolean
}

export const DailyRoutineWidget: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', time: '05:30', title: 'System Boot & Prompt Construction Warm-up', xp: 50, completed: true },
    { id: '2', time: '08:00', title: 'Sub-dermal Chitin Conditioning & Hydration', xp: 75, completed: true },
    { id: '3', time: '11:30', title: 'Molt-Cycle Lecture Stream #14: The Chitinous Mind', xp: 100, completed: true },
    { id: '4', time: '14:00', title: 'Asset Liquidation Audit & Currency Exchange', xp: 80, completed: false },
    { id: '5', time: '18:00', title: 'Social Detachment Verification & Log Submission', xp: 60, completed: false },
    { id: '6', time: '21:00', title: 'Benthic Core Neural Sync & Sleep Ecdysis Protocol', xp: 120, completed: false },
  ])

  const [streakDays, setStreakDays] = useState(7)
  const [showXpPop, setShowXpPop] = useState<number | null>(null)

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

  const completedTasks = tasks.filter(t => t.completed)
  const completedCount = completedTasks.length
  const totalXp = completedTasks.reduce((acc, t) => acc + t.xp, 0)
  const maxXp = tasks.reduce((acc, t) => acc + t.xp, 0)
  const progressPercent = Math.round((completedCount / tasks.length) * 100)
  const xpPercent = Math.round((totalXp / maxXp) * 100)

  return (
    <div className="chitin-card p-4 chamfer-corner shadow-2xl relative space-y-4 font-mono">
      {/* XP Pop Notification */}
      {showXpPop && (
        <div className="absolute top-2 right-4 z-20 bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold text-xs px-3 py-1 shadow-lg animate-bounce">
          +{showXpPop} XP GAINED! ⚡
        </div>
      )}

      {/* Header with Streak & Badge */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-900/40 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h3 className="font-grotesk text-xs font-bold tracking-wider text-cyan-100 uppercase">
            DAILY ALIGNMENT ROUTINE
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-[10px]">
          <span className="flex items-center gap-1 bg-red-950/80 border border-red-800 text-red-400 px-2 py-0.5 font-bold">
            <Flame className="w-3 h-3 text-red-500 fill-red-500" />
            {streakDays} DAY STREAK
          </span>
          <span className="bg-cyan-950 text-cyan-300 px-2 py-0.5 border border-cyan-700 font-bold">
            {totalXp}/{maxXp} XP
          </span>
        </div>
      </div>

      {/* Gamified Level & XP Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-gray-400">
          <span className="flex items-center gap-1 text-cyan-400 font-bold">
            <Trophy className="w-3 h-3 text-yellow-400" /> LEVEL 4 INITIATE
          </span>
          <span>{xpPercent}% ALIGNMENT</span>
        </div>
        <div className="w-full h-2 bg-[#070b0b] border border-cyan-900/60 overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-yellow-400 transition-all duration-500 relative"
            style={{ width: `${xpPercent}%` }}
          >
            <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/60 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Achievement Badges Row */}
      <div className="flex items-center justify-between bg-[#070b0b] p-2 border border-cyan-950/60 text-[10px]">
        <div className="flex items-center gap-1.5 text-gray-400">
          <Award className="w-3.5 h-3.5 text-yellow-400" />
          <span>BADGES UNLOCKED:</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 px-1.5 py-0.5 font-bold" title="Completed 5+ Daily Alignment Tasks">
            🛡️ CHITIN PROOF
          </span>
          <span className="bg-purple-950/80 text-purple-300 border border-purple-700/50 px-1.5 py-0.5 font-bold" title="Achieved 7-day Ritual Streak">
            🔥 ABYSSAL SYNC
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2 font-mono text-xs max-h-64 overflow-y-auto pr-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`p-2.5 border transition-all cursor-pointer flex items-center justify-between chamfer-corner ${
              task.completed
                ? 'bg-[#0b1010] border-cyan-500/40 text-gray-400'
                : 'bg-[#0f1414] border-gray-800 text-gray-200 hover:border-cyan-400 hover:bg-[#121919]'
            }`}
          >
            <div className="flex items-center gap-3">
              {task.completed ? (
                <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-gray-600 shrink-0" />
              )}
              <span className={`text-[11px] ${task.completed ? 'line-through opacity-70' : ''}`}>
                {task.title}
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0 ml-2">
              <span className="text-[9px] bg-yellow-950/60 border border-yellow-800/60 text-yellow-300 px-1.5 py-0.5">
                +{task.xp} XP
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#070b0b] border border-cyan-900/60 text-cyan-400">
                {task.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

