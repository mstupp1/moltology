import React, { useState } from 'react'
import { ShieldAlert, LogIn, LogOut, UserCheck, Search, Command } from 'lucide-react'
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

  const handleOpenCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'))
  }

  return (
    <header className="w-full bg-[#070b0b] border-b border-[#3a4a49] px-4 py-2 flex items-center justify-between font-mono select-none relative z-20 shadow-lg shrink-0">
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => onNavigate && onNavigate('/dashboard')}
      />

      {/* Top Center Search Bar launching Command Palette */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden md:block">
        <button
          onClick={handleOpenCommandPalette}
          className="flex items-center justify-between w-64 lg:w-96 bg-[#030606] hover:bg-[#0b0f0f] border border-[#3a4a49] hover:border-[#00ffff]/70 px-3 py-1.5 text-xs text-[#839493] transition-all chamfer-corner group shadow-inner"
          title="Search protocols and commands (⌘K)"
        >
          <div className="flex items-center gap-2 text-[#839493] group-hover:text-[#dfe3e3] truncate">
            <Search className="w-3.5 h-3.5 text-[#00ffff] group-hover:scale-110 transition-transform" />
            <span className="truncate">Search commands & protocols...</span>
          </div>
          <div className="flex items-center gap-1 bg-[#0f1414] border border-[#3a4a49] text-[#00ffff] px-1.5 py-0.5 text-[10px] font-bold shrink-0">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Mobile Search Button */}
      <div className="md:hidden flex items-center gap-2">
        <button
          onClick={handleOpenCommandPalette}
          className="flex items-center gap-2 bg-[#030606] hover:bg-[#0b0f0f] border border-[#3a4a49] active:border-[#00ffff] px-2.5 py-1 text-xs text-[#839493] chamfer-corner"
        >
          <Search className="w-3.5 h-3.5 text-[#00ffff]" />
          <span className="text-xs font-mono text-[#dfe3e3]">Search</span>
          <span className="bg-[#0f1414] text-[#00ffff] border border-[#3a4a49] text-[9px] px-1 py-0.2 font-bold">⌘K</span>
        </button>
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
