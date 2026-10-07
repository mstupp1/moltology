import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Brain, ChevronLeft, ChevronRight, Compass, Layers3, Shield, Zap, type LucideIcon } from 'lucide-react'
import { MOLTMAX_QUESTIONS, type QuizDimension, type QuizFormat } from '@/lib/moltmax-quiz'
import { useInView, usePrefersReducedMotion } from '@/components/what-is-moltology/story/motion'
import {
  DIAGRAM_CENTER,
  DIAGRAM_RADIUS,
  DIAGRAM_SIZE,
  VECTOR_COUNT,
  axisAngleDegrees,
  easeOutCubic,
  lerpValues,
  nodePosition,
  pointsAttr,
  polarPoint,
  shapeFor,
  wedgePath,
  wrapIndex,
} from './vector-diagram-geometry'
import './vector-diagram.css'

interface VectorDetail {
  key: QuizDimension
  code: string
  label: string
  /** Matches the axis label on the results radar chart. */
  short: string
  dimension: string
  description: string
  bullet: string
  color: string
  Icon: LucideIcon
}

export const VECTORS: VectorDetail[] = [
  {
    key: 'shellHardness',
    code: 'VEC-01',
    label: 'Carapace Resilience',
    short: 'Shell',
    dimension: 'Boundary & Stress Armor',
    description: 'Measures your capacity to absorb external criticism, friction, and setbacks without sustaining structural fracture or emotional corrosion.',
    bullet: 'Stress absorption & deflection',
    color: '#00ffcc',
    Icon: Shield,
  },
  {
    key: 'pincerTorque',
    code: 'VEC-02',
    label: 'Pincer Torque',
    short: 'Torque',
    dimension: 'Decisive Execution',
    description: 'Diagnoses your speed of closing the claw on high-stakes decisions and executing with unyielding leverage once committed.',
    bullet: 'Uncompromised execution grip',
    color: '#ffd700',
    Icon: Zap,
  },
  {
    key: 'neuralLatency',
    code: 'VEC-03',
    label: 'Synaptic Speed',
    short: 'Synapse',
    dimension: 'Neural Latency & Focus',
    description: 'Quantifies mental clarity in chaotic noise, split-second triage ability, and cognitive bandwidth under heavy operational load.',
    bullet: 'Zero-latency signal isolation',
    color: '#38bdf8',
    Icon: Brain,
  },
  {
    key: 'ecdysisDiscipline',
    code: 'VEC-04',
    label: 'Ecdysis Shedding',
    short: 'Ecdysis',
    dimension: 'Habit-Shedding & Growth',
    description: 'Measures your willingness to voluntarily molt outmoded habits, outdated pride, and dead patterns to make way for a denser carapace.',
    bullet: 'Voluntary ecdysis & unburdening',
    color: '#c084fc',
    Icon: Layers3,
  },
  {
    key: 'depthTolerance',
    code: 'VEC-05',
    label: 'Depth Composure',
    short: 'Depth',
    dimension: 'Mariana Trench Stillness',
    description: 'Calibrates emotional equilibrium, nervous system regulation, and grounded calm when descending into 11,000 meters of benthic pressure.',
    bullet: 'Benthic pressure homeostasis',
    color: '#ff7b72',
    Icon: Compass,
  },
]

const FORMAT_LABEL: Record<QuizFormat, string> = {
  scenario: 'Scenario',
  likert: 'Agree or disagree',
  binary: 'Either-or',
}

const AUTOPLAY_MS = 6500
const MORPH_MS = 520
const RINGS = [25, 50, 75, 100]

export const VectorCarapaceDiagram: React.FC = () => {
  const baseId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const shapeRef = useRef<SVGPolygonElement>(null)
  const dotRefs = useRef<Array<SVGCircleElement | null>>([])
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const valuesRef = useRef<number[]>(shapeFor(0))

  const [active, setActive] = useState(0)
  const [touched, setTouched] = useState(false)
  const [hovering, setHovering] = useState(false)
  const inView = useInView(rootRef, '0px 0px -15% 0px')
  const reduced = usePrefersReducedMotion()

  const questionsByVector = useMemo(() => {
    const map = new Map<QuizDimension, typeof MOLTMAX_QUESTIONS>()
    for (const question of MOLTMAX_QUESTIONS) {
      map.set(question.dimension, [...(map.get(question.dimension) ?? []), question])
    }
    return map
  }, [])

  const select = useCallback((index: number) => {
    setTouched(true)
    setActive(wrapIndex(index))
  }, [])

  // Morph the shell toward the active vector. Writes attributes directly so a tween never re-renders React.
  useEffect(() => {
    const target = shapeFor(active)
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
  }, [active, reduced])

  // Gentle tour of the vectors until someone picks one. Only runs while the diagram is on screen.
  const autoplay = inView && !reduced && !touched
  useEffect(() => {
    if (!autoplay || hovering) return
    const timer = window.setTimeout(() => setActive((current) => wrapIndex(current + 1)), AUTOPLAY_MS)
    return () => window.clearTimeout(timer)
  }, [autoplay, hovering, active])

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    let next: number | null = null
    if (event.key in keys) next = wrapIndex(active + keys[event.key])
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = VECTOR_COUNT - 1
    if (next === null) return
    event.preventDefault()
    select(next)
    tabRefs.current[next]?.focus()
  }

  const vec = VECTORS[active]
  const questions = questionsByVector.get(vec.key) ?? []
  const initialShape = shapeFor(0)

  return (
    <div
      ref={rootRef}
      className={`relative grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14 ${inView ? '' : 'vd-paused'}`}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setHovering(true)
      }}
      onPointerLeave={() => setHovering(false)}
    >
      {/* Diagram */}
      <div className="relative mx-auto w-full max-w-[520px] px-1 pb-6 pt-4 sm:px-4">
        <div className="relative aspect-square w-full">
          {/* Slow orbit rings live in their own layer so they rotate on the compositor. */}
          <div aria-hidden className="vd-orbit pointer-events-none absolute inset-[4%] rounded-full border border-dashed border-cyan-400/15" />
          <div aria-hidden className="vd-orbit vd-orbit--reverse pointer-events-none absolute inset-[11%] rounded-full">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              {Array.from({ length: 60 }, (_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="0.6"
                  x2="50"
                  y2={i % 5 === 0 ? 3.2 : 1.8}
                  stroke={i % 5 === 0 ? 'rgba(0,255,204,0.45)' : 'rgba(56,189,248,0.22)'}
                  strokeWidth="0.35"
                  transform={`rotate(${i * 6} 50 50)`}
                />
              ))}
            </svg>
          </div>

          <svg viewBox={`0 0 ${DIAGRAM_SIZE} ${DIAGRAM_SIZE}`} className="relative h-full w-full overflow-visible" aria-hidden>
            <defs>
              <radialGradient id={`${baseId}-core`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={vec.color} stopOpacity="0.55" />
                <stop offset="55%" stopColor={vec.color} stopOpacity="0.12" />
                <stop offset="100%" stopColor="#020608" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={`${baseId}-shell`} cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#00c3ff" stopOpacity="0.28" />
              </radialGradient>
            </defs>

            {/* Wedges: highlight for the active vector and a wide hover target for each axis */}
            {VECTORS.map((v, index) => (
              <path
                key={v.key}
                d={wedgePath(index)}
                fill={v.color}
                fillOpacity={index === active ? 0.09 : 0}
                className={`cursor-pointer transition-[fill-opacity] duration-500 ${index === active ? '' : 'hover:[fill-opacity:0.05]'}`}
                onClick={() => select(index)}
              />
            ))}

            {/* Rings */}
            {RINGS.map((ring) => (
              <polygon
                key={ring}
                points={pointsAttr(Array(VECTOR_COUNT).fill(ring))}
                fill="none"
                stroke={ring === 100 ? 'rgba(0,195,255,0.35)' : 'rgba(0,195,255,0.14)'}
                strokeWidth={ring === 100 ? 1.25 : 1}
                strokeDasharray={ring === 100 ? undefined : '3 5'}
                pointerEvents="none"
              />
            ))}
            {RINGS.filter((ring) => ring < 100).map((ring) => {
              const [x, y] = polarPoint(0, ring)
              return (
                <text key={ring} x={x + 6} y={y + 3} fill="rgba(148,163,163,0.6)" fontSize="9" className="font-mono" pointerEvents="none">
                  {ring}
                </text>
              )
            })}

            {/* Spokes */}
            {VECTORS.map((v, index) => {
              const [x, y] = polarPoint(index, 100)
              const isActive = index === active
              return (
                <g key={v.key} pointerEvents="none">
                  {isActive && <line x1={DIAGRAM_CENTER} y1={DIAGRAM_CENTER} x2={x} y2={y} stroke={v.color} strokeOpacity="0.25" strokeWidth="7" strokeLinecap="round" />}
                  <line
                    x1={DIAGRAM_CENTER}
                    y1={DIAGRAM_CENTER}
                    x2={x}
                    y2={y}
                    stroke={v.color}
                    strokeOpacity={isActive ? 0.95 : 0.3}
                    strokeWidth={isActive ? 2 : 1}
                    className="transition-[stroke-opacity] duration-500"
                  />
                </g>
              )
            })}

            {/* Travelling pulse on the active spoke */}
            <g transform={`rotate(${axisAngleDegrees(active)} ${DIAGRAM_CENTER} ${DIAGRAM_CENTER})`} pointerEvents="none">
              <circle
                key={active}
                cx={DIAGRAM_CENTER}
                cy={DIAGRAM_CENTER}
                r="4.5"
                fill={vec.color}
                className="vd-pulse"
                style={{ ['--vd-reach' as string]: `-${DIAGRAM_RADIUS}px` }}
              />
            </g>

            {/* Sample shell */}
            <polygon
              ref={shapeRef}
              points={pointsAttr(initialShape)}
              fill={`url(#${baseId}-shell)`}
              stroke="#00ffcc"
              strokeOpacity="0.85"
              strokeWidth="1.75"
              strokeLinejoin="round"
              pointerEvents="none"
            />
            {VECTORS.map((v, index) => {
              const [x, y] = polarPoint(index, initialShape[index])
              return (
                <circle
                  key={v.key}
                  ref={(node) => {
                    dotRefs.current[index] = node
                  }}
                  cx={x}
                  cy={y}
                  r={index === active ? 5.5 : 3.5}
                  fill={v.color}
                  stroke="#020608"
                  strokeWidth="2"
                  pointerEvents="none"
                />
              )
            })}

            {/* Core */}
            <circle cx={DIAGRAM_CENTER} cy={DIAGRAM_CENTER} r="46" fill={`url(#${baseId}-core)`} pointerEvents="none" />
            <circle cx={DIAGRAM_CENTER} cy={DIAGRAM_CENTER} r="25" fill="#020608" stroke={vec.color} strokeOpacity="0.7" strokeWidth="1.25" pointerEvents="none" />
            <text x={DIAGRAM_CENTER} y={DIAGRAM_CENTER - 2} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700" letterSpacing="1" className="font-mono" pointerEvents="none">
              {vec.code.replace('VEC-', '')}
            </text>
            <text x={DIAGRAM_CENTER} y={DIAGRAM_CENTER + 10} textAnchor="middle" fill={vec.color} fontSize="6.5" letterSpacing="1.5" pointerEvents="none">
              OF 05
            </text>
          </svg>

          {/* Vector nodes: the real controls */}
          <div role="tablist" aria-label="The five vectors" aria-orientation="horizontal" className="absolute inset-0">
            {VECTORS.map((v, index) => {
              const isActive = index === active
              const pos = nodePosition(index)
              const { Icon } = v
              return (
                <div key={v.key} className="absolute -translate-x-1/2 -translate-y-1/2" style={pos}>
                  <button
                    ref={(node) => {
                      tabRefs.current[index] = node
                    }}
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${index}`}
                    aria-selected={isActive}
                    aria-controls={`${baseId}-panel`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => select(index)}
                    onKeyDown={onTabKeyDown}
                    className="group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 bg-[#03080b] transition-[transform,box-shadow,background-color] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:h-14 sm:w-14"
                    style={{
                      borderColor: isActive ? v.color : `${v.color}66`,
                      color: isActive ? '#020608' : v.color,
                      backgroundColor: isActive ? v.color : undefined,
                      boxShadow: isActive ? `0 0 26px ${v.color}88` : 'none',
                      transform: isActive ? 'scale(1.08)' : undefined,
                    }}
                  >
                    {isActive && <span aria-hidden className="vd-node-ping absolute inset-0 rounded-full border-2" style={{ borderColor: v.color }} />}
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                    <span className="sr-only">{v.label}</span>
                  </button>
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.18em] transition-colors sm:text-[11px] ${index === 0 ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
                    style={{ color: isActive ? v.color : 'rgba(180,196,195,0.75)' }}
                  >
                    {v.short}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        <p className="mt-6 text-center text-[11px] leading-relaxed text-gray-400 sm:text-xs">
          Sample shell shown. Your own shape appears with your results.
        </p>
      </div>

      {/* Detail panel */}
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        aria-live={touched ? 'polite' : 'off'}
        className={`chitin-card relative overflow-hidden rounded-xl border-2 bg-gradient-to-b from-[#071014]/95 via-[#050b0e]/95 to-[#030709]/95 transition-[border-color,box-shadow] duration-500 ${hovering ? 'vd-autoplay-hold' : ''}`}
        style={{ borderColor: `${vec.color}66`, boxShadow: `0 0 40px ${vec.color}1f` }}
      >
        <div key={active} className="vd-panel-enter relative z-10 p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-black/40" style={{ color: vec.color, borderColor: `${vec.color}55` }}>
              <vec.Icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: vec.color }}>
                {vec.code} · {vec.dimension}
              </div>
              <h3 className="font-grotesk text-xl font-black uppercase leading-tight text-white sm:text-2xl">{vec.label}</h3>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-gray-300 sm:text-base">{vec.description}</p>

          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">The three questions behind it</div>
            <ol className="mt-3 space-y-2.5">
              {questions.map((question) => (
                <li key={question.id} className="flex gap-3 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                  <span className="mt-0.5 shrink-0 font-mono text-[11px] font-bold tabular-nums" style={{ color: vec.color }}>
                    Q{question.id.replace('q', '').padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] leading-snug text-gray-200 sm:text-sm">{question.prompt}</p>
                    <span className="mt-1 block text-[10px] uppercase tracking-wider text-gray-500">{FORMAT_LABEL[question.format]}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3 text-xs text-gray-300 sm:justify-between">
            <span className="hidden truncate sm:block">{vec.bullet}</span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => select(active - 1)}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-gray-200 transition-colors hover:border-white/30 hover:bg-white/[0.1]"
                aria-label="Previous vector"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-mono text-[11px] tabular-nums text-gray-400">
                {active + 1} / {VECTOR_COUNT}
              </span>
              <button
                type="button"
                onClick={() => select(active + 1)}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-gray-200 transition-colors hover:border-white/30 hover:bg-white/[0.1]"
                aria-label="Next vector"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {autoplay && (
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-white/5">
            <div
              key={`${active}-${hovering}`}
              className="vd-autoplay-bar h-full"
              style={{ backgroundColor: vec.color, ['--vd-autoplay' as string]: `${AUTOPLAY_MS}ms` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
