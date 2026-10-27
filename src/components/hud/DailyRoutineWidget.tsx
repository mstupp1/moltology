import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Calendar, Check } from 'lucide-react'
import { DashboardPanel } from '@/components/hud/dashboard/DashboardPanel'
import { useDailyAlignment } from '@/hooks/useDailyAlignment'
import { DailyRoutineGhost } from '@/components/hud/HudGhostSkeletons'
import { HudGhostWidget } from '@/components/ui/HudGhostLoader'
import { openAlignmentPanel } from '@/lib/alignment-panel'
import { ALIGNMENT_HISTORY_DAYS, DAILY_ALIGNMENT_HUB_ID, localDateString, parseLocalDate, TOTAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'
import type { DailyStreakDay } from '@/lib/alignment-tasks'
import { cn } from '@/lib/utils'

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

/** One cyan ramp from empty to a full day, so the heatmap and the week bars read the same way. */
export function heatmapColor(count: number, isOutsideRange: boolean): string {
  if (isOutsideRange) return 'bg-transparent border-transparent'
  if (count === 0) return 'bg-surface-3 border-line-subtle'
  if (count <= 2) return 'bg-cyan-glow/20 border-cyan-glow/20'
  if (count <= 4) return 'bg-cyan-glow/40 border-cyan-glow/35'
  if (count <= 6) return 'bg-cyan-glow/65 border-cyan-glow/55'
  return 'bg-cyan-glow border-cyan-glow'
}

const LEGEND_CELL = 11

/** Small labelled block inside the alignment card: caps label left, a short readout right. */
function AlignmentBlock({
  label,
  meta,
  metaTestId,
  className,
  children,
}: {
  label: string
  meta?: React.ReactNode
  metaTestId?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('rounded-control border border-line-subtle bg-abyss/40 p-3 space-y-3 min-w-0', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink-muted">{label}</span>
        {meta != null && (
          <span className="text-[11px] text-ink-muted tabular-nums" data-testid={metaTestId}>
            {meta}
          </span>
        )}
      </div>
      {children}
    </div>
  )
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

  // Keep the most recent week (today) in view when the grid scrolls on very narrow cards.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
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

  const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const VISIBLE_DOW = new Set([1, 3, 5]) // Mon, Wed, Fri

  return (
    <AlignmentBlock
      label="Activity"
      meta={`${ALIGNMENT_HISTORY_DAYS} days`}
      metaTestId="alignment-heatmap-weeks"
      className="text-xs overflow-hidden"
    >
      <div
        ref={scrollRef}
        className="overflow-x-auto overscroll-x-contain relative min-w-0 max-w-full"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onMouseLeave={() => setTooltip(null)}
        data-testid="alignment-heatmap-scroll"
      >
        <div className="w-max mx-auto">
          <div className="flex mb-1.5">
            <div style={{ width: layout.dowGutter }} className="shrink-0" />
            <div className="relative" style={{ width: grid.length * colW, height: 14 }}>
              {monthLabels.map(({ label, colIndex }) => (
                <span
                  key={`${label}-${colIndex}`}
                  className="absolute text-[11px] leading-none text-ink-muted font-sans"
                  style={{ left: colIndex * colW }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex flex-col shrink-0 pr-1" style={{ width: layout.dowGutter, gap: layout.gap }}>
              {DOW_LABELS.map((label, i) => (
                <div key={`${label}-${i}`} style={{ height: layout.cell }} className="flex items-center">
                  <span className={cn('text-[11px] text-ink-muted leading-none', !VISIBLE_DOW.has(i) && 'invisible')}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

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
                      className={cn(
                        'border rounded-chip p-0',
                        cell.isOutsideRange
                          ? 'cursor-default'
                          : 'cursor-pointer transition-opacity hover:opacity-70 touch-manipulation focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-cyan-glow',
                        heatmapColor(cell.count, cell.isOutsideRange),
                        cell.isToday && 'outline outline-1 outline-offset-1 outline-ink-muted',
                      )}
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

          {tooltip && (
            <div
              className="absolute z-30 pointer-events-none rounded-control bg-surface-2 border border-line px-2 py-1 text-[11px] whitespace-nowrap text-ink shadow-menu"
              style={{ left: tooltip.x, top: Math.max(0, tooltip.y - 36) }}
            >
              <span className="text-cyan-glow font-bold">{tooltip.cell.date}</span>
              {' · '}
              {tooltip.cell.count === 0 ? 'no tasks done' : `${tooltip.cell.count} of ${totalTasks} tasks done`}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <span className="text-[11px] text-ink-muted mr-0.5">Less</span>
        {[0, 2, 4, 6, 8].map((lvl) => (
          <div
            key={lvl}
            className={cn('border rounded-chip', heatmapColor(lvl, false))}
            style={{ width: LEGEND_CELL, height: LEGEND_CELL }}
          />
        ))}
        <span className="text-[11px] text-ink-muted ml-0.5">More</span>
      </div>
    </AlignmentBlock>
  )
}

function WeekBars({ days }: { days: DailyStreakDay[] }) {
  const [hoveredDay, setHoveredDay] = useState<DailyStreakDay | null>(null)
  const fullDays = days.filter((d) => d.pct >= 100).length

  return (
    <AlignmentBlock label="Last 7 days" meta={`${fullDays} of ${days.length} full`} metaTestId="alignment-week-full">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((item) => {
          const isFull = item.pct >= 100
          return (
            <button
              key={item.date}
              type="button"
              onMouseEnter={() => setHoveredDay(item)}
              onMouseLeave={() => setHoveredDay(null)}
              onFocus={() => setHoveredDay(item)}
              onBlur={() => setHoveredDay(null)}
              onClick={() => setHoveredDay((prev) => (prev?.date === item.date ? null : item))}
              className="relative flex flex-col items-center gap-1.5 min-w-0 bg-transparent p-0 border-0 rounded-chip cursor-pointer touch-manipulation group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              aria-label={`${item.isToday ? 'Today' : item.dayName}: ${item.completed} of ${item.total} tasks`}
            >
              {hoveredDay?.date === item.date && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 rounded-control bg-surface-2 border border-line px-2 py-0.5 text-[11px] whitespace-nowrap text-ink shadow-menu">
                  {item.completed} of {item.total}
                </span>
              )}
              <span
                className={cn(
                  'w-full h-16 rounded-chip bg-surface-3 flex items-end overflow-hidden transition-colors',
                  item.isToday ? 'outline outline-1 outline-offset-1 outline-ink-muted' : 'group-hover:bg-surface-2',
                )}
              >
                <span
                  className={cn('w-full transition-[height] duration-500', isFull ? 'bg-cyan-glow' : 'bg-cyan-glow/40')}
                  style={{ height: `${Math.max(0, Math.min(100, item.pct))}%` }}
                />
              </span>
              <span className={cn('text-[11px] leading-none', item.isToday ? 'text-ink font-bold' : 'text-ink-muted')}>
                {item.isToday ? 'Today' : item.dayName.slice(0, 3)}
              </span>
            </button>
          )
        })}
      </div>
    </AlignmentBlock>
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

  const allDone = completedCount >= totalCount
  const nextTaskId = tasks.find((task) => !task.completed)?.id

  useEffect(() => {
    if (isLoading || isAlignmentLoading) return
    if (typeof window === 'undefined') return
    if (window.location.hash !== `#${DAILY_ALIGNMENT_HUB_ID}`) return
    document.getElementById(DAILY_ALIGNMENT_HUB_ID)?.scrollIntoView({ block: 'start' })
  }, [isLoading, isAlignmentLoading])

  return (
    <HudGhostWidget isLoading={isLoading || isAlignmentLoading} skeleton={<DailyRoutineGhost />}>
      <DashboardPanel
        id={DAILY_ALIGNMENT_HUB_ID}
        icon={<Calendar />}
        title="Daily alignment"
        className="lg:p-5 gap-4 font-sans overflow-hidden scroll-mt-24"
        meta={
          <span
            data-testid="alignment-count"
            className={cn(
              'inline-flex items-center gap-1 rounded-chip px-2 py-1 text-[11px] font-bold tabular-nums',
              allDone ? 'bg-emerald-500/15 text-emerald-500' : 'bg-surface-3 text-ink',
            )}
          >
            {allDone && <Check className="w-3 h-3" aria-hidden="true" />}
            {completedCount}/{totalCount} done
          </span>
        }
        action={{
          label: 'Open',
          onClick: openAlignmentPanel,
          ariaLabel: 'Open daily alignment liturgies',
          testId: 'daily-alignment-card-open',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-w-0">
          <div className="lg:col-span-7 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink-muted">Today’s schedule</span>
            </div>

            <ul className="rounded-control border border-line-subtle divide-y divide-line-subtle overflow-hidden">
              {tasks.map((task) => {
                const isNext = task.id === nextTaskId
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => toggleTask(task.key || task.id)}
                      aria-pressed={task.completed}
                      className={cn(
                        'w-full min-h-[44px] px-3 py-2 flex items-center gap-3 text-left text-xs transition-colors touch-manipulation group focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow',
                        isNext ? 'bg-surface-3 shadow-nav-current' : task.completed ? 'bg-abyss/30 hover:bg-surface-2' : 'hover:bg-surface-2',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'w-4 h-4 shrink-0 rounded-chip border flex items-center justify-center transition-colors',
                          task.completed
                            ? 'bg-emerald-500 border-emerald-500 text-abyss'
                            : 'border-line-strong group-hover:border-cyan-glow',
                        )}
                      >
                        {task.completed && <Check className="w-3 h-3" strokeWidth={3} />}
                      </span>
                      <span
                        className={cn(
                          'w-24 shrink-0 text-[11px]',
                          isNext ? 'text-cyan-glow font-bold' : 'text-ink-muted',
                        )}
                      >
                        {task.time}
                      </span>
                      <span
                        className={cn(
                          'min-w-0 flex-1 font-bold',
                          task.completed ? 'line-through decoration-ink-muted/60 text-ink-muted font-normal' : 'text-ink',
                        )}
                      >
                        {task.title}
                      </span>
                      {isNext && (
                        <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-glow">Next</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="lg:col-span-5 space-y-3 min-w-0">
            <WeekBars days={streakHistory.slice(-7)} />
            <ActivityHeatmap history={history} currentDate={currentDate} />
          </div>
        </div>
      </DashboardPanel>
    </HudGhostWidget>
  )
}
