import React, { useState } from 'react'
import { Calendar, CheckSquare, Square, Clock, Award } from 'lucide-react'

interface Task {
  id: string
  time: string
  title: string
  completed: boolean
}

export const DailyRoutineWidget: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', time: '05:30', title: 'System Boot & Prompt Construction Warm-up', completed: true },
    { id: '2', time: '08:00', title: 'Sub-dermal Chitin Conditioning & Hydration', completed: true },
    { id: '3', time: '11:30', title: 'Molt-Cycle Lecture Stream #14: The Chitinous Mind', completed: true },
    { id: '4', time: '14:00', title: 'Asset Liquidation Audit & Currency Exchange', completed: false },
    { id: '5', time: '18:00', title: 'Social Detachment Verification & Log Submission', completed: false },
    { id: '6', time: '21:00', title: 'Benthic Core Neural Sync & Sleep Ecdysis Protocol', completed: false },
  ])

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const completedCount = tasks.filter(t => t.completed).length
  const progressPercent = Math.round((completedCount / tasks.length) * 100)

  return (
    <div className="bg-[#171c1c] border border-[#3a4a49] p-4 chamfer-corner shadow-chitin-plate space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#00ffff]" />
          <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
            DAILY ALIGNMENT ROUTINE (05:30 - 21:00)
          </h3>
        </div>
        <span className="text-[10px] text-[#00ffff] bg-[#00ffff]/10 px-2 py-0.5 border border-[#00ffff]/40 font-mono">
          {progressPercent}% COMPLETED
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-[#0a0f0f] border border-[#3a4a49] overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#00ffff] to-[#00dddd] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Task List */}
      <div className="space-y-2 font-mono text-xs max-h-64 overflow-y-auto pr-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`p-2.5 border transition-all cursor-pointer flex items-center justify-between chamfer-corner ${
              task.completed
                ? 'bg-[#0f1414]/90 border-[#00ffff]/50 text-[#839493]'
                : 'bg-[#0f1414] border-[#3a4a49] text-[#dfe3e3] hover:border-[#00ffff]'
            }`}
          >
            <div className="flex items-center gap-3">
              {task.completed ? (
                <CheckSquare className="w-4 h-4 text-[#00ffff] shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-[#3a4a49] shrink-0" />
              )}
              <span className={`text-[11px] ${task.completed ? 'line-through opacity-70' : ''}`}>
                {task.title}
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 bg-[#0a0f0f] border border-[#3a4a49] text-[#00ffff] shrink-0 ml-2">
              {task.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
