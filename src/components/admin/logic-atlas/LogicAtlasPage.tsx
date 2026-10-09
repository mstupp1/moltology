import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, History, Map as MapIcon, RefreshCw, Search, TriangleAlert, Workflow, X } from 'lucide-react'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { EMPTY_FILTER, matchingRuleIds, needsAttention, type AtlasFilter } from '@/lib/logic-atlas/filter'
import type { AtlasTab, LogicAtlasSearch } from '@/lib/logic-atlas/search'
import { RULE_KINDS, RULE_KIND_LABELS, type LogicAtlas, type RuleKind } from '@/lib/logic-atlas/types'
import { getLogicAtlasFn } from '@/lib/server/api'
import { DomainChip, DriftDot, KIND_ICONS } from './atlas-ui'
import { DecisionTimeline } from './DecisionTimeline'
import { FlowDiagram } from './FlowDiagram'
import { RuleDrawer } from './RuleDrawer'
import './logic-atlas.css'

const LazyAtlasCanvas = lazy(() => import('./AtlasCanvas').then((m) => ({ default: m.AtlasCanvas })))

let atlasCache: { userId: string; promise: Promise<LogicAtlas> } | null = null

/** One fetch per session. Switching tabs or rules never refetches the atlas. */
function loadAtlas(userId: string, force = false): Promise<LogicAtlas> {
  if (!force && atlasCache?.userId === userId) return atlasCache.promise
  const promise = (async () => {
    const token = await getAuthJWTToken().catch(() => null)
    return getLogicAtlasFn({ data: { userId, token: token ?? undefined } })
  })()
  atlasCache = { userId, promise }
  promise.catch(() => {
    if (atlasCache?.promise === promise) atlasCache = null
  })
  return promise
}

export interface LogicAtlasPageProps {
  search: LogicAtlasSearch
  onSearchChange: (next: LogicAtlasSearch) => void
}

function StatCard({
  label,
  value,
  detail,
  tone = 'cyan',
  onClick,
  pressed,
}: {
  label: string
  value: string
  detail?: string
  tone?: 'cyan' | 'amber'
  onClick?: () => void
  pressed?: boolean
}) {
  const body = (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">{label}</p>
      <p className={`mt-1 font-grotesk text-xl font-bold ${tone === 'amber' ? 'text-amber-400' : 'text-cyan-glow'}`}>
        {value}
      </p>
      {detail ? <p className="mt-0.5 truncate text-[11px] text-ink-muted">{detail}</p> : null}
    </>
  )
  if (!onClick) return <div className="hud-sheen rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4">{body}</div>
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`hud-sheen rounded-card border bg-surface-1 p-3 text-left transition-colors sm:p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
        pressed ? 'border-amber-500/70 bg-surface-2' : 'border-line-subtle hover:border-line-hover hover:bg-surface-2'
      }`}
    >
      {body}
    </button>
  )
}

export function LogicAtlasPage({ search, onSearchChange }: LogicAtlasPageProps) {
  const session = useAuthSession()
  const [atlas, setAtlas] = useState<LogicAtlas | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (force = false) => {
      if (!session.userId || session.isPending) return
      setError(null)
      try {
        setAtlas(await loadAtlas(session.userId, force))
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not load the Logic Atlas.')
      }
    },
    [session.userId, session.isPending],
  )

  useEffect(() => {
    void load()
  }, [load])

  return (
    <LogicAtlasView
      atlas={atlas}
      error={error}
      onRetry={() => void load(true)}
      search={search}
      onSearchChange={onSearchChange}
    />
  )
}

export interface LogicAtlasViewProps extends LogicAtlasPageProps {
  atlas: LogicAtlas | null
  error: string | null
  onRetry: () => void
}

/** Pure view: everything the page shows, driven by the atlas and URL state. */
export function LogicAtlasView({ atlas, error, onRetry, search, onSearchChange }: LogicAtlasViewProps) {
  const [kinds, setKinds] = useState<RuleKind[]>([])
  const [onlyAttention, setOnlyAttention] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [flowOpen, setFlowOpen] = useState(false)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setNarrow(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const tab: AtlasTab = search.tab ?? (narrow ? 'timeline' : 'map')
  const domainIds = useMemo(() => new Set(atlas?.domains.map((domain) => domain.id) ?? []), [atlas])
  const focusDomain = search.domain && domainIds.has(search.domain) ? search.domain : null

  const filter = useMemo<AtlasFilter>(
    () => ({
      ...EMPTY_FILTER,
      query: search.q ?? '',
      domains: focusDomain ? [focusDomain] : [],
      kinds,
      onlyAttention,
    }),
    [search.q, focusDomain, kinds, onlyAttention],
  )

  const matches = useMemo(() => (atlas ? matchingRuleIds(atlas.rules, filter) : null), [atlas, filter])
  const selectedRule = useMemo(
    () => (atlas && search.rule ? (atlas.rules.find((rule) => rule.id === search.rule) ?? null) : null),
    [atlas, search.rule],
  )
  useEffect(() => {
    setFlowOpen(false)
  }, [selectedRule?.id])

  useEffect(() => {
    if (!flowOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFlowOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flowOpen])

  const attentionCount = useMemo(() => atlas?.rules.filter(needsAttention).length ?? 0, [atlas])
  const driftedRules = useMemo(() => atlas?.rules.filter((rule) => rule.drift !== 'ok').length ?? 0, [atlas])

  const update = useCallback(
    (patch: Partial<LogicAtlasSearch>) => {
      const next: LogicAtlasSearch = { ...search, ...patch }
      for (const key of Object.keys(next) as (keyof LogicAtlasSearch)[]) {
        if (next[key] === undefined || next[key] === '') delete next[key]
      }
      onSearchChange(next)
    },
    [search, onSearchChange],
  )

  const selectRule = useCallback((ruleId: string | null) => update({ tab: 'map', rule: ruleId ?? undefined }), [update])
  const openDecision = useCallback(
    (decisionId: string) => update({ tab: 'timeline', decision: decisionId, rule: undefined }),
    [update],
  )
  const openRuleFromTimeline = useCallback(
    (ruleId: string) => update({ tab: 'map', rule: ruleId, decision: undefined, domain: undefined }),
    [update],
  )

  const toggleKind = (kind: RuleKind) =>
    setKinds((current) => (current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind]))

  return (
    <div className="space-y-3.5 font-sans sm:space-y-4" data-testid="logic-atlas">
      <HudTitlePanel
        accent="cyan"
        eyebrow="Steward oversight"
        title="Logic Atlas"
        description="How the app's rules fit together, where each one lives in code, and why it was decided."
        actions={
          <Link
            to="/admin"
            className="hud-sheen inline-flex min-h-[36px] items-center gap-1.5 rounded-control border border-line bg-surface-1 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Admin
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4" aria-label="Atlas summary">
        <StatCard
          label="Rules"
          value={atlas ? String(atlas.stats.rules) : '—'}
          detail={atlas ? `Across ${atlas.stats.domains} domains` : undefined}
        />
        <StatCard
          label="Decisions"
          value={atlas ? String(atlas.stats.decisions) : '—'}
          detail={atlas ? 'Backed by PRs and commits' : undefined}
        />
        <StatCard
          label="Needs attention"
          value={atlas ? String(attentionCount) : '—'}
          detail={atlas ? `${atlas.stats.flagged} flagged, ${driftedRules} with code changes` : undefined}
          tone="amber"
          onClick={atlas ? () => setOnlyAttention((value) => !value) : undefined}
          pressed={onlyAttention}
        />
        <StatCard
          label="Last synced"
          value={atlas ? atlas.syncedAt : '—'}
          detail="Run /logic-atlas to refresh"
        />
      </section>

      {error ? (
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-line-subtle border-l-2 border-l-crimson-aggro bg-crimson-soft p-3 text-sm text-ink-body" role="alert">
          <TriangleAlert className="h-4 w-4 text-crimson-text" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="hud-sheen inline-flex min-h-[36px] items-center gap-1.5 rounded-control border border-line bg-surface-1 px-3 text-xs font-bold uppercase tracking-[0.08em] text-ink transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      ) : null}

      <div className="space-y-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex gap-2" role="tablist" aria-label="Atlas views">
            {(
              [
                { id: 'map', label: 'Map', icon: MapIcon },
                { id: 'timeline', label: 'Decisions', icon: History },
              ] as const
            ).map((item) => {
              const Icon = item.icon
              const selected = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid={`atlas-tab-${item.id}`}
                  onClick={() => update({ tab: item.id })}
                  className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-t-control border-b-2 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-colors sm:flex-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                    selected
                      ? 'border-cyan-glow bg-surface-2 text-ink'
                      : 'border-transparent text-ink-muted hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              )
            })}
          </div>
          <label className="relative flex min-h-[40px] flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-ink-muted" aria-hidden />
            <span className="sr-only">Search rules and decisions</span>
            <input
              type="search"
              value={search.q ?? ''}
              onChange={(event) => update({ q: event.target.value.slice(0, 80) })}
              placeholder="Search rules, code symbols, and decisions"
              className="h-10 w-full rounded-control border border-line bg-surface-2 pl-9 pr-9 text-sm text-ink placeholder:text-ink-muted transition-colors hover:border-line-hover focus:border-cyan-glow focus:shadow-field-focus focus:outline-none"
              data-testid="atlas-search"
            />
            {search.q ? (
              <button
                type="button"
                onClick={() => update({ q: undefined })}
                aria-label="Clear search"
                className="absolute right-2 inline-flex h-7 w-7 items-center justify-center rounded-control text-ink-muted hover:bg-surface-3 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </label>
        </div>

        {atlas ? (
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto sm:flex-wrap sm:overflow-visible" aria-label="Filter by domain">
            {atlas.domains.map((domain) => (
              <DomainChip
                key={domain.id}
                title={domain.title}
                color={domain.color}
                count={domain.ruleIds.length}
                active={focusDomain === domain.id}
                onClick={() =>
                  update({ domain: focusDomain === domain.id ? undefined : domain.id, rule: undefined })
                }
              />
            ))}
          </div>
        ) : null}

        {atlas && tab === 'map' ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5" aria-label="Filter by rule type">
            {RULE_KINDS.map((kind) => {
              const Icon = KIND_ICONS[kind]
              const active = kinds.includes(kind)
              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleKind(kind)}
                  className={`inline-flex min-h-[28px] items-center gap-1 rounded-control text-[11px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                    active ? 'text-cyan-glow' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {RULE_KIND_LABELS[kind]}
                </button>
              )
            })}
            <span className="hidden h-3 w-px bg-line-subtle sm:inline-block" aria-hidden />
            <span className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.08em] text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <DriftDot drift="ok" /> Verified
              </span>
              <span className="inline-flex items-center gap-1">
                <DriftDot drift="changed" /> Code changed
              </span>
              <span className="inline-flex items-center gap-1">
                <TriangleAlert className="h-3 w-3 text-crimson-text" /> Gap
              </span>
            </span>
          </div>
        ) : null}
      </div>

      {!atlas && !error ? (
        <div className="rounded-card border border-line-subtle bg-surface-1 h-[60dvh] min-h-[420px] animate-pulse" aria-busy="true" aria-label="Loading the Logic Atlas" />
      ) : null}

      {atlas && tab === 'map' ? (
        <div className="relative h-[72dvh] min-h-[520px] overflow-hidden rounded-card border border-line-subtle">
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-abyss" aria-busy="true" />}>
            <LazyAtlasCanvas
              atlas={atlas}
              selectedRuleId={selectedRule?.id ?? null}
              matches={matches}
              focusDomain={focusDomain}
              drawerOpen={Boolean(selectedRule)}
              onSelectRule={selectRule}
            />
          </Suspense>
          {selectedRule?.flow && flowOpen ? (
            <div
              className="absolute inset-0 z-20 flex flex-col bg-abyss min-[900px]:right-[440px] min-[900px]:z-[5]"
              data-testid="atlas-flow-overlay"
            >
              <div className="flex items-center justify-between gap-2 border-b border-line-subtle bg-surface-2 px-4 py-2.5">
                <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
                  <Workflow className="h-4 w-4 shrink-0 text-cyan-glow" />
                  <span className="truncate">{selectedRule.title}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setFlowOpen(false)}
                  className="hud-sheen inline-flex min-h-[36px] items-center gap-1.5 rounded-control border border-line bg-surface-1 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  <X className="h-3.5 w-3.5" />
                  Back to map
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <FlowDiagram flow={selectedRule.flow} mode="full" />
              </div>
            </div>
          ) : null}
          {selectedRule ? (
            <RuleDrawer
              atlas={atlas}
              rule={selectedRule}
              onClose={() => selectRule(null)}
              onSelectRule={(id) => selectRule(id)}
              onOpenDecision={openDecision}
              onExpandFlow={() => setFlowOpen(true)}
              escapeClosesDrawer={!flowOpen}
            />
          ) : null}
          {matches && matches.size === 0 ? (
            <p className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-control border border-line bg-surface-1 px-3 py-1.5 text-xs text-ink-muted">
              No rules match these filters.
            </p>
          ) : null}
        </div>
      ) : null}

      {atlas && tab === 'timeline' ? (
        <DecisionTimeline
          atlas={atlas}
          filter={filter}
          selectedDecisionId={search.decision ?? null}
          onSelectDecision={(id) => update({ decision: id ?? undefined })}
          onOpenRule={openRuleFromTimeline}
        />
      ) : null}
    </div>
  )
}
