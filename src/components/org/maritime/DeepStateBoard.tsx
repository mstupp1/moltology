/**
 * THE DEEP STATE IS LITERALLY DEEP
 * Open investigation board, styled as a literal cork-and-parchment board
 * rather than a hacker terminal — index cards, red string, and pins on a
 * warm, light surface that matches the rest of the Org page.
 */
import React, { useState } from 'react'
import { FileSearch, Network, Pin } from 'lucide-react'
import { EVIDENCE_LINKS, EVIDENCE_NODES, MARITIME_SLOGANS, type EvidenceNode } from './data'
import { ClassificationStamp, MaritimeHeading, Redacted } from './primitives'

const NODE_BY_ID = new Map(EVIDENCE_NODES.map((n) => [n.id, n]))

const ExhibitCard: React.FC<{
  node: EvidenceNode
  isActive: boolean
  isLinked: boolean
  onFocusNode: (id: string | null) => void
}> = ({ node, isActive, isLinked, onFocusNode }) => {
  const Icon = node.icon
  return (
    <button
      type="button"
      onClick={() => onFocusNode(isActive ? null : node.id)}
      onMouseEnter={() => onFocusNode(node.id)}
      onMouseLeave={() => onFocusNode(null)}
      onFocus={() => onFocusNode(node.id)}
      onBlur={() => onFocusNode(null)}
      aria-pressed={isActive}
      className={`absolute w-[176px] -translate-x-1/2 -translate-y-1/2 rounded-sm border bg-white p-3 text-left shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
        isActive
          ? 'z-20 border-rose-400 shadow-lg scale-[1.05]'
          : isLinked
            ? 'z-10 border-rose-300'
            : 'z-10 border-slate-200 hover:border-rose-200'
      }`}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      <span
        aria-hidden="true"
        className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-rose-600 bg-rose-500 shadow"
      />
      <span className="flex items-center justify-between gap-2">
        <span className="font-grotesk text-[9px] font-bold uppercase tracking-[0.18em] text-rose-700">
          {node.exhibit}
        </span>
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      </span>
      <span className="mt-1.5 block font-grotesk text-[11px] font-bold uppercase leading-tight text-sky-900">
        {node.title}
      </span>
      <span className="mt-1.5 block text-[10px] leading-snug text-slate-500">{node.note}</span>
      {node.redacted ? (
        <span className="mt-2 block">
          <Redacted className="text-[9px]">{node.redacted}</Redacted>
        </span>
      ) : null}
      <span className="mt-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {node.timestamp}
      </span>
    </button>
  )
}

export const DeepStateBoard: React.FC = () => {
  const [focusId, setFocusId] = useState<string | null>(null)

  const linkedIds = new Set<string>()
  if (focusId) {
    EVIDENCE_LINKS.forEach(([a, b]) => {
      if (a === focusId) linkedIds.add(b)
      if (b === focusId) linkedIds.add(a)
    })
  }

  return (
    <section aria-labelledby="mdc-deep-state" className="space-y-10">
      <MaritimeHeading
        id="mdc-deep-state"
        eyebrow="OPEN INVESTIGATION · FILE DS-11"
        eyebrowIcon={FileSearch}
        title={MARITIME_SLOGANS.deepState}
        subtitle="Nine exhibits. Fourteen connections. No conclusions have been drawn, and none are being drawn here."
      />

      <div className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-xl shadow-rose-100/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 bg-rose-50/60 px-5 sm:px-8 py-4">
          <span className="inline-flex items-center gap-2 font-grotesk text-[11px] font-bold uppercase tracking-[0.18em] text-rose-800">
            <Network className="h-4 w-4" aria-hidden="true" />
            EVIDENCE BOARD · SELECT AN EXHIBIT TO TRACE ITS CONNECTIONS
          </span>
          <ClassificationStamp label="UNRESOLVED" tone="rose" />
        </div>

        {/* Board canvas — scrolls horizontally rather than compressing on mobile */}
        <div className="overflow-x-auto touch-pan-scroll">
          <div className="relative mx-auto h-[620px] w-[860px] p-4">
            <div
              aria-hidden="true"
              className="absolute inset-4 rounded-2xl border border-amber-100 bg-[#fbf3e3]"
            />

            {/* String */}
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
              {EVIDENCE_LINKS.map(([aId, bId]) => {
                const a = NODE_BY_ID.get(aId)
                const b = NODE_BY_ID.get(bId)
                if (!a || !b) return null
                const isLit = focusId === aId || focusId === bId
                return (
                  <line
                    key={`${aId}-${bId}`}
                    x1={`${a.x}%`}
                    y1={`${a.y}%`}
                    x2={`${b.x}%`}
                    y2={`${b.y}%`}
                    stroke={isLit ? 'rgba(225,29,72,0.9)' : 'rgba(225,29,72,0.35)'}
                    strokeWidth={isLit ? 1.8 : 1}
                    className="transition-[stroke,stroke-width] duration-200"
                  />
                )
              })}
            </svg>

            {EVIDENCE_NODES.map((node) => (
              <ExhibitCard
                key={node.id}
                node={node}
                isActive={focusId === node.id}
                isLinked={linkedIds.has(node.id)}
                onFocusNode={setFocusId}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4 border-t border-rose-100 px-6 sm:px-10 py-8 text-center">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            <Pin className="h-3.5 w-3.5" aria-hidden="true" />
            NO FINDING HAS BEEN ENTERED · FILE REMAINS OPEN
          </p>
          <p className="font-grotesk text-2xl sm:text-4xl font-bold uppercase leading-tight tracking-tight text-rose-700">
            WE&rsquo;RE JUST ASKING QUESTIONS.
          </p>
        </div>
      </div>
    </section>
  )
}
