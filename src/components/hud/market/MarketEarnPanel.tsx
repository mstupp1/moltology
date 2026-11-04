import React from 'react'
import { Check } from 'lucide-react'
import { LocalTime } from '@/components/ui/LocalTime'
import {
  GEM_ALL_TASKS_DAILY,
  GEM_PER_REFERRAL,
  GEM_STAGE_REWARDS,
  GEM_STREAK_MILESTONES,
  type GemWallet,
} from '@/lib/gems'
import { cn } from '@/lib/utils'
import { GemAmount } from './MarketCurrencyBar'

function Row({ label, value, done }: { label: string; value: React.ReactNode; done?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 border-b border-line-subtle last:border-b-0">
      <span className={cn('flex items-center gap-2 text-sm', done ? 'text-ink-muted' : 'text-ink-body')}>
        {done !== undefined ? (
          <span
            className={cn(
              'grid place-items-center w-4 h-4 rounded-chip border',
              done ? 'border-emerald-400 bg-emerald-400/15 text-emerald-300' : 'border-line',
            )}
            aria-label={done ? 'Done' : 'Not yet'}
          >
            {done ? <Check className="w-3 h-3" aria-hidden="true" /> : null}
          </span>
        ) : null}
        {label}
      </span>
      {value}
    </li>
  )
}

export function MarketEarnPanel({ wallet }: { wallet: GemWallet }) {
  const streaks = GEM_STREAK_MILESTONES.map((m) => `${m.days}d`).join(', ')
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="rounded-card border border-line-subtle bg-surface-1 p-4">
        <h2 className="text-sm font-semibold text-ink mb-1">Ways to earn</h2>
        <p className="text-xs text-ink-muted mb-2">Gems land as soon as you finish something.</p>
        <ul>
          <Row label="Finish every daily liturgy" value={<GemAmount value={GEM_ALL_TASKS_DAILY} size="sm" />} />
          <Row
            label={`Streak milestones (${streaks})`}
            value={
              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[12px] text-ink-muted">
                <GemAmount value={GEM_STREAK_MILESTONES[0].gems} size="sm" /> to{' '}
                <GemAmount value={GEM_STREAK_MILESTONES[GEM_STREAK_MILESTONES.length - 1].gems} size="sm" />
              </span>
            }
          />
          {GEM_STAGE_REWARDS.map((r) => (
            <Row key={r.stage} label={`Reach stage ${r.stage}`} value={<GemAmount value={r.gems} size="sm" />} />
          ))}
          <Row label="Invite a member who gets started" value={<GemAmount value={GEM_PER_REFERRAL} size="sm" />} />
        </ul>
        <h3 className="text-sm font-semibold text-ink mt-4 mb-1">One-time firsts</h3>
        <ul>
          {wallet.firsts.map((f) => (
            <Row key={f.id} label={f.title} done={f.done} value={<GemAmount value={f.gems} size="sm" />} />
          ))}
        </ul>
      </section>
      <section className="rounded-card border border-line-subtle bg-surface-1 p-4">
        <h2 className="text-sm font-semibold text-ink mb-2">Recent gems</h2>
        {wallet.history.length === 0 ? (
          <p className="text-sm text-ink-muted">Nothing yet. Finish today's liturgies to get started.</p>
        ) : (
          <ul>
            {wallet.history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-2 border-b border-line-subtle last:border-b-0">
                <span className="min-w-0">
                  <span className="block text-sm text-ink-body truncate">{h.description}</span>
                  <span className="block text-[11px] text-ink-muted">
                    <LocalTime value={h.createdAt} />
                  </span>
                </span>
                <span
                  className={cn(
                    'font-grotesk font-bold tabular-nums text-sm',
                    h.amount >= 0 ? 'text-emerald-300' : 'text-ink-muted',
                  )}
                >
                  {h.amount >= 0 ? '+' : '−'}
                  {Math.abs(h.amount).toLocaleString('en-US')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
