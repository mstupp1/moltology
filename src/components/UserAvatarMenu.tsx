import React, { useState, useRef, useEffect } from 'react'
import { LogOut, Eye, EyeOff, Sparkles } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { UserAvatar } from './UserAvatar'
import { useHeavyVfx } from '@/hooks/useHeavyVfx'

export interface UserAvatarMenuProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    avatar?: string | null
    picture?: string | null
    role?: string | null
  }
  userRole?: string | null
  onNavigate?: (path: string) => void
  align?: 'left' | 'right'
  openDirection?: 'up' | 'down'
}

/**
 * Standardized HUD User Avatar Dropdown Menu component.
 * Displays user profile image / letter avatar badge which opens a dropdown
 * containing user details (name, email), Heavy VFX toggle, and sign-out action.
 */
export const UserAvatarMenu: React.FC<UserAvatarMenuProps> = ({
  user,
  userRole,
  onNavigate,
  align = 'right',
  openDirection = 'down',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { heavyVfxDisabled, toggleHeavyVfx } = useHeavyVfx()

  const handleToggle = () => setIsOpen((prev) => !prev)
  const handleClose = () => setIsOpen(false)

  const handleSignOut = async () => {
    handleClose()
    await authClient.signOut()
    if (onNavigate) {
      onNavigate('/')
    }
  }

  // Handle click outside & keyboard escape to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleClose()
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const displayName = user.name || user.email?.split('@')[0] || 'Operative'
  const isSuperAdminEmail = user.email?.toLowerCase() === 'mylesstupp@gmail.com'
  const effectiveRole =
    userRole === 'super_admin' || isSuperAdminEmail
      ? 'super_admin'
      : userRole === 'admin' || user.role === 'admin'
      ? 'admin'
      : userRole || user.role

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Interactive Avatar Button Badge */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
        className="flex items-center justify-center p-1 bg-[#090e0f]/90 border border-cyan-900/60 hover:border-[#00c3ff] rounded-full shadow-inner shadow-cyan-950/60 backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-[#00c3ff]/60 group cursor-pointer active:scale-95"
      >
        <UserAvatar
          user={user}
          size="sm"
          className="border border-cyan-400/80 group-hover:border-[#00c3ff] shadow-[0_0_8px_rgba(0,255,255,0.4)] group-hover:shadow-[0_0_12px_rgba(0,255,255,0.8)] transition-all"
        />
      </button>

      {/* Floating Glassmorphic HUD Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${
            openDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          } w-64 bg-[#060a0b]/95 backdrop-blur-2xl border border-cyan-500/40 rounded-xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(0,195,255,0.25)] z-50 animate-in fade-in zoom-in-95 duration-150 font-mono`}
        >
          {/* Top User Header Info Section */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#121c1d]">
            <UserAvatar
              user={user}
              size="md"
              className="border-2 border-[#00c3ff] shadow-[0_0_10px_rgba(0,195,255,0.6)]"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[#dfe3e3] truncate font-grotesk flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c3ff] shrink-0" />
                  {displayName}
                </span>
                {effectiveRole && ['admin', 'super_admin'].includes(effectiveRole) && (
                  <span className="text-[9px] font-mono font-extrabold tracking-wider uppercase px-1.5 py-0.2 bg-[#00ffff]/15 border border-[#00ffff]/70 text-[#00ffff] rounded chamfer-corner shadow-[0_0_8px_rgba(0,255,255,0.4)] shrink-0">
                    {effectiveRole === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN'}
                  </span>
                )}
              </div>
              {user.email && (
                <span className="text-[10px] text-[#7a8e9e] truncate mt-0.5">
                  {user.email}
                </span>
              )}
            </div>
          </div>

          {/* Heavy VFX Toggle Settings Section */}
          <div className="py-2.5 px-0.5 border-b border-[#121c1d]">
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#091012]/80 border border-cyan-900/40 hover:border-cyan-700/60 transition-all">
              <div className="flex items-center gap-2 min-w-0">
                {heavyVfxDisabled ? (
                  <EyeOff className="w-4 h-4 text-amber-400/90 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#00c3ff] shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-[#dfe3e3] truncate">
                    Disable Heavy VFX
                  </span>
                  <span className="text-[9px] text-[#7a8e9e] truncate">
                    {heavyVfxDisabled ? 'VFX Off (Performance Mode)' : 'VFX Active (Full Graphics)'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={heavyVfxDisabled}
                aria-label="Disable heavy vfx toggle"
                onClick={toggleHeavyVfx}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-[#00c3ff] ${
                  heavyVfxDisabled ? 'bg-cyan-950/80 border-cyan-700/50' : 'bg-[#00c3ff]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    heavyVfxDisabled ? 'translate-x-0 bg-gray-400' : 'translate-x-4 bg-white'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sign Out Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#ff5540] hover:text-white bg-[#ff3b30]/10 hover:bg-[#ff3b30]/25 border border-[#ff3b30]/30 hover:border-[#ff3b30] flex items-center gap-2.5 font-bold transition-all group cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#ff5540] group-hover:translate-x-0.5 transition-transform" />
              <span>SIGN OUT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
