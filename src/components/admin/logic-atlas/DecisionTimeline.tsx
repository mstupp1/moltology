import React, { useEffect, useMemo, useRef } from 'react'
import { ChevronDown, ExternalLink, FileText, GitCommitHorizontal, GitPullRequest, ScrollText } from 'lucide-react'
import { decisionMatches, groupDecisionsByMonth, shortDate, type AtlasFilter } from '@/lib/logic-atlas/filter'
import type { AtlasDecision, AtlasSource, LogicAtlas } from '@/lib/logic-atlas/types'
import { DomainChip } from './atlas-ui'

export interface DecisionTimelineProps {
  atlas: LogicAtlas
  filter: AtlasFilter
  selectedDecisionId: string | null
  onSelectDecision: (decisionId: string | null) => void
  onOpenRule: (ruleId: string) => void
}

const SOURCE_ICONS: Record<AtlasSource['kind'], React.ComponentType<{ className?: string }>> = {
  pr: GitPullRequest,
  commit: GitCommitHorizontal,
  changelog: ScrollText,
  doc: FileText,
}

/** Days since 1970-01-01 for a YYYY-MM-DD string, without Date (safe in render). */
export function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const year = m <= 2 ? y - 1 : y
  const era = Math.floor(year / 400)
  const yoe = year - era * 400
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
  return era * 146097 + doe - 719468
}

function DecisionRhythm({
  decisions,
  colors,
  selectedId,
  onSelect,
}: {
  decisions: AtlasDecision[]
  colors: Map<string, string>
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const columns = useMemo(() => {
    if (decisions.length === 0) return []
    const days = decisions.map((decision) => dayNumber(decision.date))
    const first = Math.min(...days)
    const last = Math.max(...days)
    const span = Math.max(1, last - first + 1)
    const buckets: AtlasDecision[][] = Array.from({ length: span }, () => [])
    decisions.forEach((decision, index) => buckets[days[index] - first].push(decision))
    return buckets
  }, [decisions])

  if (columns.length === 0) return null
  return (
    <div className="chitin-card chamfer-corner p-3 sm:p-4" aria-label="Decisions over time">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#839493]">Decision rhythm</p>
        <p className="text-[11px] text-[#5f7170]">
          {shortDate(decisions[0].date)} to {shortDate(decisions[decisions.length - 1].date)}
        </p>
      </div>
      <div className="mt-3 flex h-16 items-end gap-px" role="list">
        {columns.map((bucket, index) => (
          <div key={index} className="flex min-w-0 flex-1 flex-col-reverse gap-px" role="listitem">
            {bucket.map((decision) => (
              <button
                key={decision.id}
                type="button"
                title={`${shortDate(decision.date)}: ${decision.title}`}
                aria-label={`${shortDate(decision.date)}: ${decision.title}`}
                onClick={() => onSelect(decision.id)}
                className="h-2.5 w-full transition-opacity hover:opacity-100"
                style={{
                  background: colors.get(decision.domains[0]) ?? '#00c3ff',
                  opacity: selectedId && selectedId !== decision.id ? 0.35 : 0.9,
                  outline: selectedId === decision.id ? '1px solid #dfe3e3' : undefined,
                }}
              />
            ))}
            {bucket.length === 0 ? <div className="h-px w-full bg-[#243233]" /> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function DecisionCard({
  decision,
  atlas,
  colors,
  expanded,
  onToggle,
  onOpenRule,
}: {
  decision: AtlasDecision
  atlas: LogicAtlas
  colors: Map<string, string>
  expanded: boolean
  onToggle: () => void
  onOpenRule: (ruleId: string) => void
}) {
  const ref = useRef<HTMLElement>(null)
  const ruleTitles = useMemo(() => new Map(atlas.rules.map((rule) => [rule.id, rule])), [atlas])
  const color = colors.get(decision.domains[0]) ?? '#00c3ff'

  useEffect(() => {
    if (expanded) ref.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [expanded])

  return (
    <article
      ref={ref}
      id={`decision-${decision.id}`}
      className={`relative border bg-[#0e181b] transition-colors ${
        expanded ? 'border-[#3a4a49]' : 'border-[#243233] hover:border-[#3a4a49]'
      }`}
      style={{ borderLeft: `3px solid ${color}` }}
      data-testid={`atlas-decision-${decision.id}`}
    >
      <span
        className="absolute -left-[26px] top-4 h-2.5 w-2.5 rotate-45 ring-4 ring-[#0b1011] sm:-left-[30px]"
        style={{ background: color }}
        aria-hidden
      />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 px-3.5 py-3 text-left sm:px-4"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f7170]">
            {shortDate(decision.date)}
            {decision.status === 'superseded' ? <span className="ml-2 text-[#ffb020]">Superseded</span> : null}
          </p>
          <h3 className="mt-0.5 font-grotesk text-[15px] font-bold leading-snug text-[#dfe3e3]">{decision.title}</h3>
          <p className="mt-1 text-[13px] leading-snug text-[#8fa2a1]">{decision.summary}</p>
        </div>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-[#839493] transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      <div className="flex flex-wrap items-center gap-1.5 px-3.5 pb-3 sm:px-4">
        {decision.domains.map((id) => {
          const domain = atlas.domains.find((item) => item.id === id)
          return domain ? <DomainChip key={id} title={domain.title} color={domain.color} /> : null
        })}
        {decision.sources.map((source) => {
          const Icon = SOURCE_ICONS[source.kind]
          return (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[30px] items-center gap-1 border border-[#243233] px-2 text-[11px] font-semibold text-[#9fb3b2] hover:border-[#00c3ff]/50 hover:text-[#00c3ff]"
            >
              <Icon className="h-3 w-3" />
              {source.label}
              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
            </a>
          )
        })}
      </div>

      {expanded ? (
        <div className="border-t border-[#243233] px-3.5 py-4 sm:px-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
            {decision.sections.map((section) => (
              <section key={section.heading}>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#839493]">{section.heading}</h4>
                <div className="atlas-prose mt-1.5" dangerouslySetInnerHTML={{ __html: section.html }} />
              </section>
            ))}
          </div>
          {decision.rules.length > 0 ? (
            <div className="mt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#839493]">Rules this shaped</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {decision.rules.map((id) => {
                  const rule = ruleTitles.get(id)
                  if (!rule) return null
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onOpenRule(id)}
                      className="inline-flex min-h-[30px] items-center gap-1.5 border border-[#243233] bg-[#0b1011] px-2 text-[11px] text-[#b9c6c5] hover:border-[#00c3ff]/50 hover:text-[#dfe3e3]"
                    >
                      <span className="h-1.5 w-1.5 rotate-45" style={{ background: colors.get(rule.domain) }} aria-hidden />
                      {rule.title}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

export function DecisionTimeline({ atlas, filter, selectedDecisionId, onSelectDecision, onOpenRule }: DecisionTimelineProps) {
  const colors = useMemo(() => new Map(atlas.domains.map((domain) => [domain.id, domain.color])), [atlas])
  const visible = useMemo(() => atlas.decisions.filter((decision) => decisionMatches(decision, filter)), [atlas, filter])
  const months = useMemo(() => groupDecisionsByMonth(visible), [visible])

  return (
    <div className="space-y-4" data-testid="atlas-timeline">
      <DecisionRhythm
        decisions={visible}
        colors={colors}
        selectedId={selectedDecisionId}
        onSelect={(id) => onSelectDecision(id)}
      />

      {months.length === 0 ? (
        <p className="chitin-card chamfer-corner p-4 text-sm text-[#839493]">No decisions match these filters.</p>
      ) : (
        <div className="relative ml-3 border-l border-[#243233] pl-5 sm:ml-4 sm:pl-6">
          {months.map((month) => (
            <section key={month.key} className="pb-6 last:pb-0" aria-label={month.label}>
              <h2 className="-ml-5 mb-3 flex items-center gap-2 sm:-ml-6">
                <span className="-ml-[5px] h-2.5 w-2.5 border border-[#3a4a49] bg-[#0b1011]" aria-hidden />
                <span className="font-grotesk text-xs font-bold uppercase tracking-[0.2em] text-[#9fb3b2]">
                  {month.label}
                </span>
                <span className="text-[11px] text-[#5f7170]">{month.decisions.length}</span>
              </h2>
              <div className="space-y-2.5">
                {month.decisions.map((decision) => (
                  <DecisionCard
                    key={decision.id}
                    decision={decision}
                    atlas={atlas}
                    colors={colors}
                    expanded={selectedDecisionId === decision.id}
                    onToggle={() => onSelectDecision(selectedDecisionId === decision.id ? null : decision.id)}
                    onOpenRule={onOpenRule}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
