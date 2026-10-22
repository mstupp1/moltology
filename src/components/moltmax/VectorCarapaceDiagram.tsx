import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Brain, ChevronDown, Compass, Layers3, Shield, Zap, type LucideIcon } from 'lucide-react'
import { MOLTMAX_QUESTIONS, type QuizDimension, type QuizFormat } from '@/lib/moltmax-quiz'
import { usePrefersReducedMotion } from '@/components/what-is-moltology/story/motion'
import {
  DIAGRAM_CENTER,
  DIAGRAM_SIZE,
  VECTOR_COUNT,
  easeOutCubic,
  lerpValues,
  nodePosition,
  pointsAttr,
  polarPoint,
  shapeFor,
  wrapIndex,
} from './vector-diagram-geometry'

interface VectorDetail {
  key: QuizDimension
  label: string
  /** What the trait covers, in a few plain words. */
  dimension: string
  description: string
  Icon: LucideIcon
}

export const VECTORS: VectorDetail[] = [
  {
    key: 'shellHardness',
    label: 'Carapace Resilience',
    dimension: 'Handling pressure',
    description: 'How well you take criticism, friction and setbacks without letting them knock you off course.',
    Icon: Shield,
  },
  {
    key: 'pincerTorque',
    label: 'Pincer Torque',
    dimension: 'Decisions and follow-through',
    description: 'How quickly you make hard calls, and whether you see them through once you have committed.',
    Icon: Zap,
  },
  {
    key: 'neuralLatency',
    label: 'Synaptic Speed',
    dimension: 'Focus under load',
    description: 'How clearly you think when things get noisy: sorting what matters first and holding your focus while the load is heavy.',
    Icon: Brain,
  },
  {
    key: 'ecdysisDiscipline',
    label: 'Ecdysis Shedding',
    dimension: 'Letting go to grow',
    description: 'How willing you are to drop old habits, stale pride and patterns that no longer serve you, so something stronger can grow.',
    Icon: Layers3,
  },
  {
    key: 'depthTolerance',
    label: 'Depth Composure',
    dimension: 'Calm under stress',
    description: 'How steady you stay as stress builds: keeping your head, regulating your reactions and staying grounded.',
    Icon: Compass,
  },
]

const FORMAT_LABEL: Record<QuizFormat, string> = {
  scenario: 'Scenario',
  likert: 'Agree or disagree',
  binary: 'Either-or',
}

const MORPH_MS = 480
const RINGS = [25, 50, 75, 100]
// SVG strokes take raw values; these match the cyan-glow and line tokens.
const CYAN = '#00c3ff'
const GRID = 'rgba(150, 170, 170, 0.16)'
const GRID_OUTER = 'rgba(150, 170, 170, 0.32)'

export const VectorCarapaceDiagram: React.FC = () => {
  const baseId = useId()
  const shapeRef = useRef<SVGPolygonElement>(null)
  const dotRefs = useRef<Array<SVGCircleElement | null>>([])
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([])
  const valuesRef = useRef<number[]>(shapeFor(0))

  const [active, setActive] = useState(0)
  const [preview, setPreview] = useState<number | null>(null)
  const reduced = usePrefersReducedMotion()
  const shown = preview ?? active

  const questionsByVector = useMemo(() => {
    const map = new Map<QuizDimension, typeof MOLTMAX_QUESTIONS>()
    for (const question of MOLTMAX_QUESTIONS) {
      map.set(question.dimension, [...(map.get(question.dimension) ?? []), question])
    }
    return map
  }, [])

  const select = useCallback((index: number) => setActive(wrapIndex(index)), [])

  // Ease the sample shape toward the shown vector. Writes attributes directly so a tween never re-renders React.
  useEffect(() => {
    const target = shapeFor(shown)
    const from = valuesRef.current
    const draw = (values: number[]) => {
      valuesRef.current = values
      shapeRef.current?.setAttribute('points', pointsAttr(values))
      values.forEach((value, index) => {
        const dot = dotRefs.current[index]
        if (!dot) return
        const [x, y] = polarPoint(index, value)
        dot.setAttribute('cx', x.toFixed(2))
        dot.setAttribute('cy', y.toFixed(2))
      })
    }
    if (reduced || typeof window === 'undefined') {
      draw(target)
      return
    }
    let frame = 0
    const start = performance.now()
    const step = (now: number) => {
      const t = easeOutCubic((now - start) / MORPH_MS)
      draw(lerpValues(from, target, t))
      if (t < 1) frame = window.requestAnimationFrame(step)
    }
    frame = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(frame)
  }, [shown, reduced])

  const onRowKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 }
    let next: number | null = null
    if (event.key in keys) next = wrapIndex(index + keys[event.key])
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = VECTOR_COUNT - 1
    if (next === null) return
    event.preventDefault()
    select(next)
    rowRefs.current[next]?.focus()
  }

  const hoverProps = (index: number) => ({
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType === 'mouse') setPreview(index)
    },
    onPointerLeave: () => setPreview(null),
  })

  const initialShape = shapeFor(0)

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      {/* Chart */}
      <figure className="mx-auto w-full max-w-[500px] px-10 sm:px-14">
        <div className="relative aspect-square w-full">
          <svg viewBox={`0 0 ${DIAGRAM_SIZE} ${DIAGRAM_SIZE}`} className="h-full w-full overflow-visible" aria-hidden>
            {RINGS.map((ring) => (
              <polygon
                key={ring}
                points={pointsAttr(Array(VECTOR_COUNT).fill(ring))}
                fill="none"
                stroke={ring === 100 ? GRID_OUTER : GRID}
                strokeWidth="1"
              />
            ))}
            {VECTORS.map((v, index) => {
              const [x, y] = polarPoint(index, 100)
              const lit = index === shown
              return (
                <line
                  key={v.key}
                  x1={DIAGRAM_CENTER}
                  y1={DIAGRAM_CENTER}
                  x2={x}
                  y2={y}
                  stroke={lit ? CYAN : GRID}
                  strokeOpacity={lit ? 0.7 : 1}
                  strokeWidth={lit ? 1.5 : 1}
                  className="transition-[stroke,stroke-opacity] duration-300"
                />
              )
            })}

            <polygon
              ref={shapeRef}
              points={pointsAttr(initialShape)}
              fill={CYAN}
              fillOpacity="0.12"
              stroke={CYAN}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {VECTORS.map((v, index) => {
              const [x, y] = polarPoint(index, initialShape[index])
              const lit = index === shown
              return (
                <circle
                  key={v.key}
                  ref={(node) => {
                    dotRefs.current[index] = node
                  }}
                  cx={x}
                  cy={y}
                  r={lit ? 4.5 : 3}
                  fill={CYAN}
                  stroke="#030708"
                  strokeWidth={lit ? 2 : 0}
                />
              )
            })}
          </svg>

          {/* Axis names. Mouse shortcuts only: the list beside the chart is the keyboard and screen reader control. */}
          {VECTORS.map((v, index) => {
            const lit = index === shown
            const [first, ...rest] = v.label.split(' ')
            return (
              <button
                key={v.key}
                type="button"
                tabIndex={-1}
                aria-hidden
                onClick={() => select(index)}
                {...hoverProps(index)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer whitespace-nowrap rounded-control px-1.5 py-1 text-center text-[11px] font-semibold uppercase leading-tight tracking-[0.14em] transition-colors sm:text-xs ${
                  lit ? 'text-cyan-glow' : 'text-ink-muted hover:text-ink'
                }`}
                style={nodePosition(index)}
              >
                {first}
                <br />
                {rest.join(' ')}
              </button>
            )
          })}
        </div>
        <figcaption className="mt-6 text-center text-xs leading-relaxed text-ink-muted">
          Sample profile. Your own shape appears with your results.
        </figcaption>
      </figure>

      {/* Vector list */}
      <ul className="space-y-2">
        {VECTORS.map((v, index) => {
          const open = index === active
          const lit = index === shown
          const questions = questionsByVector.get(v.key) ?? []
          const { Icon } = v
          return (
            <li
              key={v.key}
              {...hoverProps(index)}
              className={`rounded-card border transition-[background-color,border-color,box-shadow] duration-300 ${
                open ? 'border-transparent bg-surface-3 shadow-nav-current' : lit ? 'border-line-subtle bg-surface-2' : 'border-line-subtle bg-surface-1'
              }`}
            >
              <h3>
                <button
                  ref={(node) => {
                    rowRefs.current[index] = node
                  }}
                  type="button"
                  id={`${baseId}-row-${index}`}
                  aria-expanded={open}
                  aria-controls={`${baseId}-detail-${index}`}
                  onClick={() => select(index)}
                  onKeyDown={(event) => onRowKeyDown(event, index)}
                  className="flex min-h-12 w-full cursor-pointer items-center gap-4 rounded-card px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control border transition-colors ${
                      open ? 'border-line-strong text-cyan-glow' : 'border-line-subtle text-ink-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-grotesk text-sm font-bold uppercase tracking-wide text-ink sm:text-base">{v.label}</span>
                    <span className="block text-xs text-ink-muted">{v.dimension}</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-cyan-glow' : 'text-ink-muted'}`}
                    aria-hidden
                  />
                </button>
              </h3>

              <div
                id={`${baseId}-detail-${index}`}
                role="region"
                aria-labelledby={`${baseId}-row-${index}`}
                inert={!open}
                className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 sm:pl-[4.25rem]">
                    <p className="text-sm leading-relaxed text-ink-body">{v.description}</p>
                    <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">The three questions behind it</div>
                    <ol className="mt-2 divide-y divide-line-subtle border-t border-line-subtle">
                      {questions.map((question) => (
                        <li key={question.id} className="flex gap-3 py-2.5">
                          <span className="w-7 shrink-0 pt-px text-xs font-semibold tabular-nums text-ink-muted">
                            {question.id.replace('q', '').padStart(2, '0')}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm leading-snug text-ink-body">{question.prompt}</p>
                            <span className="mt-1 block text-[11px] text-ink-muted">{FORMAT_LABEL[question.format]}</span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
