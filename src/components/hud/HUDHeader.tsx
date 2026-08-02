import React, { useState } from 'react'
import { LogIn, LogOut, Search, Command } from 'lucide-react'
import { authClient } from '../../lib/auth-client'
import { AuthModal } from '../AuthModal'
import { BenthicCTAButton } from './BenthicCTAButton'

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
  larvaId = 'LARVA UNIT AB371',
  onNavigate,
}) => {
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  const openAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    if (onNavigate) {
      onNavigate('/')
    }
  }

  const displayName = user?.name || user?.email?.split('@')[0]?.toUpperCase() || larvaId

  const handleOpenCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'))
  }

  return (
    <header className="w-full bg-[#060a0b]/70 backdrop-blur-md border-b border-[#3a4a49]/65 px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between font-mono select-none relative z-30 shadow-2xl shrink-0 gap-2 overflow-x-clip">
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => onNavigate && onNavigate('/dashboard')}
      />

      {/* Left: Unit Avatar & Mobile-Optimized Conversion Process Meter */}
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1 sm:flex-initial">
        {/* Unit Avatar Circle with Cyan Glow Ring */}
        <div className="relative shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#030606] border-2 border-[#00c3ff] overflow-hidden flex items-center justify-center p-0.5 shadow-[0_0_10px_rgba(0,195,255,0.6)]">
            <img 
              src="/images/stage1_larval.png" 
              alt="Larva Unit" 
              className="w-full h-full object-cover rounded-full filter contrast-110" 
            />
          </div>
        </div>

        {/* Tubular Conversion Meter & Monospace Status Readout */}
        <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 flex-1">
          {/* Tubular Progress Capsule */}
          <div className="flex items-center gap-1.5">
            <div className="w-24 xs:w-36 sm:w-56 md:w-64 lg:w-72 h-3.5 sm:h-4 bg-[#030606] border border-[#00c3ff]/50 rounded-full overflow-hidden p-0.5 relative flex items-center shadow-[inset_0_0_8px_rgba(0,0,0,0.8)]">
              {/* Progress Fill Gradient */}
              <div 
                className="h-full bg-gradient-to-r from-[#00c3ff] via-[#ff453a] to-[#ff0000] rounded-full relative flex items-center justify-end shadow-[0_0_8px_rgba(255,69,58,0.5)] transition-all duration-500"
                style={{ width: '68%' }}
              >
                {/* Glowing Vertical Edge Line */}
                <div className="w-0.5 sm:w-1 h-full bg-white shadow-[0_0_6px_#ffffff] rounded-r" />
              </div>

              {/* Crab Claw Icon at Progress Head */}
              <div 
                className="absolute text-[10px] sm:text-xs leading-none filter drop-shadow-[0_0_4px_rgba(255,69,58,0.8)] pointer-events-none -ml-1 sm:-ml-1.5"
                style={{ left: 'calc(68% - 4px)' }}
                title="Exoshell Claw Head"
              >
                🦞
              </div>
            </div>
          </div>

          {/* Monospaced Status Readout Text */}
          <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] tracking-tight sm:tracking-wide font-bold font-mono text-[#00c3ff] truncate">
            <span className="hidden xs:inline text-[#dfe3e3] uppercase truncate max-w-[80px] sm:max-w-none">{displayName}</span>
            <span className="hidden xs:inline text-[#3a4a49]">|</span>
            <span className="text-[#00c3ff] truncate">
              <span className="hidden sm:inline">STATUS: </span>
              <span className="text-[#ff5540] animate-pulse">CONVERSION IN PROGRESS</span>
            </span>
          </div>
        </div>
      </div>

      {/* Screen-Centered Command Palette Launcher (⌘K) - Viewport Screen Centered */}
      <div className="fixed left-1/2 -translate-x-1/2 top-3 hidden md:flex items-center z-40">
        <button
          onClick={handleOpenCommandPalette}
          className="flex items-center justify-between w-64 lg:w-80 bg-[#030606]/90 hover:bg-[#0d1415] border border-[#3a4a49] hover:border-[#00c3ff]/80 px-3.5 py-1.5 text-xs text-[#839493] transition-all chamfer-corner group shadow-2xl"
          title="Search protocols and commands (⌘K)"
        >
          <div className="flex items-center gap-2 text-[#839493] group-hover:text-[#dfe3e3] truncate">
            <Search className="w-3.5 h-3.5 text-[#00c3ff] group-hover:scale-110 transition-transform" />
            <span className="truncate text-xs">Search commands & protocols...</span>
          </div>
          <div className="flex items-center gap-1 bg-[#0f1414] border border-[#3a4a49] text-[#00c3ff] px-1.5 py-0.5 text-[10px] font-bold shrink-0">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Mobile Command Palette Launcher Button */}
      <div className="md:hidden flex items-center shrink-0">
        <button
          onClick={handleOpenCommandPalette}
          className="flex items-center gap-1 bg-[#030606] hover:bg-[#0b0f0f] border border-[#3a4a49] active:border-[#00c3ff] px-2 py-1 text-xs text-[#839493] chamfer-corner shadow-md"
          title="Open Command Palette"
        >
          <Search className="w-3.5 h-3.5 text-[#00c3ff]" />
          <span className="bg-[#0f1414] text-[#00c3ff] border border-[#3a4a49] text-[9px] px-1 py-0.2 font-bold">⌘K</span>
        </button>
      </div>

      {/* Far Right Controls: Auth Actions with BenthicCTAButton Styling */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 relative z-20">
        {!user ? (
          <BenthicCTAButton
            variant="cyan"
            size="sm"
            onClick={() => openAuth('login')}
            className="!px-2.5 sm:!px-4 !py-1"
          >
            <span className="flex items-center gap-1 text-[10px] sm:text-xs">
              <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="xs:hidden">SIGN IN</span>
              <span className="hidden xs:inline">SIGN IN TO PERSIST</span>
            </span>
          </BenthicCTAButton>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden xl:inline-block text-[11px] text-[#00c3ff] bg-[#0f1414] border border-[#3a4a49] px-2.5 py-1 font-mono font-bold truncate max-w-[160px] rounded-full shadow-inner">
              {user.email}
            </span>
            <BenthicCTAButton
              variant="red"
              size="sm"
              onClick={handleSignOut}
              className="!px-2.5 sm:!px-4 !py-1"
            >
              <span className="flex items-center gap-1 text-[10px] sm:text-xs">
                <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>LOG OUT</span>
              </span>
            </BenthicCTAButton>
          </div>
        )}
      </div>
    </header>
  )
}

