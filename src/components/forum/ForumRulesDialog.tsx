import React from 'react'
import { X, ShieldCheck } from 'lucide-react'
import { COMMUNITY_RULES } from '@/lib/community-rules'

interface ForumRulesDialogProps {
  onClose: () => void
}

export function ForumRulesDialog({ onClose }: ForumRulesDialogProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0b1010] border border-[#ff5540]/60 rounded-lg shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3a39]">
          <h2 className="text-sm font-grotesk font-bold text-[#ff5540] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Community Rules
          </h2>
          <button onClick={onClose} className="text-[#839493] hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {COMMUNITY_RULES.map((rule) => (
            <div key={rule.id} className="p-3.5 bg-[#0d1414] border border-[#2a3a39] rounded space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-grotesk font-bold text-xs text-[#00ffff]">
                  {rule.id}. {rule.title}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 font-bold uppercase shrink-0 border ${
                    rule.severity === 'CRITICAL'
                      ? 'bg-[#ff5540]/20 text-[#ff5540] border-[#ff5540]'
                      : rule.severity === 'HIGH'
                        ? 'bg-[#ffb703]/20 text-[#ffb703] border-[#ffb703]'
                        : 'bg-[#00ffff]/10 text-[#00ffff] border-[#00ffff]/60'
                  }`}
                >
                  {rule.severity}
                </span>
              </div>
              <p className="text-xs text-[#dfe3e3] font-bold">{rule.shortSummary}</p>
              <p className="text-xs text-[#839493] leading-relaxed">{rule.description}</p>
            </div>
          ))}

          <div className="pt-2 border-t border-[#2a3a39] text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#ff5540] text-black font-grotesk font-bold text-xs uppercase rounded"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}