import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Calendar, CheckSquare, Square, Flame, TrendingUp, BarChart3, CheckCircle2, Bell, BellOff } from 'lucide-react'
import { HudCard, HudBadge } from '@/components/ui'
import { useAlignmentReminders } from '@/hooks/useAlignmentReminders'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { DailyRoutineGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'
import { openAlignmentPanel } from '@/lib/alignment-panel'
import { DAILY_ALIGNMENT_HUB_ID, localDateString, parseLocalDate, TOTAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'
import type { DailyStreakDay } from '@/lib/alignment-tasks'

// ---------------------------------------------------------------------------
// ActivityHeatmap — width-aware GitHub-style grid (Sun–Sat rows, weeks as cols)
// ---------------------------------------------------------------------------

export const ALIGNMENT_HEATMAP = {
  maxWeeks: 52,
  minWeeks: 12,
  minCell: 11,
  maxCell: 16,
  gap: 2,
  dowGutter: 16,
} as const

/** SSR / pre-measure fallback — fills a typical phone card without a dead gutter once measured. */
export const ALIGNMENT_HEATMAP_DEFAULT = {
  weeks: 20,
  cell: 11,
  gap: ALIGNMENT_HEATMAP.gap,
  dowGutter: ALIGNMENT_HEATMAP.dowGutter,
} as const

export type HeatmapLayout = {
  weeks: number
  cell: number
  gap: number
  dowGutter: number
  fillsWidth: boolean
  scrolls: boolean
}

/**
 * Pick week count + cell size so the grid fills `containerWidth` when possible.
 * Fits the full 52-week year when the container is wide enough at MIN_CELL;
 * otherwise prefers larger cells (up to MAX_CELL) so phone cards do not leave
 * a dead horizontal gutter.
 */
export function computeHeatmapLayout(containerWidth: number): HeatmapLayout {
  const { maxWeeks, minWeeks, minCell, maxCell, gap, dowGutter } = ALIGNMENT_HEATMAP

  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    return { ...ALIGNMENT_HEATMAP_DEFAULT, fillsWidth: true, scrolls: false }
  }

  const available = Math.max(0, Math.floor(containerWidth) - dowGutter)
  const minStride = minCell + gap
  const maxStride = maxCell + gap

  if (available < minStride) {
    return {
      weeks: minWeeks,
      cell: minCell,
      gap,
      dowGutter,
      fillsWidth: false,
      scrolls: true,
    }
  }

  let weeks: number
  let cell: number
  let scrolls = false

  const yearMinWidth = maxWeeks * minStride
  if (available >= yearMinWidth) {
    // Full year fits — grow cells toward MAX_CELL to absorb leftover width
    weeks = maxWeeks
    cell = Math.min(maxCell, Math.max(minCell, Math.floor(available / weeks) - gap))
  } else {
    // Prefer larger cells so the grid fills the card; keep as many weeks as fit
    weeks = Math.max(1, Math.floor(available / maxStride))
    if (weeks < minWeeks && available >= minWeeks * minStride) {
      weeks = minWeeks
    }
    if (weeks < 1) {
      weeks = maxWeeks
      cell = minCell
      scrolls = true
    } else {
      cell = Math.min(maxCell, Math.max(minCell, Math.floor(available / weeks) - gap))
    }
  }

  const gridWidth = weeks * (cell + gap)
  if (gridWidth > available) {
    scrolls = true
  }

  const remainder = available - gridWidth
  const fillsWidth = !scrolls && remainder < maxStride

  return { weeks, cell, gap, dowGutter, fillsWidth, scrolls }
}

function useHeatmapLayout(containerRef: React.RefObject<HTMLElement | null>): HeatmapLayout {
  const [layout, setLayout] = useState<HeatmapLayout>(() => ({
    ...ALIGNMENT_HEATMAP_DEFAULT,
    fillsWidth: true,
    scrolls: false,
  }))

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const update = () => {
      setLayout(computeHeatmapLayout(el.clientWidth))
    }
    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef])

  return layout
}

interface HeatmapCell {
  date: string
  count: number
  isToday: boolean
  isFuture: boolean
}

function buildHeatmapGrid(
  history: Array<{ date: string; completedCount: number }>,
  todayDate: string,
  totalTasks: number = TOTAL_ALIGNMENT_TASKS,
  weeks: number = ALIGNMENT_HEATMAP.maxWeeks
): { grid: HeatmapCell[][]; monthLabels: Array<{ label: string; colIndex: number }> } {
  const countMap = new Map<string, number>()
  for (const item of history) {
    countMap.set(item.date, item.completedCount)
  }

  // Anchor end of grid to the Saturday of the week containing today
  const todayObj = parseLocalDate(todayDate)
  const todayDow = todayObj.getDay()                    // 0=Sun … 6=Sat
  const daysToSat = (6 - todayDow + 7) % 7
  const gridEnd = new Date(todayObj)
  gridEnd.setDate(todayObj.getDate() + daysToSat)

  // Grid starts `weeks` back (Sun of that week)
  const gridStart = new Date(gridEnd)
  gridStart.setDate(gridEnd.getDate() - weeks * 7 + 1)

  const cols: HeatmapCell[][] = []
  const monthLabels: Array<{ label: string; colIndex: number }> = []
  let lastMonth = -1
  const MIN_MONTH_GAP = 3
  let lastLabelCol = -MIN_MONTH_GAP - 1               // allow first label at col 0

  for (let w = 0; w < weeks; w++) {
    const col: HeatmapCell[] = []
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(gridStart)
      cellDate.setDate(gridStart.getDate() + w * 7 + d)

      const dateStr = localDateString(cellDate)
      const isToday = dateStr === todayDate
      const isFuture = cellDate > todayObj && !isToday

      col.push({ date: dateStr, count: isFuture ? 0 : (countMap.get(dateStr) ?? 0), isToday, isFuture })
    }

    // Month label: emit when month changes AND minimum gap from last label is respected
    const refDate = parseLocalDate(col[0].date)
    const month = refDate.getMonth()
    if (month !== lastMonth && w - lastLabelCol >= MIN_MONTH_GAP) {
      lastMonth = month
      lastLabelCol = w
      monthLabels.push({
        label: refDate.toLocaleDateString('en-US', { month: 'short' }),
        colIndex: w,
      })
    }

    cols.push(col)
  }

  return { grid: cols, monthLabels }
}

function heatmapColor(count: number, isFuture: boolean, isToday: boolean): string {
  if (isFuture) return 'bg-surface-1 border-line-subtle'
  if (count === 0) return 'bg-surface-3 border-line-subtle'
  if (count <= 2) return 'bg-cyan-glow/20 border-cyan-glow/25'
  if (count <= 4) return 'bg-cyan-glow/55 border-cyan-glow/45'
  if (count <= 6) return 'bg-emerald-600/80 border-emerald-500/70'
  // 7–8: full or near-full — bright green at the peak
  return isToday
    ? 'bg-gradient-to-br from-emerald-400 to-emerald-300 border-emerald-200'
    : 'bg-emerald-400 border-emerald-300/80'
}

interface ActivityHeatmapProps {
  history: Array<{ date: string; completedCount: number }>
  currentDate: string
  totalTasks?: number
}

function ActivityHeatmap({ history, currentDate, totalTasks = TOTAL_ALIGNMENT_TASKS }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ cell: HeatmapCell; x: number; y: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const layout = useHeatmapLayout(scrollRef)
  const colW = layout.cell + layout.gap

  const { grid, monthLabels } = useMemo(
    () => buildHeatmapGrid(history, currentDate, totalTasks, layout.weeks),
    [history, currentDate, totalTasks, layout.weeks]
  )

  // Auto-scroll to the rightmost position (most recent week = today) on mount & whenever grid changes
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    // Small rAF delay so the DOM has laid out before we measure scrollWidth
    const id = requestAnimationFrame(() => {
      el.scrollLeft = el.scrollWidth
    })
    return () => cancelAnimationFrame(id)
  }, [grid])

  const showCellTooltip = (cell: HeatmapCell, target: HTMLElement) => {
    const container = scrollRef.current
    if (!container) return
    const rect = target.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const rawX = rect.left - containerRect.left + container.scrollLeft
    const maxX = Math.max(0, container.scrollWidth - 148)
    setTooltip({
      cell,
      x: Math.min(rawX + 12, maxX),
      y: rect.top - containerRect.top,
    })
  }

  // Single-letter DOW labels — compact chrome on every viewport
  const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const VISIBLE_DOW = new Set([0, 2, 4, 6]) // Sun, Tue, Thu, Sat

  return (
    <div className="rounded-card border border-line-subtle bg-abyss/60 p-3 sm:p-4 space-y-3 text-xs min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-line-subtle pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <BarChart3 className="w-4 h-4 text-cyan-glow shrink-0" />
          <span className="text-xs font-bold font-grotesk text-ink uppercase tracking-[0.08em] truncate">
            Activity
          </span>
        </div>
        <span className="text-[11px] text-ink-muted shrink-0" data-testid="alignment-heatmap-weeks">
          {layout.weeks}-wk
        </span>
      </div>

      {/* Scroll container — must have min-w-0 so it doesn't expand the parent */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overscroll-x-contain pb-2 relative min-w-0 max-w-full"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onMouseLeave={() => setTooltip(null)}
        data-testid="alignment-heatmap-scroll"
      >
        {/* Inner content — w-max keeps everything together and lets overflow-x-auto work */}
        <div className="w-max">
          {/* Month labels row */}
          <div className="flex mb-2">
            {/* DOW gutter spacer */}
            <div style={{ width: layout.dowGutter }} className="shrink-0" />
            {/* Relative container sized to exactly the grid width */}
            <div
              className="relative"
              style={{ width: grid.length * colW, height: 16 }}
            >
              {monthLabels.map(({ label, colIndex }) => (
                <span
                  key={`${label}-${colIndex}`}
                  className="absolute text-[11px] text-ink-muted font-sans"
                  style={{ left: colIndex * colW }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Grid: DOW labels + week columns */}
          <div className="flex items-start">
            {/* Day-of-week labels — sized to match cell height + gap */}
            <div
              className="flex flex-col shrink-0 pr-1"
              style={{ width: layout.dowGutter, gap: layout.gap }}
            >
              {DOW_LABELS.map((label, i) => (
                <div key={`${label}-${i}`} style={{ height: layout.cell }} className="flex items-center">
                  <span
                    className={`text-[11px] text-ink-muted leading-none ${VISIBLE_DOW.has(i) ? '' : 'invisible'}`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex items-start" style={{ gap: layout.gap }}>
              {grid.map((col, wIdx) => (
                <div key={wIdx} className="flex flex-col" style={{ gap: layout.gap }}>
                  {col.map((cell, dIdx) => (
                    <button
                      key={dIdx}
                      type="button"
                      aria-label={`${cell.date}: ${
                        cell.isFuture
                          ? 'future'
                          : cell.count === 0
                          ? 'no tasks done'
                          : `${cell.count} of ${totalTasks} tasks done`
                      }`}
                      className={`border rounded-chip cursor-pointer transition-opacity hover:opacity-70 touch-manipulation p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-cyan-glow ${heatmapColor(cell.count, cell.isFuture, cell.isToday)}`}
                      style={{ width: layout.cell, height: layout.cell }}
                      onMouseEnter={(e) => showCellTooltip(cell, e.currentTarget)}
                      onFocus={(e) => showCellTooltip(cell, e.currentTarget)}
                      onClick={(e) => showCellTooltip(cell, e.currentTarget)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Tooltip — positioned inside the scrolling container so it tracks correctly */}
          {tooltip && (
            <div
              className="absolute z-30 pointer-events-none rounded-control bg-surface-2 border border-line px-2 py-1 text-[11px] whitespace-nowrap text-ink shadow-menu"
              style={{
                left: tooltip.x,
                top: Math.max(0, tooltip.y - 36),
              }}
            >
              <span className="text-cyan-glow font-bold">{tooltip.cell.date}</span>
              {' — '}
              {tooltip.cell.isFuture
                ? 'future'
                : tooltip.cell.count === 0
                ? 'no tasks done'
                : `${tooltip.cell.count} / ${totalTasks} tasks done`}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-line-subtle">
        <span className="text-[11px] text-ink-muted">Less</span>
        {[0, 2, 4, 6, 8].map((lvl) => (
          <div
            key={lvl}
            className={`border rounded-chip ${heatmapColor(lvl, false, false)}`}
            style={{ width: layout.cell, height: layout.cell }}
          />
        ))}
        <span className="text-[11px] text-ink-muted">More</span>
      </div>
    </div>
  )
}


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
    history,
    currentDate,
    isLoading: isAlignmentLoading,
    toggleTask,
  } = useDailyAlignment()

  const [hoveredDay, setHoveredDay] = useState<DailyStreakDay | null>(null)

  const { remindersEnabled, toggleReminders } = useAlignmentReminders(tasks)

  const completionPercent = Math.round((completedCount / Math.max(totalCount, 1)) * 100)

  useEffect(() => {
    if (isLoading || isAlignmentLoading) return
    if (typeof window === 'undefined') return
    if (window.location.hash !== `#${DAILY_ALIGNMENT_HUB_ID}`) return
    document.getElementById(DAILY_ALIGNMENT_HUB_ID)?.scrollIntoView({ block: 'start' })
  }, [isLoading, isAlignmentLoading])

  return (
    <HudGhostWidget isLoading={isLoading || isAlignmentLoading} skeleton={<DailyRoutineGhost />}>
      <HudCard
        id={DAILY_ALIGNMENT_HUB_ID}
        variant="teal"
        className="p-3 sm:p-4 md:p-6 relative space-y-4 sm:space-y-5 font-sans min-w-0 overflow-hidden"
      >
        {/* Main Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-line-subtle pb-3 sm:pb-4 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={openAlignmentPanel}
            aria-label="Open daily alignment liturgies"
            data-testid="daily-alignment-card-open"
            className="space-y-1 min-w-0 text-left group cursor-pointer bg-transparent border-0 p-0 touch-manipulation rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-glow shrink-0" />
              <h2 className="font-grotesk text-sm sm:text-base md:text-lg font-bold tracking-wider text-ink group-hover:text-cyan-glow transition-colors uppercase leading-tight">
                DAILY ALIGNMENT ROUTINE
              </h2>
              <HudBadge variant="cyan" className="text-[11px] shrink-0">
                MANDATORY LITURGY
              </HudBadge>
            </div>
            <p className="text-xs text-ink-body leading-relaxed">
              Complete your 8 scheduled alignment items daily to maintain carapace density and preserve your active streak.
            </p>
          </button>

          {/* Stats Summary Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
            <HudBadge variant="crimson" dot pulse className="px-2.5 sm:px-3 py-1.5 font-bold">
              <Flame className="w-4 h-4 text-crimson-text fill-crimson-aggro inline mr-1.5" />
              {streakDays} DAY STREAK
            </HudBadge>
            <HudBadge variant={completedCount === totalCount ? 'emerald' : 'cyan'} className="px-2.5 sm:px-3 py-1.5 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
              {completedCount}/{totalCount} COMPLETE
            </HudBadge>
          </div>
        </div>

        {/* 2-Column Layout: Left (Vertical Task List) + Right (Streak Calendar & Alignment Metrics) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 min-w-0">
          {/* Left Column (7 cols): Clean Vertical List of 8 Tasks */}
          <div className="lg:col-span-7 space-y-3 min-w-0">
            <div className="flex flex-wrap items-center justify-between border-b border-line-subtle pb-2 gap-2">
              <span className="font-grotesk text-xs font-bold text-ink uppercase tracking-[0.08em] flex items-center gap-2 min-w-0">
                <TrendingUp className="w-4 h-4 text-cyan-glow shrink-0" />
                SCHEDULE ({completedCount}/{totalCount})
              </span>

              <button
                type="button"
                onClick={toggleReminders}
                className="flex items-center gap-1 text-[11px] font-bold min-h-[44px] px-2.5 py-1 rounded-control border border-line bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line-strong text-cyan-glow transition-colors touch-manipulation shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                title="Toggle automated 10-minute prior toast reminders"
                aria-label={remindersEnabled ? 'Turn reminders off' : 'Turn reminders on'}
                aria-pressed={remindersEnabled}
              >
                {remindersEnabled ? <Bell className="w-3 h-3 text-cyan-glow" /> : <BellOff className="w-3 h-3 text-crimson-text" />}
                <span>{remindersEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="space-y-1.5 sm:space-y-2 font-sans text-xs">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => toggleTask(task.key || task.id)}
                  aria-pressed={task.completed}
                  className={`w-full min-h-[44px] px-2.5 py-2.5 sm:p-3 border transition-all cursor-pointer flex items-center gap-2.5 sm:gap-3 rounded-control group text-left touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                    task.completed
                      ? 'bg-abyss/60 border-line-subtle text-ink-muted hover:border-line'
                      : 'bg-surface-1 hud-sheen border-line text-ink hover:border-line-strong hover:bg-surface-2'
                  }`}
                >
                  {task.completed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-ink-muted shrink-0 group-hover:text-cyan-glow" />
                  )}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="text-[11px] font-bold text-cyan-glow bg-cyan-soft px-1.5 py-0.5 border border-line-subtle rounded-chip inline-block">
                      {task.time}
                    </span>
                    <span className={`text-xs font-bold block whitespace-normal ${task.completed ? 'line-through opacity-75 text-ink-muted' : 'text-ink'}`}>
                      {task.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column (5 cols): Streak Calendar, Heatmap & Alignment Stats */}
          <div className="lg:col-span-5 space-y-4 min-w-0">
            {/* 14-Day Streak Calendar Grid */}
            <div className="rounded-card border border-line-subtle bg-abyss/60 p-3 sm:p-4 space-y-3 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-line-subtle pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BarChart3 className="w-4 h-4 text-cyan-glow shrink-0" />
                  <span className="text-xs font-bold font-grotesk text-ink uppercase tracking-[0.08em]">
                    STREAK MATRIX
                  </span>
                </div>
                <span className="text-[11px] text-cyan-glow font-bold shrink-0">14-DAY RECORD</span>
              </div>

              {/* Streak Bar Graph */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 items-end h-24 pt-4 px-0.5 sm:px-1 border-b border-line-subtle pb-2">
                  {streakHistory.slice(-7).map((item, idx) => {
                    const heightPct = Math.max(item.pct, 15)
                    const isFull = item.pct === 100

                    return (
                      <button
                        key={idx}
                        type="button"
                        onMouseEnter={() => setHoveredDay(item)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onFocus={() => setHoveredDay(item)}
                        onBlur={() => setHoveredDay(null)}
                        onClick={() => setHoveredDay((prev) => (prev?.day === item.day ? null : item))}
                        className="flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer group relative min-w-0 touch-manipulation bg-transparent p-0 border-0 rounded-chip focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                        aria-label={`${item.dayName}: ${item.completed} of ${item.total} tasks`}
                      >
                        {/* Tooltip */}
                        {hoveredDay?.day === item.day && (
                          <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-30 rounded-control bg-surface-2 border border-line px-2 py-0.5 text-[11px] whitespace-nowrap text-ink shadow-menu">
                            <span className="text-cyan-glow font-bold">{item.day}:</span> {item.completed}/{item.total}
                          </div>
                        )}

                        {/* Bar */}
                        <div className="w-full bg-surface-3 border border-line-subtle relative overflow-hidden group-hover:border-line-strong transition-all rounded-chip h-full flex items-end">
                          <div
                            className={`w-full transition-all duration-500 relative ${
                              item.isToday
                                ? 'bg-gradient-to-t from-cyan-glow to-emerald-400'
                                : isFull
                                ? 'bg-cyan-glow'
                                : 'bg-emerald-500/80'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>

                        {/* Day Name — short labels so the 7-col grid stays even */}
                        <span className={`text-[11px] font-sans leading-none ${item.isToday ? 'text-cyan-glow font-bold' : 'text-ink-muted'}`}>
                          {item.isToday ? 'TD' : item.dayName.slice(0, 2)}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Progress Readout */}
                <div className="space-y-1 pt-1">
                  <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-[11px] text-ink-muted">
                    <span>TODAY'S ALIGNMENT ({completionPercent}%)</span>
                    <span className="text-cyan-glow font-bold">{completedCount} / {totalCount} TASKS</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-3 rounded-chip overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-500 relative ${
                        completionPercent >= 100 ? 'bg-emerald-500' : 'bg-cyan-glow'
                      }`}
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>


            {/* Activity Heatmap */}
            <ActivityHeatmap history={history} currentDate={currentDate} />
          </div>

        </div>
      </HudCard>
    </HudGhostWidget>
  )
}
