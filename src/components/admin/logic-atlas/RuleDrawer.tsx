import React, { useEffect, useMemo, useRef } from 'react'
import { ArrowLeft, CodeXml, ExternalLink, FlaskConical, History, Maximize2, Network, Workflow, X } from 'lucide-react'
import { shortDate } from '@/lib/logic-atlas/filter'
import { RULE_KIND_HINTS, type AtlasRule, type LogicAtlas } from '@/lib/logic-atlas/types'
import { DomainChip, DriftBadge, FlagCallout, KindTag, StatusTag } from './atlas-ui'
import { FlowDiagram } from './FlowDiagram'

export interface RuleDrawerProps {
  atlas: LogicAtlas
  rule: AtlasRule
  onClose: () => void
  onSelectRule: (ruleId: string) => void
  onOpenDecision: (decisionId: string) => void
  onExpandFlow: () => void
  /** While the large flow view is open, Escape closes that first. */
  escapeClosesDrawer: boolean
}

function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </h3>
  )
}

export function RuleDrawer({
  atlas,
  rule,
  onClose,
  onSelectRule,
  onOpenDecision,
  onExpandFlow,
  escapeClosesDrawer,
}: RuleDrawerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const domain = atlas.domains.find((item) => item.id === rule.domain)
  const ruleById = useMemo(() => new Map(atlas.rules.map((item) => [item.id, item])), [atlas])
  const domainColor = useMemo(() => new Map(atlas.domains.map((item) => [item.id, item.color])), [atlas])
  const decisions = useMemo(
    () =>
      rule.decisions
        .map((id) => atlas.decisions.find((decision) => decision.id === id))
        .filter((decision): decision is NonNullable<typeof decision> => Boolean(decision))
        .reverse(),
    [rule, atlas.decisions],
  )

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: 0 })
  }, [rule.id])

  useEffect(() => {
    if (!escapeClosesDrawer) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, escapeClosesDrawer])

  const relationChip = (id: string) => {
    const related = ruleById.get(id)
    if (!related) return null
    return (
      <button
        key={id}
        type="button"
        onClick={() => onSelectRule(id)}
        className="flex w-full items-center gap-2 rounded-control border border-line-subtle bg-surface-2 px-2.5 py-2 text-left text-xs text-ink-body transition-colors hover:border-line-hover hover:bg-surface-3 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
      >
        <span className="h-2 w-2 shrink-0 rotate-45" style={{ background: domainColor.get(related.domain) }} aria-hidden />
        <span className="truncate">{related.title}</span>
      </button>
    )
  }

  return (
    <aside
      className="absolute inset-0 z-10 flex flex-col border-l border-line bg-surface-1/[0.97] shadow-menu backdrop-blur-sm min-[900px]:left-auto min-[900px]:w-[440px]"
      aria-label={`Rule: ${rule.title}`}
      data-testid="atlas-rule-drawer"
    >
      <div className="flex items-center justify-between gap-2 border-b border-line-subtle bg-surface-2 px-4 py-2.5">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-control px-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted hover:bg-surface-3 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow min-[900px]:hidden"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to map
        </button>
        {domain ? <DomainChip title={domain.title} color={domain.color} /> : null}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close rule details"
          className="hidden h-9 w-9 items-center justify-center rounded-control text-ink-muted hover:bg-surface-3 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow min-[900px]:inline-flex"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <header>
          <div className="flex flex-wrap items-center gap-2">
            <KindTag kind={rule.kind} />
            <StatusTag status={rule.status} />
          </div>
          <h2 className="mt-2 font-grotesk text-xl font-bold leading-tight text-ink">{rule.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-body">{rule.statement}</p>
          <p className="mt-2 text-[11px] text-ink-muted">
            {RULE_KIND_HINTS[rule.kind]} · <span className="font-mono">{rule.id}</span>
          </p>
        </header>

        {rule.flag ? <FlagCallout flag={rule.flag} /> : null}

        {rule.flow ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle icon={Workflow}>How it flows</SectionTitle>
              <button
                type="button"
                onClick={onExpandFlow}
                className="inline-flex min-h-[32px] items-center gap-1.5 rounded-control text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-glow hover:text-cyan-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              >
                <Maximize2 className="h-3 w-3" />
                Open large
              </button>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={onExpandFlow}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onExpandFlow()
                }
              }}
              aria-label={`Open the ${rule.title} flow diagram`}
              className="block w-full cursor-zoom-in transition-opacity hover:opacity-90 rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              <FlowDiagram flow={rule.flow} />
            </div>
          </section>
        ) : null}

        {rule.anchors.length > 0 ? (
          <section className="space-y-2">
            <SectionTitle icon={CodeXml}>In the code</SectionTitle>
            <ul className="space-y-2">
              {rule.anchors.map((anchor) => (
                <li key={`${anchor.file}#${anchor.symbol}`} className="rounded-card border border-line-subtle bg-surface-2">
                  <div className="flex items-center justify-between gap-2 px-2.5 pt-2">
                    <span className="truncate font-mono text-[12px] font-semibold text-ink">{anchor.symbol}</span>
                    <DriftBadge drift={anchor.drift} />
                  </div>
                  {anchor.value ? (
                    <pre className="mx-2.5 mt-1.5 whitespace-pre-wrap break-words rounded-control bg-abyss px-2 py-1.5 font-mono text-[11px] leading-relaxed text-ink-body">
                      {anchor.value}
                    </pre>
                  ) : null}
                  <a
                    href={anchor.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-2 font-mono text-[11px] text-ink-muted hover:text-cyan-glow"
                  >
                    <span className="truncate">
                      {anchor.file}
                      {anchor.line ? `:${anchor.line}` : ''}
                    </span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {rule.dependsOn.length > 0 || rule.usedBy.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rule.dependsOn.length > 0 ? (
              <div className="min-w-0 space-y-1.5">
                <SectionTitle icon={Network}>Relies on</SectionTitle>
                {rule.dependsOn.map(relationChip)}
              </div>
            ) : null}
            {rule.usedBy.length > 0 ? (
              <div className="min-w-0 space-y-1.5">
                <SectionTitle icon={Network}>Used by</SectionTitle>
                {rule.usedBy.map(relationChip)}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="space-y-2">
          <SectionTitle icon={History}>Decisions</SectionTitle>
          {decisions.length === 0 ? (
            <p className="text-xs text-ink-muted">No decision records point at this rule yet.</p>
          ) : (
            <ol className="relative space-y-2 border-l border-line-subtle pl-3">
              {decisions.map((decision) => (
                <li key={decision.id} className="relative">
                  <span
                    className="absolute -left-[17px] top-3 h-2 w-2 rotate-45"
                    style={{ background: domainColor.get(decision.domains[0]) ?? '#00c3ff' }}
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => onOpenDecision(decision.id)}
                    className="w-full rounded-card border border-line-subtle bg-surface-2 px-3 py-2 text-left transition-colors hover:border-line-hover hover:bg-surface-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                      {shortDate(decision.date)}
                    </span>
                    <span className="mt-0.5 block text-[13px] font-semibold text-ink">{decision.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink-muted">{decision.summary}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        {rule.tests.length > 0 ? (
          <section className="space-y-2">
            <SectionTitle icon={FlaskConical}>Covered by tests</SectionTitle>
            <ul className="space-y-1">
              {rule.tests.map((test) => (
                <li key={test.file}>
                  <a
                    href={test.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-1.5 font-mono text-[11px] text-ink-muted hover:text-cyan-glow"
                  >
                    <span className="truncate">{test.file}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </aside>
  )
}
