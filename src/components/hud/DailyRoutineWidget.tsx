import React, { useState } from 'react'
import { Calendar, CheckSquare, Square, Award, Flame, Trophy } from 'lucide-react'
import { HudCard, HudBadge } from '@/components/ui'

interface Task {
  id: string
  time: string
  title: string
  xp: number
  completed: boolean
}

export const DailyRoutineWidget: React.FC = () => {
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
  const xpPercent = Math.round((totalXp / maxXp) * 100)

  return (
    <HudCard variant="teal" className="p-4 relative space-y-4 font-mono">
      {/* XP Pop Notification */}
      {showXpPop && (
        <div className="absolute top-2 right-4 z-20">
          <HudBadge variant="cyan" pulse className="px-3 py-1 text-xs">
            +{showXpPop} XP GAINED! ⚡
          </HudBadge>
        </div>
      )}

      {/* Header with Streak & Badge */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#3a4a49]/60 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#00c3ff]" />
          <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
            DAILY ALIGNMENT ROUTINE
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-[10px]">
          <HudBadge variant="crimson" dot pulse>
            <Flame className="w-3 h-3 text-[#ff453a] fill-[#ff453a] inline mr-1" />
            {streakDays} DAY STREAK
          </HudBadge>
          <HudBadge variant="cyan">
            {totalXp}/{maxXp} XP
          </HudBadge>
        </div>
      </div>

      {/* Gamified Level & XP Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-[#839493]">
          <span className="flex items-center gap-1 text-[#00c3ff] font-bold">
            <Trophy className="w-3 h-3 text-yellow-400" /> LEVEL 4 INITIATE
          </span>
          <span>{xpPercent}% ALIGNMENT</span>
        </div>
        <div className="w-full h-2 bg-[#070b0b] border border-[#3a4a49] overflow-hidden relative rounded-none">
          <div 
            className="h-full bg-gradient-to-r from-[#00c3ff] via-emerald-400 to-yellow-400 transition-all duration-500 relative"
            style={{ width: `${xpPercent}%` }}
          >
            <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/60 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Achievement Badges Row */}
      <div className="flex items-center justify-between bg-[#070b0b] p-2 border border-[#3a4a49]/60 text-[10px]">
        <div className="flex items-center gap-1.5 text-[#839493]">
          <Award className="w-3.5 h-3.5 text-yellow-400" />
          <span>BADGES UNLOCKED:</span>
        </div>
        <div className="flex items-center gap-1">
          <HudBadge variant="cyan">
            🛡️ CHITIN PROOF
          </HudBadge>
          <HudBadge variant="sacred">
            🔥 ABYSSAL SYNC
          </HudBadge>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2 font-mono text-xs max-h-64 overflow-y-auto pr-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`p-2.5 border transition-all cursor-pointer flex items-center justify-between rounded-none ${
              task.completed
                ? 'bg-[#0b1010] border-[#00c3ff]/40 text-[#839493]'
                : 'bg-[#0f1414] border-[#3a4a49] text-[#dfe3e3] hover:border-[#00c3ff] hover:bg-[#121919]'
            }`}
          >
            <div className="flex items-center gap-3">
              {task.completed ? (
                <CheckSquare className="w-4 h-4 text-[#00c3ff] shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-[#839493] shrink-0" />
              )}
              <span className={`text-[11px] ${task.completed ? 'line-through opacity-70' : ''}`}>
                {task.title}
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0 ml-2">
              <HudBadge variant="warning">
                +{task.xp} XP
              </HudBadge>
              <HudBadge variant="cyan">
                {task.time}
              </HudBadge>
            </div>
          </div>
        ))}
      </div>
    </HudCard>
  )
}
