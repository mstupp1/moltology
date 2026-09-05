/**
 * ============================================================================
 * MARITIME DEFENSE COMMAND — SHARED PRESENTATION PRIMITIVES
 * Small, reusable building blocks for the Maritime Defense branch. Styled to
 * match the rest of the Organization page's light corporate design system
 * (white cards, sky-900 headings, #f8fbff insets, amber/emerald/rose status
 * accents) rather than a separate dark theme, so the branch reads as one
 * more section of the same institutional profile.
 * ============================================================================
 */
import React, { useId, useState } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'

/* -------------------------------------------------------------------------- */

export interface MaritimeHeadingProps {
  eyebrow: string
  eyebrowIcon?: LucideIcon
  title: React.ReactNode
  subtitle?: React.ReactNode
  align?: 'left' | 'center'
  id?: string
}

/** Matches the eyebrow / h2 / subtitle pattern used by every other section on the Org page. */
export const MaritimeHeading: React.FC<MaritimeHeadingProps> = ({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  subtitle,
  align = 'center',
  id,
}) => (
  <div className={`space-y-4 ${align === 'center' ? 'text-center' : 'text-left'}`}>
    <div
      className={`text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center gap-2 ${
        align === 'center' ? 'justify-center' : ''
      }`}
    >
      {EyebrowIcon ? <EyebrowIcon className="w-4 h-4" aria-hidden="true" /> : null}
      <span>{eyebrow}</span>
    </div>
    <h2
      id={id}
      className="text-3xl sm:text-4xl lg:text-[2.5rem] font-grotesk font-bold text-sky-900 uppercase tracking-tight leading-[1.1]"
    >
      {title}
    </h2>
    {subtitle ? (
      <p
        className={`text-sm sm:text-base text-slate-600 leading-relaxed ${
          align === 'center' ? 'max-w-3xl mx-auto' : 'max-w-2xl'
        }`}
      >
        {subtitle}
      </p>
    ) : null}
  </div>
)

/* -------------------------------------------------------------------------- */

export interface ClassificationStampProps {
  label: string
  tone?: 'amber' | 'rose' | 'sky' | 'slate' | 'emerald'
  className?: string
}

const STAMP_TONES: Record<NonNullable<ClassificationStampProps['tone']>, string> = {
  amber: 'text-amber-800 bg-amber-100 border-amber-200',
  rose: 'text-rose-700 bg-rose-50 border-rose-200',
  sky: 'text-sky-700 bg-sky-50 border-sky-200',
  slate: 'text-slate-700 bg-slate-100 border-slate-300',
  emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
}

/** A rounded status pill, matching the "14 OPEN" / compliance-badge convention used elsewhere on the page. */
export const ClassificationStamp: React.FC<ClassificationStampProps> = ({
  label,
  tone = 'amber',
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-2 px-3 py-1 border rounded-full text-[10px] sm:text-[11px] font-grotesk font-extrabold uppercase tracking-wider ${STAMP_TONES[tone]} ${className}`}
  >
    {label}
  </span>
)

/* -------------------------------------------------------------------------- */

/**
 * A redacted line of a document: a solid bar over the text, like a marker over
 * printed paper. The underlying text stays in the accessibility tree; the bar
 * is a real toggle so keyboard and touch users can reveal it too.
 */
export const Redacted: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const [revealed, setRevealed] = useState(false)

  return (
    <button
      type="button"
      onClick={() => setRevealed((v) => !v)}
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      aria-expanded={revealed}
      className={`group inline-flex max-w-full items-center rounded px-1.5 py-0.5 text-left align-middle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
        revealed ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-slate-800 text-transparent'
      } ${className}`}
    >
      <span className="truncate">{children}</span>
    </button>
  )
}

/* -------------------------------------------------------------------------- */

export const TelemetryRow: React.FC<{
  label: string
  value: React.ReactNode
  tone?: string
}> = ({ label, value, tone = 'text-sky-700' }) => (
  <div className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2 last:border-b-0">
    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 shrink-0">
      {label}
    </span>
    <span className={`text-[11px] sm:text-xs font-grotesk font-bold text-right ${tone}`}>{value}</span>
  </div>
)

/* -------------------------------------------------------------------------- */

/** A slim amber hazard band used to mark a restricted or classified panel header. */
export const WarningStripe: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`h-1.5 w-full rounded-full opacity-80 ${className}`}
    style={{
      backgroundImage:
        'repeating-linear-gradient(135deg, rgba(245,158,11,0.9) 0px, rgba(245,158,11,0.9) 10px, rgba(255,255,255,0.9) 10px, rgba(255,255,255,0.9) 20px)',
    }}
  />
)

/* -------------------------------------------------------------------------- */

/**
 * Decorative sonar plate. A self-contained instrument graphic (dark by
 * convention, like a radar screen or a photograph), always presented inside
 * light card chrome rather than as a page background. Motion is suppressed
 * for reduced-motion users.
 */
export const SonarPlate: React.FC<{ className?: string; label?: string }> = ({
  className = '',
  label,
}) => (
  <div
    aria-hidden="true"
    className={`relative aspect-square w-full overflow-hidden rounded-full border-4 border-white shadow-lg shadow-sky-100 bg-[#08222c] ${className}`}
  >
    <div className="absolute inset-[12%] rounded-full border border-cyan-400/25" />
    <div className="absolute inset-[28%] rounded-full border border-cyan-400/25" />
    <div className="absolute inset-[44%] rounded-full border border-cyan-400/25" />
    <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-400/15" />
    <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-cyan-400/15" />
    <div
      className="absolute inset-0 animate-spin motion-reduce:animate-none"
      style={{
        animationDuration: '5s',
        background:
          'conic-gradient(from 0deg, rgba(34,211,238,0) 0deg, rgba(34,211,238,0) 300deg, rgba(34,211,238,0.30) 355deg, rgba(34,211,238,0.55) 360deg)',
      }}
    />
    <span className="absolute left-[62%] top-[38%] h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
    <span className="absolute left-[34%] top-[63%] h-1 w-1 rounded-full bg-emerald-300/80" />
    {label ? (
      <span className="absolute bottom-3 left-0 right-0 text-center text-[9px] font-bold uppercase tracking-[0.24em] text-cyan-300/80">
        {label}
      </span>
    ) : null}
  </div>
)

/* -------------------------------------------------------------------------- */

export interface ExpandablePanelProps {
  title: string
  eyebrow?: string
  icon?: LucideIcon
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  triggerClassName?: string
}

/** An intelligence panel that expands in place. Wired to real state, never decorative. */
export const ExpandablePanel: React.FC<ExpandablePanelProps> = ({
  title,
  eyebrow,
  icon: Icon,
  children,
  defaultOpen = false,
  className = '',
  triggerClassName = '',
}) => {
  const [open, setOpen] = useState(defaultOpen)
  const regionId = useId()

  return (
    <div className={`rounded-2xl border border-sky-100 bg-white overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={regionId}
        className={`flex w-full items-center gap-3 px-4 sm:px-5 py-4 text-left transition-colors hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400 ${triggerClassName}`}
      >
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" /> : null}
        <span className="min-w-0 flex-1">
          {eyebrow ? (
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{eyebrow}</span>
          ) : null}
          <span className="block text-xs sm:text-sm font-grotesk font-bold uppercase tracking-wide text-sky-900">
            {title}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div id={regionId} hidden={!open} className="border-t border-sky-100 px-4 sm:px-5 py-4">
        {children}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/** Specimen diagram of the primary maritime adversary. Pure inline vector. */
export const OctopusSpecimenDiagram: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 320 320"
    className={className}
    role="img"
    aria-label="Specimen diagram of an octopus with eight labelled appendages, mantle, and beak."
  >
    <defs>
      <radialGradient id="mdc-specimen-mantle" cx="50%" cy="38%" r="62%">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
        <stop offset="70%" stopColor="#9a3412" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#0b1a22" stopOpacity="0.05" />
      </radialGradient>
    </defs>

    {/* Measurement grid */}
    <rect x="0" y="0" width="320" height="320" fill="#0d2430" />
    <g stroke="rgba(148,197,214,0.16)" strokeWidth="1">
      {[40, 80, 120, 160, 200, 240, 280].map((v) => (
        <line key={`h-${v}`} x1="12" y1={v} x2="308" y2={v} />
      ))}
      {[40, 80, 120, 160, 200, 240, 280].map((v) => (
        <line key={`v-${v}`} x1={v} y1="12" x2={v} y2="308" />
      ))}
    </g>
    <rect x="12" y="12" width="296" height="296" fill="none" stroke="rgba(148,197,214,0.4)" strokeWidth="1" />

    {/* Arms */}
    <g fill="none" stroke="#fb923c" strokeWidth="5" strokeLinecap="round" opacity="0.9">
      <path d="M160 176 C 128 200, 96 206, 74 246" />
      <path d="M160 176 C 134 208, 118 236, 116 276" />
      <path d="M160 176 C 152 214, 148 246, 156 284" />
      <path d="M160 176 C 172 212, 186 240, 200 274" />
      <path d="M160 176 C 190 200, 216 212, 246 240" />
      <path d="M160 176 C 196 186, 226 184, 258 168" />
      <path d="M160 176 C 122 188, 92 186, 62 168" />
      <path d="M160 176 C 138 192, 108 226, 96 258" />
    </g>

    {/* Mantle */}
    <ellipse cx="160" cy="120" rx="60" ry="70" fill="url(#mdc-specimen-mantle)" stroke="#fb923c" strokeWidth="2.5" />
    {/* Eyes */}
    <ellipse cx="138" cy="132" rx="13" ry="9" fill="#0b1a22" stroke="#fdba74" strokeWidth="2" />
    <ellipse cx="182" cy="132" rx="13" ry="9" fill="#0b1a22" stroke="#fdba74" strokeWidth="2" />
    <rect x="133" y="130" width="10" height="3" rx="1.5" fill="#fdba74" />
    <rect x="177" y="130" width="10" height="3" rx="1.5" fill="#fdba74" />
    {/* Beak marker */}
    <circle cx="160" cy="176" r="7" fill="none" stroke="#fb7185" strokeWidth="2" />
    <circle cx="160" cy="176" r="2" fill="#fb7185" />

    {/* Callouts */}
    <g stroke="rgba(148,197,214,0.6)" strokeWidth="1" fill="none">
      <path d="M212 96 L 262 76" />
      <path d="M108 132 L 46 112" />
      <path d="M168 183 L 214 208" />
    </g>
    <g
      fill="#bae6fd"
      fontSize="11"
      fontFamily="Space Grotesk, sans-serif"
      letterSpacing="1.2"
      style={{ textTransform: 'uppercase' }}
    >
      <text x="248" y="68">MANTLE</text>
      <text x="22" y="104">EYE · ACUTE</text>
      <text x="204" y="224">BEAK · ENTRY</text>
    </g>
    <text
      x="22"
      y="300"
      fill="rgba(186,230,253,0.6)"
      fontSize="10"
      fontFamily="Space Grotesk, sans-serif"
      letterSpacing="1.6"
    >
      FIG. 1 · OCA/8-ARM · NOT TO SCALE
    </text>
  </svg>
)
