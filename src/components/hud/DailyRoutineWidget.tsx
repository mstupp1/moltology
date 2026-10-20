import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Calendar, CheckSquare, Square, TrendingUp, BarChart3, CheckCircle2, Bell, BellOff } from 'lucide-react'
import { HudCard, HudBadge } from '@/components/ui'
import { useAlignmentReminders } from '@/hooks/useAlignmentReminders'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { DailyRoutineGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'
import { openAlignmentPanel } from '@/lib/alignment-panel'
import { ALIGNMENT_HISTORY_DAYS, DAILY_ALIGNMENT_HUB_ID, localDateString, parseLocalDate, TOTAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'
import type { DailyStreakDay } from '@/lib/alignment-tasks'

// ---------------------------------------------------------------------------
// ActivityHeatmap — width-aware GitHub-style grid (Sun–Sat rows, weeks as cols)
// ---------------------------------------------------------------------------

export const ALIGNMENT_HEATMAP = {
  maxWeeks: Math.ceil((ALIGNMENT_HISTORY_DAYS + 6) / 7),
  minCell: 11,
  maxCell: 20,
  gap: 2,
  dowGutter: 16,
} as const

/** SSR / pre-measure fallback — fills a typical phone card without a dead gutter once measured. */
export const ALIGNMENT_HEATMAP_DEFAULT = {
  weeks: ALIGNMENT_HEATMAP.maxWeeks,
  cell: 20,
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
 * Keeps the complete 90-day history visible, growing cells up to MAX_CELL when
 * the container allows it and scrolling only when the card is exceptionally narrow.
 */
export function computeHeatmapLayout(containerWidth: number, weeks = ALIGNMENT_HEATMAP.maxWeeks): HeatmapLayout {
  const { minCell, maxCell, gap, dowGutter } = ALIGNMENT_HEATMAP

  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    return { ...ALIGNMENT_HEATMAP_DEFAULT, weeks, fillsWidth: true, scrolls: false }
  }

  const available = Math.max(0, Math.floor(containerWidth) - dowGutter)
  const minStride = minCell + gap
  const maxStride = maxCell + gap

  if (available < weeks * minStride) {
    return {
      weeks,
      cell: minCell,
      gap,
      dowGutter,
      fillsWidth: false,
      scrolls: true,
    }
  }

  const cell = Math.min(maxCell, Math.max(minCell, Math.floor(available / weeks) - gap))

  const gridWidth = weeks * (cell + gap)
  const remainder = available - gridWidth
  const fillsWidth = remainder < maxStride

  return { weeks, cell, gap, dowGutter, fillsWidth, scrolls: false }
}

function useHeatmapLayout(containerRef: React.RefObject<HTMLElement | null>, weeks: number): HeatmapLayout {
  const [layout, setLayout] = useState<HeatmapLayout>(() => ({
    ...ALIGNMENT_HEATMAP_DEFAULT,
    fillsWidth: true,
    scrolls: false,
  }))

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const update = () => {
      setLayout(computeHeatmapLayout(el.clientWidth, weeks))
    }
    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef, weeks])

  return layout
}

interface HeatmapCell {
  date: string
  count: number
  isToday: boolean
  isOutsideRange: boolean
}

export function buildHeatmapGrid(
  history: Array<{ date: string; completedCount: number }>,
  todayDate: string
): { grid: HeatmapCell[][]; monthLabels: Array<{ label: string; colIndex: number }> } {
  const countMap = new Map<string, number>()
  for (const item of history) {
    countMap.set(item.date, item.completedCount)
  }

  // Start on Sunday for the week containing the first retained date; end on
  // Saturday for today's week. Padding dates outside the exact window are blank.
  const todayObj = parseLocalDate(todayDate)
  const historyStart = new Date(todayObj)
  historyStart.setDate(todayObj.getDate() - (ALIGNMENT_HISTORY_DAYS - 1))
  const gridStart = new Date(historyStart)
  gridStart.setDate(historyStart.getDate() - historyStart.getDay())
  const daysFromStartToToday = Math.round((todayObj.getTime() - gridStart.getTime()) / 86_400_000)
  const weeks = Math.floor(daysFromStartToToday / 7) + 1

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
      const isBeforeRange = cellDate < historyStart
      const isOutsideRange = isBeforeRange || cellDate > todayObj

      col.push({
        date: dateStr,
        count: isOutsideRange ? 0 : (countMap.get(dateStr) ?? 0),
        isToday,
        isOutsideRange,
      })
    }

    // Month label: emit when month changes AND minimum gap from last label is respected
    const firstInRangeDate = col.find((cell) => !cell.isOutsideRange)?.date ?? col[0].date
    const refDate = parseLocalDate(firstInRangeDate)
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

function heatmapColor(count: number, isOutsideRange: boolean, isToday: boolean): string {
  if (isOutsideRange) return 'bg-transparent border-transparent'
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
  const { grid, monthLabels } = useMemo(
    () => buildHeatmapGrid(history, currentDate),
    [history, currentDate]
  )
  const layout = useHeatmapLayout(scrollRef, grid.length)
  const colW = layout.cell + layout.gap

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
          {ALIGNMENT_HISTORY_DAYS} days
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
        <div className="w-max mx-auto">
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
                      disabled={cell.isOutsideRange}
                      aria-label={`${cell.date}: ${
                        cell.isOutsideRange
                          ? `outside ${ALIGNMENT_HISTORY_DAYS}-day history`
                          : cell.count === 0
                          ? 'no tasks done'
                          : `${cell.count} of ${totalTasks} tasks done`
                      }`}
                      className={`border rounded-chip ${cell.isOutsideRange ? 'cursor-default' : 'cursor-pointer transition-opacity hover:opacity-70 touch-manipulation focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-cyan-glow'} p-0 ${heatmapColor(cell.count, cell.isOutsideRange, cell.isToday)}`}
                      style={{ width: layout.cell, height: layout.cell }}
                      onMouseEnter={cell.isOutsideRange ? undefined : (e) => showCellTooltip(cell, e.currentTarget)}
                      onFocus={cell.isOutsideRange ? undefined : (e) => showCellTooltip(cell, e.currentTarget)}
                      onClick={cell.isOutsideRange ? undefined : (e) => showCellTooltip(cell, e.currentTarget)}
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
              {tooltip.cell.count === 0
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
        className="p-4 lg:p-5 relative space-y-4 font-sans min-w-0 overflow-hidden"
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
              <Calendar className="w-4 h-4 text-cyan-glow shrink-0" />
              <h2 className="font-grotesk text-sm font-bold tracking-[0.08em] text-ink group-hover:text-cyan-glow transition-colors uppercase leading-tight">
                DAILY ALIGNMENT
              </h2>
            </div>
            <p className="text-xs text-ink-body leading-relaxed">
              Eight liturgies a day keep the shell hard and the streak alive.
            </p>
          </button>

          {/* Stats Summary Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
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
                  className={`w-full min-h-[44px] px-2.5 py-2 sm:px-3 border transition-all cursor-pointer flex items-center gap-2.5 sm:gap-3 rounded-control group text-left touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
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
                  <div className="min-w-0 flex-1 flex items-center gap-2.5">
                    <span className="w-20 shrink-0 text-[11px] font-bold tabular-nums text-cyan-glow">
                      {task.time}
                    </span>
                    <span className={`min-w-0 text-xs font-bold whitespace-normal ${task.completed ? 'line-through opacity-75 text-ink-muted' : 'text-ink'}`}>
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
                    LAST 7 DAYS
                  </span>
                </div>
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
