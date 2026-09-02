import React, { useState } from 'react'
import { Radio } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { HudButton } from '@/components/ui'
import { getAuthJWTToken } from '@/lib/jwt'
import { claimMemberHandleFn } from '@/lib/server/api'
import { parseMemberHandle } from '@/lib/member-handle'
import { DesignationField } from './DesignationField'

export interface ClaimDesignationGateProps {
  userId: string
  larvaUnit: string
  onClaimed: (handle: string) => void
  onDefer: () => void
}

export function ClaimDesignationGate({
  userId,
  larvaUnit,
  onClaimed,
  onDefer,
}: ClaimDesignationGateProps) {
  const { toast } = useToast()
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const parsed = parseMemberHandle(value)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parsed.ok) {
      setError(parsed.message)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const token = await getAuthJWTToken()
      const result = await claimMemberHandleFn({
        data: { handle: parsed.handle, userId, token: token ?? undefined },
      })
      toast.success('Username saved.')
      onClaimed(result.handle || parsed.handle)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save username. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-6"
      data-testid="claim-designation-gate"
    >
      <div className="absolute inset-0 bg-[#030708]/[0.92]" />
      <div className="relative w-full max-w-md chitin-card p-5 sm:p-6 chamfer-corner border border-[#00c3ff]/30 shadow-2xl">
        <div className="flex items-center gap-2 text-[#00c3ff] mb-3">
          <Radio className="w-4 h-4" />
          <span className="font-grotesk text-[10px] font-bold uppercase tracking-[0.25em]">
            Registry
          </span>
        </div>
        <h2 className="font-grotesk text-lg font-bold text-[#dfe3e3] tracking-wider uppercase">
          Claim your designation
        </h2>
        <p className="text-xs text-[#839493] font-sans mt-2 leading-relaxed">
          The community reads a name, not a unit number. Choose one that is yours. Your larva unit
          stays on file as {larvaUnit}.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <DesignationField value={value} onChange={setValue} disabled={submitting} />
          {error && (
            <p className="text-xs text-[#ff453a] font-sans" role="alert">
              {error}
            </p>
          )}
          <HudButton
            type="submit"
            variant="cyan"
            fullWidth
            disabled={submitting || !parsed.ok}
          >
            {submitting ? 'Sealing…' : 'Seal designation'}
          </HudButton>
          <button
            type="button"
            onClick={onDefer}
            className="w-full text-center text-[11px] text-[#5a8888] hover:text-[#9bbbbb] uppercase tracking-wider"
          >
            Remain under unit designation
          </button>
        </form>
      </div>
    </div>
  )
}
