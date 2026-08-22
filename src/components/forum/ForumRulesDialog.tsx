import React from 'react'
import { X, ShieldCheck } from 'lucide-react'
import { COMMUNITY_RULES } from '@/lib/community-rules'

interface ForumRulesDialogProps {
  onClose: () => void
}

export function ForumRulesDialog({ onClose }: ForumRulesDialogProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0b0f0f] border border-[#00ffff]/60 shadow-[0_0_30px_rgba(0,255,255,0.25)] chamfer-corner overflow-hidden font-sans text-sm space-y-0">
        <div className="bg-[#171c1c] border-b border-[#3a4a49] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00ffff]" />
            <h2 className="text-xs text-[#00ffff] font-bold tracking-widest uppercase">
              COMMUNITY DIRECTIVES & RULES
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#839493] hover:text-[#ff5540] p-1 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-[#839493] leading-relaxed border-l-2 border-[#00ffff] pl-3">
            Beneath our dark biomechanical HUD theme, safety, warmth, and mutual growth are non-negotiable core tenets.
          </p>

          {COMMUNITY_RULES.map((rule) => (
            <div
              key={rule.id}
              className="chitin-card-inset p-3.5 border border-[#3a4a49] chamfer-corner space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-grotesk font-bold text-xs text-[#dfe3e3] uppercase">
                  {rule.id}. {rule.title}
                </span>
                <span
                  className={`text-[9px] font-sans px-1.5 py-0.2 font-bold uppercase shrink-0 chamfer-corner border ${
                    rule.severity === 'CRITICAL'
                      ? 'bg-[#ff5540]/15 text-[#ff5540] border-[#ff5540]/50'
                      : rule.severity === 'HIGH'
                        ? 'bg-[#ffb703]/15 text-[#ffb703] border-[#ffb703]/50'
                        : 'bg-[#00ffff]/10 text-[#00ffff] border-[#00ffff]/40'
                  }`}
                >
                  {rule.severity}
                </span>
              </div>
              <p className="text-xs text-[#00ffff] font-semibold">{rule.shortSummary}</p>
              <p className="text-xs text-[#839493] leading-relaxed">{rule.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#070b0b] border-t border-[#3a4a49] p-3 flex items-center justify-between text-xs text-[#839493]">
          <span>5 DIRECTIVES ACTIVE</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#00ffff]/15 hover:bg-[#00ffff]/25 text-[#00ffff] border border-[#00ffff]/50 font-bold text-xs chamfer-corner transition-colors uppercase tracking-wider"
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  )
}