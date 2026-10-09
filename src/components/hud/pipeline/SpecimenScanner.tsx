import React from 'react'
import { cn } from '@/lib/utils'
import { MAX_DEPTH_M, PIPELINE_CLEARANCES, type Clearance, type ClearanceStatus } from '@/lib/pipeline-explorer'
import {
  SCAN_LENSES,
  metricReadings,
  stageAccent,
  stageArtUrl,
  stageName,
  type MetricKey,
  type ScanLens,
} from './shared'

interface SpecimenScannerProps {
  clearance: Clearance
  status: ClearanceStatus
  lens: ScanLens
  onLensChange: (lens: ScanLens) => void
  activeMetric: MetricKey | null
  onActiveMetricChange: (metric: MetricKey | null) => void
}

const RING_RADII = [56, 104, 152]
const ARC_RADIUS = 178
const ARC_LENGTH = 2 * Math.PI * ARC_RADIUS
const TICKS = Array.from({ length: 72 }, (_, i) => i)

/**
 * The scan chamber: the stage specimen under a rotating sonar sweep, with a ring that fills to
 * the clearance's Shell Hardness and three hotspots that read out each typical reading.
 */
export function SpecimenScanner({
  clearance,
  status,
  lens,
  onLensChange,
  activeMetric,
  onActiveMetricChange,
}: SpecimenScannerProps) {
  const accent = stageAccent(clearance.stageNum)
  const readings = metricReadings(clearance)
  const hardness = clearance.sub.shellHardnessTarget / 100
  const subIndex = clearance.stage.subStages.findIndex((s) => s.code === clearance.code)
  const lensFilter = SCAN_LENSES.find((l) => l.value === lens)?.filter ?? 'none'
  const depthDarkness = clearance.depthToM / MAX_DEPTH_M

  const lensKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = SCAN_LENSES[(index + step + SCAN_LENSES.length) % SCAN_LENSES.length]
    onLensChange(next.value)
    const group = event.currentTarget.parentElement
    group?.querySelector<HTMLButtonElement>(`[data-lens="${next.value}"]`)?.focus()
  }

  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-card border border-line-subtle bg-abyss xl:aspect-auto xl:min-h-[480px] xl:flex-1 [container-type:size]"
      style={
        {
          '--scan-accent': `rgba(${accent.rgb}, 0.28)`,
          background: `radial-gradient(circle at 50% 46%, rgba(${accent.rgb}, 0.16), transparent 58%), linear-gradient(to bottom, rgba(0, 195, 255, ${(0.1 * (1 - depthDarkness)).toFixed(3)}), rgba(3, 7, 8, 1) 80%)`,
        } as React.CSSProperties
      }
    >
      {/* A square scan field centred in the chamber, whatever the chamber's shape. */}
      <div
        className="absolute inset-0 m-auto"
        style={{ width: 'min(100cqw, 100cqh)', height: 'min(100cqw, 100cqh)' }}
      >
      {/* Sonar rings, crosshair, bearing ticks and the hardness ring. */}
      <svg aria-hidden="true" viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
        {RING_RADII.map((r) => (
          <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="rgba(150,170,170,0.14)" strokeWidth="1" />
        ))}
        <line x1="200" y1="14" x2="200" y2="386" stroke="rgba(150,170,170,0.1)" strokeDasharray="2 6" />
        <line x1="14" y1="200" x2="386" y2="200" stroke="rgba(150,170,170,0.1)" strokeDasharray="2 6" />
        {TICKS.map((i) => {
          const angle = (i / TICKS.length) * Math.PI * 2
          const inner = i % 6 === 0 ? 186 : 190
          return (
            <line
              key={i}
              x1={200 + Math.cos(angle) * inner}
              y1={200 + Math.sin(angle) * inner}
              x2={200 + Math.cos(angle) * 194}
              y2={200 + Math.sin(angle) * 194}
              stroke="rgba(150,170,170,0.3)"
              strokeWidth="1"
            />
          )
        })}
        <circle cx="200" cy="200" r={ARC_RADIUS} fill="none" stroke="rgba(150,170,170,0.12)" strokeWidth="3" />
        <circle
          className="pipeline-arc"
          cx="200"
          cy="200"
          r={ARC_RADIUS}
          fill="none"
          stroke={accent.hex}
          strokeWidth="3"
          strokeLinecap="butt"
          strokeDasharray={ARC_LENGTH}
          strokeDashoffset={ARC_LENGTH * (1 - hardness)}
          transform="rotate(-90 200 200)"
        />
      </svg>

      <div aria-hidden="true" className="pipeline-sweep absolute inset-[5%]" />

      <div key={clearance.stage.stageNum} className="pipeline-specimen absolute left-[15%] top-[15%] h-[70%] w-[70%]">
        <img
          src={stageArtUrl(clearance.stage.img)}
          alt={`${stageName(clearance.stage.stageTitle).toLowerCase()} specimen`}
          width={1024}
          height={1024}
          decoding="async"
          className="pipeline-specimen-art h-full w-full object-contain"
          style={{ transform: `scale(${0.86 + subIndex * 0.08})`, filter: lensFilter }}
        />
      </div>

      </div>

      <div aria-hidden="true" key={clearance.code} className="pipeline-scan-pass absolute inset-x-0 top-0" />

      {/* Readout text over the chamber. */}
      <div className="pointer-events-none absolute left-3 top-3 sm:left-4 sm:top-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
          Scan {String(clearance.index + 1).padStart(2, '0')}/{PIPELINE_CLEARANCES.length}
        </div>
        <div className={cn('font-grotesk text-2xl font-extrabold tracking-[0.06em] sm:text-3xl', accent.text)}>
          {clearance.code}
        </div>
      </div>
      <div className="pointer-events-none absolute right-3 top-3 text-right sm:right-4 sm:top-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Depth</div>
        <div className="font-grotesk text-sm font-bold text-ink sm:text-base">{readings[2].value}</div>
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 text-right sm:bottom-4 sm:right-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Hardness</div>
        <div className="font-grotesk text-sm font-bold sm:text-base" style={{ color: accent.hex }}>
          {readings[0].value}
        </div>
      </div>
      {status === 'current' ? (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-chip bg-crimson-aggro px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-abyss sm:top-4">
          You are here
        </div>
      ) : null}

      <div
        role="radiogroup"
        aria-label="Scan lens"
        className="absolute bottom-3 left-3 flex rounded-control border border-line-subtle bg-abyss/80 p-0.5 sm:bottom-4 sm:left-4"
      >
        {SCAN_LENSES.map((option, index) => {
          const checked = option.value === lens
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={checked}
              data-lens={option.value}
              tabIndex={checked ? 0 : -1}
              onClick={() => onLensChange(option.value)}
              onKeyDown={(event) => lensKeyDown(event, index)}
              className={cn(
                'min-h-8 rounded-chip px-2 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-glow',
                checked ? 'bg-surface-3 text-ink' : 'text-ink-muted hover:text-ink'
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {/* Hotspots: one per typical reading, placed on the same square field. */}
      <div
        className="pointer-events-none absolute inset-0 m-auto"
        style={{ width: 'min(100cqw, 100cqh)', height: 'min(100cqw, 100cqh)' }}
      >
      {readings.map((reading) => {
        const open = activeMetric === reading.key
        const flipLeft = reading.spot.x > 55
        return (
          <div
            key={reading.key}
            className="pointer-events-auto absolute"
            style={{ left: `${reading.spot.x}%`, top: `${reading.spot.y}%` }}
          >
            <button
              type="button"
              aria-expanded={open}
              aria-label={`Scan ${reading.label}`}
              onClick={() => onActiveMetricChange(open ? null : reading.key)}
              className="group absolute left-0 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"
            >
              <span
                aria-hidden="true"
                className="pipeline-hotspot-ping absolute left-1/2 top-1/2 h-4 w-4 rounded-full border"
                style={{ borderColor: accent.hex }}
              />
              <span
                aria-hidden="true"
                className="relative h-2.5 w-2.5 rounded-full ring-2 ring-abyss transition-transform group-hover:scale-125"
                style={{ background: accent.hex }}
              />
            </button>
            {open ? (
              <div
                className={cn(
                  'pointer-events-none absolute top-0 z-20 w-44 -translate-y-1/2 rounded-card border bg-surface-1/95 p-2.5 shadow-menu sm:w-52',
                  flipLeft ? 'right-6' : 'left-6'
                )}
                style={{ borderColor: `rgba(${accent.rgb}, 0.5)` }}
              >
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">{reading.label}</div>
                <div className="font-grotesk text-base font-bold text-ink">{reading.value}</div>
                <div className="text-[11px] leading-snug text-ink-body">{reading.meaning}</div>
              </div>
            ) : null}
          </div>
        )
      })}
      </div>
    </div>
  )
}
