/**
 * Auth-dependent chrome for PublicHeader.
 * Isolated so Neon Auth / Better Auth stay out of the eager public shell chunk.
 */
import React from 'react'
import { Cpu, UserPlus, LogIn } from 'lucide-react'
import { BenthicCTAButton } from '@/components/hud/BenthicCTAButton'
import { UserAvatarMenu } from '@/components/UserAvatarMenu'
import { useAuthSession } from '@/hooks/useAuthSession'

export interface PublicHeaderAuthSlotProps {
  isCorporate: boolean
  layout: 'desktop' | 'mobile'
  onNavigate: (path: string) => void
  onOpenAuth?: (mode: 'login' | 'signup') => void
  onMobileClose?: () => void
}

export function PublicHeaderAuthSlot({
  isCorporate,
  layout,
  onNavigate,
  onOpenAuth,
  onMobileClose,
}: PublicHeaderAuthSlotProps) {
  const session = useAuthSession()
  const user = session.user
  const isSessionPending = session.isPending

  if (layout === 'desktop') {
    if (user) {
      return (
        <div className="flex items-center gap-3">
          {isCorporate ? (
            <button
              onClick={() => onNavigate('/dashboard')}
              className="px-4 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-grotesk font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-2 transition-all hover:scale-105 shadow-sm"
            >
              <Cpu className="w-4 h-4 text-sky-600" />
              <span>DASHBOARD</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('/dashboard')}
              className="px-5 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center gap-2 transition-all hover:scale-105 shadow-hud-cyan"
            >
              <Cpu className="w-4 h-4" />
              <span>DASHBOARD</span>
            </button>
          )}
          <UserAvatarMenu
            user={user}
            onNavigate={onNavigate}
            variant={isCorporate ? 'corporate' : 'benthic'}
          />
        </div>
      )
    }

    if (isSessionPending) {
      return (
        <div className="flex items-center gap-2.5" data-testid="public-header-auth-skeleton">
          <div className={`h-8 w-16 rounded-md ${isCorporate ? 'bg-slate-200/70' : 'bg-white/[0.05] border border-white/[0.08]'} animate-pulse`} />
          <div className={`h-8 w-24 rounded-md ${isCorporate ? 'bg-sky-200/70' : 'bg-white/[0.05] border border-white/[0.08]'} animate-pulse`} />
        </div>
      )
    }

    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => onOpenAuth?.('login')}
          className={`px-4 py-2 text-xs font-grotesk font-bold uppercase tracking-wider transition-colors ${
            isCorporate
              ? 'text-slate-600 hover:text-sky-700'
              : 'text-gray-300 hover:text-cyan-300'
          }`}
        >
          LOG IN
        </button>
        {isCorporate ? (
          <button
            onClick={() => onOpenAuth?.('signup')}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white font-grotesk font-extrabold text-xs uppercase tracking-wider rounded-full shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>JOIN FAMILY</span>
          </button>
        ) : (
          <BenthicCTAButton size="sm" onClick={() => onOpenAuth?.('signup')}>
            <span className="flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              <span>JOIN PATH</span>
            </span>
          </BenthicCTAButton>
        )}
      </div>
    )
  }

  // Mobile layout
  if (user) {
    return (
      <div className="space-y-2 pt-1">
        <button
          onClick={() => onNavigate('/dashboard')}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-grotesk font-bold text-sm uppercase tracking-wider transition-colors active:scale-[0.99] ${
            isCorporate
              ? 'bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 shadow-sm'
              : 'bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(0,195,255,0.15)]'
          }`}
        >
          <Cpu className={`w-4 h-4 ${isCorporate ? 'text-sky-600' : 'text-cyan-400'}`} />
          <span>DASHBOARD</span>
        </button>
        <UserAvatarMenu
          user={user}
          onNavigate={onNavigate}
          inline
          variant={isCorporate ? 'corporate' : 'benthic'}
        />
      </div>
    )
  }

  if (isSessionPending) {
    return (
      <div className="flex flex-col gap-2.5 pt-1" data-testid="public-header-mobile-auth-skeleton">
        <div className={`h-11 w-full rounded-xl ${isCorporate ? 'bg-slate-200/70' : 'bg-white/[0.05] border border-white/[0.08]'} animate-pulse`} />
        <div className={`h-11 w-full rounded-xl ${isCorporate ? 'bg-sky-200/70' : 'bg-white/[0.05] border border-white/[0.08]'} animate-pulse`} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 pt-1">
      {isCorporate ? (
        <>
          <button
            onClick={() => {
              onMobileClose?.()
              onOpenAuth?.('signup')
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 hover:bg-sky-400 text-white font-grotesk font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-md shadow-sky-500/20 active:scale-[0.99] transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>JOIN FAMILY</span>
          </button>
          <button
            onClick={() => {
              onMobileClose?.()
              onOpenAuth?.('login')
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-grotesk font-bold text-sm uppercase tracking-wider rounded-xl shadow-sm active:scale-[0.99] transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>LOG IN</span>
          </button>
        </>
      ) : (
        <>
          <BenthicCTAButton
            size="md"
            fullWidth
            onClick={() => {
              onMobileClose?.()
              onOpenAuth?.('signup')
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>JOIN PATH</span>
            </span>
          </BenthicCTAButton>
          <BenthicCTAButton
            size="md"
            variant="cyan"
            fullWidth
            onClick={() => {
              onMobileClose?.()
              onOpenAuth?.('login')
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" />
              <span>LOG IN</span>
            </span>
          </BenthicCTAButton>
        </>
      )}
    </div>
  )
}
