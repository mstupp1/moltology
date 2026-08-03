import React from 'react'
import { useLocation } from '@tanstack/react-router'
import { authClient } from '../../lib/auth-client'
import { UserAvatar } from '../UserAvatar'

interface HUDHeaderProps {
  stage?: number
  larvaId?: string
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  stage = 1,
  larvaId = 'LARVA UNIT AB371',
}) => {
  const location = useLocation()
  const sessionRes = authClient.useSession()
  const user = sessionRes?.data?.user || (sessionRes as any)?.user

  const displayName = user?.name || user?.email?.split('@')[0]?.toUpperCase() || larvaId

  return (
    <header className="w-full bg-[#060a0b]/70 backdrop-blur-md border-b border-[#3a4a49]/65 px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between font-mono select-none relative z-30 shadow-2xl shrink-0 gap-2 overflow-x-clip">

      {/* Left: Unit Avatar & Mobile-Optimized Conversion Process Meter */}
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1 sm:flex-initial">
        {/* Unit Avatar Circle with Cyan Glow Ring */}
        <div className="relative shrink-0">
          <UserAvatar
            user={user}
            fallbackSrc="/images/extracted/larva_unit_3d.jpg"
            alt={user ? (user.name || user.email || 'User Avatar') : 'Larva Unit 3D'}
            size="md"
            className="border-2 border-[#00c3ff] shadow-[0_0_12px_rgba(0,195,255,0.8)] filter contrast-125"
          />
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

    </header>
  )
}

