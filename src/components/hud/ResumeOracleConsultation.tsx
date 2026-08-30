import React, { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Atom } from 'lucide-react'
import { HudButton } from '@/components/ui'
import { useSafeOracle } from '@/components/hud/OracleContext'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAIThreadsFn } from '@/lib/server/api'
import {
  oracleRouteSearch,
  pickLastActiveOracleThread,
  type OracleThreadLike,
} from '@/lib/ai/last-oracle-thread'

export function ResumeOracleConsultation() {
  const navigate = useNavigate()
  const session = useAuthSession()
  const oracle = useSafeOracle()
  const [localThreads, setLocalThreads] = useState<OracleThreadLike[]>([])
  const [localLoading, setLocalLoading] = useState(false)

  const userId = session.userId
  const canLoadThreads = Boolean(userId) && !session.isGuest && !session.isPending

  const threads = oracle ? oracle.threads : localThreads
  const isLoadingThreads = oracle ? oracle.isLoadingThreads : localLoading

  useEffect(() => {
    if (oracle || !canLoadThreads || !userId) return

    let isMounted = true
    setLocalLoading(true)
    getAIThreadsFn({ data: { userId } })
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setLocalThreads(data)
        }
      })
      .catch(() => {
        if (isMounted) setLocalThreads([])
      })
      .finally(() => {
        if (isMounted) setLocalLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [oracle, canLoadThreads, userId])

  if (!canLoadThreads || isLoadingThreads) return null

  const lastThread = pickLastActiveOracleThread(threads)
  if (!lastThread) return null

  const title = (lastThread.title || '').trim() || 'Untitled Consultation'

  return (
    <div
      className="chitin-card p-3 sm:p-4 chamfer-corner flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      data-testid="resume-oracle-consultation"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <Atom className="w-4 h-4 text-[#00ffff] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 space-y-0.5">
          <p className="text-[10px] font-bold tracking-wider uppercase text-[#00ffff]">
            Last consultation
          </p>
          <p className="font-grotesk text-sm font-bold text-[#dfe3e3] uppercase truncate">
            {title}
          </p>
        </div>
      </div>
      <HudButton
        variant="cyan"
        size="sm"
        className="shrink-0"
        onClick={() =>
          navigate({
            to: '/oracle',
            search: oracleRouteSearch(lastThread.id),
          })
        }
        aria-label={`Continue last Oracle consultation: ${title}`}
      >
        Continue consultation
      </HudButton>
    </div>
  )
}
