import React, { useState, useRef, useEffect } from 'react'
import { LogOut, EyeOff, Sparkles, ChevronDown, Settings } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { UserAvatar } from './UserAvatar'
import { useHeavyVfx } from '@/hooks/useHeavyVfx'
import { getEffectiveRole } from '@/lib/permissions'

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
  align?: 'left' | 'right' | 'center'
  openDirection?: 'up' | 'down'
  inline?: boolean
  className?: string
  variant?: 'benthic' | 'corporate'
}

/**
 * Standardized HUD User Avatar Dropdown Menu component.
 * Supports both floating popover (desktop / sidebar) and inline accordion (mobile navigation drawers).
 * Displays user profile image / letter avatar badge which opens a menu
 * containing user details (name, email), Heavy VFX toggle, and sign-out action.
 * Supports dark 'benthic' and light 'corporate' themes.
 */
export const UserAvatarMenu: React.FC<UserAvatarMenuProps> = ({
  user,
  userRole,
  onNavigate,
  align = 'right',
  openDirection = 'down',
  inline = false,
  className = '',
  variant = 'benthic',
}) => {
  const isCorporate = variant === 'corporate'
  const [isOpen, setIsOpen] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isExpanded, setIsExpanded] = useState(isOpen)
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

  const handleOpenSettings = () => {
    handleClose()
    onNavigate?.('/settings')
  }

  const displayName = user.name || user.email?.split('@')[0] || 'Operative'
  const effectiveRole = getEffectiveRole(user, userRole)

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

  // Synchronized smooth animation lifecycle for both inline accordion and desktop popover
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      if (typeof window !== 'undefined') {
        const raf1 = requestAnimationFrame(() => {
          const raf2 = requestAnimationFrame(() => {
            setIsExpanded(true)
          })
          return () => cancelAnimationFrame(raf2)
        })
        return () => cancelAnimationFrame(raf1)
      } else {
        setIsExpanded(true)
      }
    } else {
      setIsExpanded(false)
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, inline ? 250 : 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen, inline])

  // Mobile / Drawer Inline Layout
  if (inline) {
    return (
      <div className={`w-full text-left ${className}`} ref={menuRef}>
        {/* Interactive Full-Width Mobile Operative Row */}
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="User account menu"
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors group cursor-pointer focus:outline-none focus:ring-1 ${
            isCorporate
              ? 'bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-slate-800 hover:text-slate-950 focus:ring-sky-400'
              : 'bg-cyan-950/20 hover:bg-cyan-950/40 text-gray-200 hover:text-white focus:ring-[#00c3ff]/60'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              user={user}
              size="sm"
              variant={variant}
              className={
                isCorporate
                  ? 'border border-sky-300 group-hover:border-sky-500 shadow-sm transition-all shrink-0'
                  : 'border border-cyan-400/50 group-hover:border-[#00c3ff] transition-all shrink-0'
              }
            />
            <div className="flex flex-col min-w-0 text-left">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-xs font-bold truncate font-grotesk flex items-center gap-1.5 ${
                    isCorporate
                      ? 'text-slate-800 group-hover:text-sky-700'
                      : 'text-gray-200 group-hover:text-cyan-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isCorporate ? 'bg-sky-500' : 'bg-[#00c3ff]'
                    }`}
                  />
                  {displayName}
                </span>
                {effectiveRole && ['admin', 'super_admin'].includes(effectiveRole) && (
                  <span
                    className={`text-[9px] font-sans font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded chamfer-corner shrink-0 ${
                      isCorporate
                        ? 'bg-sky-100 border border-sky-300 text-sky-700'
                        : 'bg-[#00ffff]/15 border border-[#00ffff]/70 text-[#00ffff]'
                    }`}
                  >
                    {effectiveRole === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN'}
                  </span>
                )}
              </div>
              {user.email && (
                <span
                  className={`text-[10px] truncate mt-0.5 font-sans ${
                    isCorporate ? 'text-slate-500' : 'text-gray-400'
                  }`}
                >
                  {user.email}
                </span>
              )}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ease-in-out shrink-0 ml-2 ${
              isCorporate
                ? isOpen
                  ? 'rotate-180 text-sky-600'
                  : 'rotate-0 text-sky-500 group-hover:text-sky-700'
                : isOpen
                ? 'rotate-180 text-[#00c3ff]'
                : 'rotate-0 text-cyan-400/70 group-hover:text-cyan-300'
            }`}
          />
        </button>

        {/* Smooth Animated Inline Controls Accordion */}
        {shouldRender && (
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
              isExpanded
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden">
              <div className="pt-2 pb-1 space-y-2">
                {/* Heavy VFX Toggle Row */}
                <div
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl ${
                    isCorporate
                      ? 'bg-sky-50/70 border border-sky-200/80'
                      : 'bg-cyan-950/25 border border-cyan-950/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {heavyVfxDisabled ? (
                      <EyeOff
                        className={`w-4 h-4 shrink-0 ${
                          isCorporate ? 'text-amber-500' : 'text-amber-400'
                        }`}
                      />
                    ) : (
                      <Sparkles
                        className={`w-4 h-4 shrink-0 ${
                          isCorporate ? 'text-sky-600' : 'text-[#00c3ff]'
                        }`}
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-xs font-bold truncate font-grotesk ${
                          isCorporate ? 'text-slate-800' : 'text-gray-200'
                        }`}
                      >
                        Disable Heavy VFX
                      </span>
                      <span
                        className={`text-[10px] truncate font-sans ${
                          isCorporate ? 'text-slate-500' : 'text-gray-400'
                        }`}
                      >
                        {heavyVfxDisabled ? 'Performance Mode' : 'Full Graphics Active'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={heavyVfxDisabled}
                    aria-label="Disable heavy vfx toggle"
                    onClick={toggleHeavyVfx}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 ${
                      isCorporate
                        ? heavyVfxDisabled
                          ? 'bg-slate-200 border-slate-300 focus:ring-sky-400'
                          : 'bg-sky-500 focus:ring-sky-400'
                        : heavyVfxDisabled
                        ? 'bg-cyan-950 border-cyan-800 focus:ring-[#00c3ff]'
                        : 'bg-[#00c3ff] focus:ring-[#00c3ff]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        heavyVfxDisabled ? 'translate-x-0 bg-slate-300' : 'translate-x-4 bg-white'
                      }`}
                    />
                  </button>
                </div>

                {/* Settings Link */}
                <button
                  type="button"
                  onClick={handleOpenSettings}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold font-grotesk transition-all ${
                    isCorporate
                      ? 'text-sky-700 hover:bg-sky-100 border border-sky-200/80'
                      : 'text-[#00c3ff] hover:bg-cyan-950/40 border border-cyan-900/40'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Settings</span>
                </button>

                {/* Sign Out Action Button */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold font-grotesk tracking-wider transition-all cursor-pointer active:scale-[0.99] ${
                    isCorporate
                      ? 'text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-500 border border-rose-200 hover:border-rose-500 shadow-xs'
                      : 'text-red-400 hover:text-white bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 hover:border-red-600'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  <span>SIGN OUT</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Floating Popover Layout (Desktop Navigation / HUDSidebar)
  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Interactive Avatar Button Badge */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
        className={`flex items-center justify-center p-1 rounded-full backdrop-blur-md transition-all focus:outline-none focus:ring-2 group cursor-pointer active:scale-95 ${
          isCorporate
            ? 'bg-white hover:bg-sky-50 border border-sky-200 hover:border-sky-400 shadow-sm focus:ring-sky-400/60'
            : 'bg-[#090e0f]/90 border border-cyan-900/60 hover:border-[#00c3ff] shadow-inner shadow-cyan-950/60 focus:ring-[#00c3ff]/60'
        }`}
      >
        <UserAvatar
          user={user}
          size="sm"
          variant={variant}
          className={
            isCorporate
              ? 'border border-sky-300 group-hover:border-sky-500 shadow-sm transition-all'
              : 'border border-cyan-400/80 group-hover:border-[#00c3ff] shadow-[0_0_8px_rgba(0,255,255,0.4)] group-hover:shadow-[0_0_12px_rgba(0,255,255,0.8)] transition-all'
          }
        />
      </button>

      {/* Floating Glassmorphic Dropdown Menu with smooth animated open and close */}
      {shouldRender && (
        <div
          className={`absolute ${
            align === 'right'
              ? 'right-0'
              : align === 'center'
              ? 'left-1/2 -translate-x-1/2'
              : 'left-0'
          } ${
            openDirection === 'up'
              ? 'bottom-full mb-2 origin-bottom'
              : 'top-full mt-2 origin-top'
          } w-64 max-w-[calc(100vw-2rem)] rounded-2xl p-3.5 z-[200] backdrop-blur-2xl transition-all duration-200 ease-out ${
            isCorporate
              ? 'bg-white/95 border border-sky-200/90 shadow-[0_15px_35px_rgba(15,23,42,0.12),0_5px_15px_rgba(2,132,199,0.08)] font-sans'
              : 'bg-[#060a0b]/95 border border-cyan-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(0,195,255,0.25)] font-sans'
          } ${
            isExpanded
              ? 'opacity-100 scale-100 translate-y-0'
              : openDirection === 'up'
              ? 'opacity-0 scale-95 translate-y-2 pointer-events-none'
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }`}
        >
          {/* Top User Header Info Section */}
          <div
            className={`flex items-center gap-3 pb-3 border-b ${
              isCorporate ? 'border-sky-100' : 'border-[#121c1d]'
            }`}
          >
            <UserAvatar
              user={user}
              size="md"
              variant={variant}
              className={
                isCorporate
                  ? 'border-2 border-sky-400 shadow-sm'
                  : 'border-2 border-[#00c3ff] shadow-[0_0_10px_rgba(0,195,255,0.6)]'
              }
            />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-xs font-bold truncate font-grotesk flex items-center gap-1.5 ${
                    isCorporate ? 'text-slate-800' : 'text-[#dfe3e3]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isCorporate ? 'bg-sky-500 shadow-[0_0_6px_#0284c7]' : 'bg-[#00c3ff]'
                    }`}
                  />
                  {displayName}
                </span>
                {effectiveRole && ['admin', 'super_admin'].includes(effectiveRole) && (
                  <span
                    className={`text-[9px] font-sans font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded chamfer-corner shrink-0 ${
                      isCorporate
                        ? 'bg-sky-100 border border-sky-300 text-sky-700 shadow-xs'
                        : 'bg-[#00ffff]/15 border border-[#00ffff]/70 text-[#00ffff] shadow-[0_0_8px_rgba(0,255,255,0.4)]'
                    }`}
                  >
                    {effectiveRole === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN'}
                  </span>
                )}
              </div>
              {user.email && (
                <span
                  className={`text-[10px] truncate mt-0.5 font-sans ${
                    isCorporate ? 'text-slate-500' : 'text-[#7a8e9e]'
                  }`}
                >
                  {user.email}
                </span>
              )}
            </div>
          </div>

          {/* Settings Section: Heavy VFX */}
          <div
            className={`py-2 px-0.5 border-b space-y-1.5 ${
              isCorporate ? 'border-sky-100' : 'border-[#121c1d]'
            }`}
          >
            {/* Heavy VFX */}
            <div
              className={`flex items-center justify-between gap-2 p-2 rounded-xl transition-all ${
                isCorporate
                  ? 'bg-sky-50/80 border border-sky-200/80 hover:border-sky-300'
                  : 'bg-[#091012]/80 border border-cyan-900/40 hover:border-cyan-700/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {heavyVfxDisabled ? (
                  <EyeOff
                    className={`w-4 h-4 shrink-0 ${
                      isCorporate ? 'text-amber-500' : 'text-amber-400/90'
                    }`}
                  />
                ) : (
                  <Sparkles
                    className={`w-4 h-4 shrink-0 ${
                      isCorporate ? 'text-sky-600' : 'text-[#00c3ff]'
                    }`}
                  />
                )}
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-[11px] font-bold truncate font-grotesk ${
                      isCorporate ? 'text-slate-800' : 'text-[#dfe3e3]'
                    }`}
                  >
                    Disable Heavy VFX
                  </span>
                  <span
                    className={`text-[9px] truncate font-sans ${
                      isCorporate ? 'text-slate-500' : 'text-[#7a8e9e]'
                    }`}
                  >
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
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 ${
                  isCorporate
                    ? heavyVfxDisabled
                      ? 'bg-slate-200 border-slate-300 focus:ring-sky-400'
                      : 'bg-sky-500 focus:ring-sky-400'
                    : heavyVfxDisabled
                    ? 'bg-cyan-950/80 border-cyan-700/50 focus:ring-[#00c3ff]'
                    : 'bg-[#00c3ff] focus:ring-[#00c3ff]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    heavyVfxDisabled ? 'translate-x-0 bg-slate-300' : 'translate-x-4 bg-white'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenSettings}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold font-grotesk flex items-center gap-2.5 transition-all group cursor-pointer ${
                isCorporate
                  ? 'text-sky-700 hover:bg-sky-50 border border-sky-200/80 hover:border-sky-300'
                  : 'text-[#00c3ff] hover:bg-[#00c3ff]/10 border border-cyan-900/40 hover:border-[#00c3ff]/40'
              }`}
            >
              <Settings
                className={`w-4 h-4 shrink-0 ${
                  isCorporate ? 'text-sky-600' : 'text-[#00c3ff]'
                }`}
              />
              <span>Settings</span>
            </button>
          </div>

          {/* Sign Out Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold font-grotesk flex items-center gap-2.5 transition-all group cursor-pointer ${
                isCorporate
                  ? 'text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 hover:border-rose-300'
                  : 'text-[#ff5540] hover:text-white bg-[#ff3b30]/10 hover:bg-[#ff3b30]/25 border border-[#ff3b30]/30 hover:border-[#ff3b30]'
              }`}
            >
              <LogOut
                className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                  isCorporate ? 'text-rose-500' : 'text-[#ff5540]'
                }`}
              />
              <span>SIGN OUT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
