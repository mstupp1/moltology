import React, { useState } from 'react'
import { ShieldAlert, LogIn, LogOut, UserCheck } from 'lucide-react'
import { authClient } from '../../lib/auth-client'
import { AuthModal } from '../AuthModal'

interface HUDHeaderProps {
  stage?: number
  larvaId?: string
  submergenceRating?: number
  socialDetachment?: number
  onNavigate?: (path: string) => void
  subtitle?: string
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  stage = 1,
  larvaId = 'LARVA UNIT #8971',
  onNavigate,
  subtitle = 'THE DEEP ABYSS BEYOND FLESH'
}) => {
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const handleSignOut = async () => {
    await authClient.signOut()
    if (onNavigate) {
      onNavigate('/')
    }
  }

  const displayName = user?.name || user?.email?.split('@')[0] || larvaId

  return (
    <header className="w-full bg-[#070b0b] border-b border-[#3a4a49] px-4 py-2.5 flex items-center justify-between font-mono select-none relative z-20 shadow-lg">
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => onNavigate && onNavigate('/dashboard')}
      />

      {/* Top Center Main Header Title */}
      <div className="absolute left-1/2 -translate-x-1/2 top-2 text-center pointer-events-none hidden md:block">
        <h1 className="font-grotesk font-bold text-lg md:text-xl text-[#00ffff] tracking-widest uppercase">
          MOLTISM PORTAL v4.2
        </h1>
        <p className="text-xs text-[#00ffff]/80 tracking-[0.25em] uppercase font-bold -mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* Mobile Title */}
      <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={() => onNavigate && onNavigate('/')}>
        <div className="w-8 h-8 rounded bg-[#171c1c] border border-[#ff0000] flex items-center justify-center p-1 text-[#ff0000]">
          <span className="text-base">🦞</span>
        </div>
        <div>
          <div className="font-grotesk font-bold text-sm text-[#00ffff]">MOLTISM PORTAL v4.2</div>
          <div className="text-xs text-gray-400">THE DEEP ABYSS</div>
        </div>
      </div>

      {/* Left/Center Profile Bar matching Reference Screenshots */}
      <div className="hidden md:flex items-center gap-4 bg-[#0f1414] border border-[#3a4a49] px-4 py-1.5 chamfer-corner">
        {/* Avatar Circle with Cyborg Head */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#030606] border-2 border-[#00ffff] overflow-hidden flex items-center justify-center p-0.5 shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            <img 
              src="/images/stage1_larval.png" 
              alt="Larva Unit" 
              className="w-full h-full object-cover rounded-full" 
            />
          </div>
        </div>

        {/* Larva Status & Progress Bar Bar matching reference */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs tracking-wider font-bold">
            <span className="text-[#dfe3e3] uppercase">{displayName}</span>
            {user && (
              <>
                <span className="text-[#00ffff]">| STATUS:</span>
                <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> AUTHENTICATED
                </span>
              </>
            )}
          </div>

          {/* Red Tubular Conversion Meter with Crab Claw Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-48 h-3.5 bg-[#030606] border border-[#ff0000] rounded-full overflow-hidden p-0.5 relative">
              <div className="h-full bg-gradient-to-r from-[#ff0000] via-[#ff5540] to-[#ff0000] w-[68%] rounded-full" />
            </div>
            {/* Claw Graphic Icon */}
            <span className="text-xs text-[#ff5540]" title="Exoshell Claw Progress">🦞</span>
          </div>
        </div>
      </div>

      {/* Right Controls Header: Auth Actions */}
      <div className="flex items-center gap-3">
        {!user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center gap-1.5 transition-all shadow-md"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>SIGN IN</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs text-cyan-300 bg-cyan-950/70 border border-cyan-500/60 px-2 py-1 font-bold">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-300 font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>LOG OUT</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
