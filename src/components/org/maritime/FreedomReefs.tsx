/**
 * FREEDOM REEFS
 * Installation registry plotted on a lightweight static tactical chart.
 * No mapping dependency: the plot is inline vector plus positioned markers.
 */
import React, { useState } from 'react'
import { Anchor, MapPin, Navigation, Waves } from 'lucide-react'
import { REEF_SITES, type ReefSite } from './data'
import { MaritimeHeading, TelemetryRow } from './primitives'

/**
 * The chart itself stays dark, like the photographs used elsewhere on the
 * page (a soundings chart is conventionally dark) — but it is framed in the
 * same light card border as every other image on the Org page.
 */
const TacticalChart: React.FC<{
  sites: ReefSite[]
  selectedId: string
  onSelect: (id: string) => void
}> = ({ sites, selectedId, onSelect }) => (
  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-sky-100 shadow-xl shadow-sky-100 bg-[#04121a] sm:aspect-[16/10]">
    {/* Chart substrate */}
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mdc-chart-depth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b2a38" />
          <stop offset="100%" stopColor="#020a10" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#mdc-chart-depth)" />
      <g stroke="rgba(34,211,238,0.10)" strokeWidth="0.75">
        {Array.from({ length: 15 }, (_, i) => (
          <line key={`gx-${i}`} x1={i * 26.6} y1="0" x2={i * 26.6} y2="300" />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`gy-${i}`} x1="0" y1={i * 26.6} x2="400" y2={i * 26.6} />
        ))}
      </g>
      {/* Coastline and depth contours */}
      <path
        d="M0 40 C 60 58, 96 26, 148 44 C 204 63, 240 30, 300 52 C 344 68, 372 50, 400 62"
        fill="none"
        stroke="rgba(52,211,153,0.45)"
        strokeWidth="1.6"
      />
      <path
        d="M0 96 C 72 116, 120 82, 180 106 C 246 132, 300 96, 400 122"
        fill="none"
        stroke="rgba(34,211,238,0.22)"
        strokeWidth="1"
        strokeDasharray="5 6"
      />
      <path
        d="M0 178 C 88 200, 148 164, 214 190 C 288 218, 336 186, 400 208"
        fill="none"
        stroke="rgba(34,211,238,0.16)"
        strokeWidth="1"
        strokeDasharray="5 6"
      />
      <path
        d="M0 254 C 96 274, 168 240, 240 264 C 312 288, 356 262, 400 278"
        fill="none"
        stroke="rgba(34,211,238,0.12)"
        strokeWidth="1"
        strokeDasharray="5 6"
      />
      <text x="8" y="292" fill="rgba(148,163,184,0.5)" fontSize="8" letterSpacing="1.4" fontFamily="Space Grotesk, sans-serif">
        MDC TACTICAL PLOT · SECTORS 01-12 · SOUNDINGS IN METRES
      </text>
    </svg>

    {/* Site markers */}
    {sites.map((site) => {
      const isSelected = site.id === selectedId
      return (
        <button
          key={site.id}
          type="button"
          onClick={() => onSelect(site.id)}
          aria-pressed={isSelected}
          className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
          style={{ left: `${site.x}%`, top: `${site.y}%` }}
        >
          <span className="sr-only">
            {site.name}, {site.sector}, status {site.status}
          </span>
          {isSelected ? (
            <span
              aria-hidden="true"
              className={`absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full ${site.markerTone} opacity-25 animate-ping motion-reduce:animate-none`}
            />
          ) : null}
          <span
            aria-hidden="true"
            className={`relative flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all group-hover:scale-125 group-focus-visible:ring-2 group-focus-visible:ring-sky-300 ${
              isSelected ? 'border-white scale-125' : 'border-white/50'
            } ${site.markerTone}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#04121a]" />
          </span>
          <span
            className={`pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 font-grotesk text-[9px] font-bold uppercase tracking-[0.14em] transition-opacity ${
              isSelected ? 'bg-black/70 text-white opacity-100' : 'bg-black/50 text-slate-300 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
            }`}
          >
            {site.name}
          </span>
        </button>
      )
    })}
  </div>
)

export const FreedomReefs: React.FC = () => {
  const [selectedId, setSelectedId] = useState(REEF_SITES[0].id)
  const selected = REEF_SITES.find((s) => s.id === selectedId) ?? REEF_SITES[0]

  return (
    <section aria-labelledby="mdc-freedom-reefs" className="space-y-10">
      <MaritimeHeading
        id="mdc-freedom-reefs"
        eyebrow="DIV-05 · BUREAU OF SHELL INFRASTRUCTURE"
        eyebrowIcon={Anchor}
        title="FREEDOM REEFS"
        subtitle="Restoration and defensive reef installations under Moltology sponsorship. Select a marker to open the site record."
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <TacticalChart sites={REEF_SITES} selectedId={selectedId} onSelect={setSelectedId} />

          {/* Registry list doubles as the accessible, mobile-first selector */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {REEF_SITES.map((site) => (
              <button
                key={site.id}
                type="button"
                onClick={() => setSelectedId(site.id)}
                aria-pressed={site.id === selectedId}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  site.id === selectedId
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-sky-100 bg-white hover:border-sky-300'
                }`}
              >
                <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${site.markerTone}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-grotesk text-[11px] font-bold uppercase tracking-wide text-sky-900">
                    {site.name}
                  </span>
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-slate-500">{site.sector}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Site record */}
        <div className="lg:col-span-5">
          <div className="flex h-full flex-col gap-5 rounded-3xl border border-sky-100 bg-white p-6 shadow-xl shadow-sky-100 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 font-grotesk text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                INSTALLATION RECORD
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${selected.statusTone}`}
              >
                {selected.status}
              </span>
            </div>

            <h3 className="font-grotesk text-2xl font-bold uppercase leading-tight tracking-tight text-sky-900">
              {selected.name}
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">{selected.summary}</p>

            <div className="rounded-2xl border border-sky-100 bg-[#f8fbff] px-4 py-2">
              <TelemetryRow label="Sector" value={selected.sector} />
              <TelemetryRow label="Bearing" value={selected.bearing} />
              <TelemetryRow label="Working depth" value={selected.depth} />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">WORKS IN PROGRESS</p>
              <ul className="space-y-2">
                {selected.works.map((work) => (
                  <li
                    key={work}
                    className="flex items-start gap-2 rounded-xl border border-sky-100 bg-[#f8fbff] px-3 py-2 text-xs text-slate-600"
                  >
                    <Waves className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden="true" />
                    <span className="leading-snug">{work}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-auto flex items-center gap-2 border-t border-sky-100 pt-4 text-[10px] uppercase tracking-[0.16em] text-slate-500">
              <Navigation className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              PLOT POSITIONS ARE SCHEMATIC AND NOT FOR NAVIGATION
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
