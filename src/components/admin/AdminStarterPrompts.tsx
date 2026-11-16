import React, { useMemo, useState } from 'react'
import { ArrowUpRight, MessageSquareText } from 'lucide-react'
import { ADMIN_CARD, ADMIN_FIELD, ADMIN_LABEL, AdminCardHeading } from './admin-ui'
import {
  STARTER_GROUP_LABELS,
  STARTER_PROMPTS,
  localDay,
  pickStarterChips,
  starterPromptText,
  starterPromptVisible,
  type StarterContext,
  type StarterPageKind,
  type StarterPrompt,
} from '@/lib/oracle-starter-prompts'

const VISITORS = [
  { id: 'guest', label: 'Guest', ctx: { audience: 'guest' } },
  { id: 'new', label: 'New member', ctx: { audience: 'member', memberDays: 1 } },
  { id: 'member', label: 'Member', ctx: { audience: 'member', memberDays: 60 } },
  { id: 'max', label: 'MAX', ctx: { audience: 'max', memberDays: 60 } },
] as const

const PAGES: Array<{ id: StarterPageKind | ''; label: string }> = [
  { id: '', label: 'No page (Oracle page)' },
  { id: 'forum-thread', label: 'A forum thread' },
  { id: 'forum-board', label: 'A forum board' },
  { id: 'forum', label: 'Forum index' },
  { id: 'news-article', label: 'A news article' },
  { id: 'news', label: 'News index' },
  { id: 'changelog-entry', label: 'A changelog entry' },
  { id: 'codex', label: 'A Codex passage' },
  { id: 'academy-course', label: 'An Academy course' },
]

function rules(p: StarterPrompt): string {
  const parts: string[] = []
  if (p.page) parts.push(`page: ${p.page}`)
  if (p.audience) parts.push(p.audience.join(', '))
  if (p.always) parts.push(`always for ${p.always.join(', ')}`)
  if (p.newMember === 'only') parts.push('first 7 days')
  if (p.newMember === 'skip') parts.push('after 7 days')
  if (p.needs) parts.push(`needs ${p.needs.join(', ')}`)
  if (p.from || p.until) parts.push(`${p.from ?? '…'} to ${p.until ?? '…'}`)
  return parts.join(' · ') || 'everyone'
}

/**
 * Admin > Starter prompts: what the Oracle's new-chat screen offers each kind of visitor
 * today. Prompts live in src/lib/oracle-starter-prompts.ts; this view only previews them.
 */
export function AdminStarterPrompts() {
  const [visitor, setVisitor] = useState<(typeof VISITORS)[number]['id']>('member')
  const [page, setPage] = useState<StarterPageKind | ''>('')
  const [academy, setAcademy] = useState(false)
  const ctx: StarterContext = useMemo(() => ({
    ...VISITORS.find((v) => v.id === visitor)!.ctx,
    page: page || null,
    has: { 'academy-courses': academy },
    today: localDay(),
    seed: `preview-${visitor}`,
  }), [visitor, page, academy])
  const chips = pickStarterChips(ctx)
  const groups = ['page', 'start', 'community', 'codex', 'focus'] as const

  return (
    <section className={ADMIN_CARD} data-testid="admin-starter-prompts">
      <AdminCardHeading
        icon={<MessageSquareText />}
        title="Starter prompts"
        description="What the Oracle's new-chat screen suggests. Four chips rotate daily; More ideas lists the rest. Edit the list in src/lib/oracle-starter-prompts.ts."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <p className={ADMIN_LABEL}>Preview as</p>
          <div role="radiogroup" aria-label="Preview as" className="flex flex-wrap gap-1">
            {VISITORS.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={visitor === v.id}
                onClick={() => setVisitor(v.id)}
                className={`rounded-chip px-3 py-1 text-xs font-bold transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                  visitor === v.id ? 'bg-cyan-soft text-cyan-glow' : 'text-ink-muted hover:text-ink hover:bg-surface-2'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <label className="space-y-1">
          <span className={ADMIN_LABEL}>Page behind the chat</span>
          <select className={ADMIN_FIELD} value={page} onChange={(e) => setPage(e.target.value as StarterPageKind | '')}>
            {PAGES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-ink-body pb-2">
          <input type="checkbox" checked={academy} onChange={(e) => setAcademy(e.target.checked)} />
          Academy has courses
        </label>
      </div>

      <div className="space-y-1.5">
        <p className={ADMIN_LABEL}>Today's chips</p>
        <ul className="flex flex-wrap gap-2" data-testid="admin-starter-chips">
          {chips.map((p) => (
            <li key={p.id} title={starterPromptText(p)} className="inline-flex items-center gap-1.5 rounded-control border border-line-subtle bg-surface-2 px-3 py-1.5 text-sm text-ink">
              {p.label}
              <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </div>

      {groups.map((group) => {
        const list = STARTER_PROMPTS.filter((p) => (group === 'page' ? Boolean(p.page) : p.group === group))
        return (
          <div key={group} className="space-y-1">
            <p className={ADMIN_LABEL}>{group === 'page' ? 'Page prompts' : STARTER_GROUP_LABELS[group]}</p>
            <ul className="divide-y divide-line-subtle border-y border-line-subtle">
              {list.map((p) => {
                const shown = starterPromptVisible(p, group === 'page' ? ctx : { ...ctx, page: null })
                return (
                  <li key={p.id} className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 ${shown ? '' : 'opacity-50'}`}>
                    <span className="sm:w-64 shrink-0 text-sm font-bold text-ink">{p.label}</span>
                    <span className="flex-1 min-w-0 text-xs text-ink-muted">{starterPromptText(p)}</span>
                    <span className="shrink-0 text-[11px] text-ink-muted">{rules(p)}</span>
                    <span className={`shrink-0 text-[11px] font-bold ${shown ? 'text-cyan-glow' : 'text-ink-muted'}`}>
                      {shown ? 'Shown' : 'Hidden'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
