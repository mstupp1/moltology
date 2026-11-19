import React from 'react'
import { X, ShieldCheck } from 'lucide-react'
import { COMMUNITY_RULES } from '@/lib/community-rules'

interface ForumRulesDialogProps {
  onClose: () => void
}

export function ForumRulesDialog({ onClose }: ForumRulesDialogProps) {
  return (
    <div className="fixed inset-0 z-50 bg-abyss/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-surface-1 border border-line shadow-menu rounded-card overflow-hidden font-sans text-sm space-y-0">
        <div className="bg-surface-2 border-b border-line-subtle p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-glow" />
            <h2 className="font-grotesk text-sm font-semibold text-ink">
              Community rules
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 p-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-ink-body leading-relaxed border-l-2 border-cyan-glow pl-3">
            Beneath the dark biomechanical look, safety, warmth, and mutual growth stay non-negotiable.
          </p>

          {COMMUNITY_RULES.map((rule) => (
            <div
              key={rule.id}
              className="p-3.5 border border-line-subtle bg-surface-2 rounded-card space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="eyebrow">
                  {rule.id}. {rule.title}
                </span>
                <span
                  className={`text-2xs font-sans px-1.5 py-0.2 font-semibold shrink-0 rounded-chip border border-line-subtle ${
                    rule.severity === 'CRITICAL'
                      ? 'bg-crimson-soft text-crimson-text'
                      : rule.severity === 'HIGH'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-cyan-soft text-cyan-glow'
                  }`}
                >
                  {rule.severity}
                </span>
              </div>
              <p className="text-xs text-cyan-glow font-semibold">{rule.shortSummary}</p>
              <p className="text-xs text-ink-body leading-relaxed">{rule.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-surface-2 border-t border-line-subtle p-3 flex items-center justify-between text-xs text-ink-muted">
          <span>5 RULES ACTIVE</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong font-semibold text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  )
}