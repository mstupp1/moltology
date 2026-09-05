import React, { useState, useRef, useEffect } from 'react'
import { LogOut, ChevronDown, Settings, User, Globe } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { beginSignOut, endSignOut } from '@/lib/auth-session'
import { UserAvatar } from './UserAvatar'
import { getEffectiveRole } from '@/lib/permissions'
import { useOptionalToast } from '@/components/ui/ToastProvider'

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
  displayName?: string | null
}

/**
 * Standardized HUD User Avatar Dropdown Menu component.
 * Supports both floating popover (desktop / sidebar) and inline accordion (mobile navigation drawers).
 * Displays user profile image / letter avatar badge which opens a menu
 * containing user details (name, email), settings, and sign-out action.
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
  displayName: displayNameProp,
}) => {
  const isCorporate = variant === 'corporate'
  const [isOpen, setIsOpen] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isExpanded, setIsExpanded] = useState(isOpen)
  const menuRef = useRef<HTMLDivElement>(null)
  const signOutLock = useRef(false)
  const toastApi = useOptionalToast()

  const handleToggle = () => setIsOpen((prev) => !prev)
  const handleClose = () => setIsOpen(false)

  const handleSignOut = async (event?: React.SyntheticEvent) => {
    event?.preventDefault()
    event?.stopPropagation()
    if (signOutLock.current) return
    signOutLock.current = true

    // Start the auth call before shedding chrome so a re-render cannot swallow it.
    const signingOut = authClient.signOut()
    beginSignOut()
    handleClose()

    try {
      await signingOut
    } catch {
      endSignOut()
      signOutLock.current = false
      toastApi?.toast.error('Could not sign out. Please try again.', { id: 'sign-out' })
      return
    }

    onNavigate?.('/')
  }

  const signOutButtonProps = {
    type: 'button' as const,
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button > 0) return
      void handleSignOut(event)
    },
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      void handleSignOut(event)
    },
  }

  const handleOpenSettings = () => {
    handleClose()
    onNavigate?.('/settings')
  }

  const handleOpenHome = () => {
    handleClose()
    onNavigate?.('/')
  }

  const handleOpenProfile = () => {
    handleClose()
    if (user.id) {
      onNavigate?.('/profile')
    }
  }

  const displayName = displayNameProp || user.name || user.email?.split('@')[0] || 'Operative'
  const effectiveRole = getEffectiveRole(user, userRole)

  // Handle click outside & keyboard escape to close dropdown.
  // Listen for `click` (not `mousedown`) so Sign Out pointerdown can start
  // first. Attach on the next tick so the opening click cannot dismiss.
  useEffect(() => {
    if (!isOpen) return

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

    const attachId = window.setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(attachId)
      document.removeEventListener('click', handleClickOutside)
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
              name={displayName}
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
                : `grid-rows-[0fr] opacity-0${isOpen ? '' : ' pointer-events-none'}`
            }`}
          >
            <div className="overflow-hidden">
              <div className="pt-2 pb-1 space-y-2">
                {/* Account Actions Section: Settings & Sign Out */}
                {user.id && (
                  <button
                    type="button"
                    onClick={handleOpenProfile}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold font-grotesk tracking-wider transition-all cursor-pointer ${
                      isCorporate
                        ? 'text-sky-700 hover:bg-sky-100 border border-sky-200/80'
                        : 'text-[#00c3ff] hover:bg-cyan-950/40 border border-cyan-900/40'
                    }`}
                  >
                    <User className="w-4 h-4 shrink-0" />
                    <span>YOUR PROFILE</span>
                  </button>
                )}
                {/* Settings Link */}
                <button
                  type="button"
                  onClick={handleOpenSettings}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold font-grotesk tracking-wider transition-all cursor-pointer ${
                    isCorporate
                      ? 'text-sky-700 hover:bg-sky-100 border border-sky-200/80'
                      : 'text-[#00c3ff] hover:bg-cyan-950/40 border border-cyan-900/40'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>SETTINGS</span>
                </button>

                {/* Moltology Home Link */}
                <button
                  type="button"
                  onClick={handleOpenHome}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold font-grotesk tracking-wider transition-all cursor-pointer ${
                    isCorporate
                      ? 'text-sky-700 hover:bg-sky-100 border border-sky-200/80'
                      : 'text-[#00c3ff] hover:bg-cyan-950/40 border border-cyan-900/40'
                  }`}
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>MOLTOLOGY HOME</span>
                </button>

                {/* Sign Out Action Button */}
                <button
                  {...signOutButtonProps}
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
          name={displayName}
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
              ? `opacity-0 scale-95 translate-y-2${isOpen ? '' : ' pointer-events-none'}`
              : `opacity-0 scale-95 -translate-y-2${isOpen ? '' : ' pointer-events-none'}`
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
              name={displayName}
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

          {/* Account Actions Section: Settings & Sign Out */}
          <div className="pt-3 space-y-1.5">
            {user.id && (
              <button
                type="button"
                onClick={handleOpenProfile}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold font-grotesk tracking-wider flex items-center gap-2.5 transition-all group cursor-pointer ${
                  isCorporate
                    ? 'text-sky-700 hover:bg-sky-50 border border-sky-200/80 hover:border-sky-300'
                    : 'text-[#00c3ff] hover:bg-[#00c3ff]/10 border border-cyan-900/40 hover:border-[#00c3ff]/40'
                }`}
              >
                <User
                  className={`w-4 h-4 shrink-0 ${
                    isCorporate ? 'text-sky-600' : 'text-[#00c3ff]'
                  }`}
                />
                <span>YOUR PROFILE</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenSettings}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold font-grotesk tracking-wider flex items-center gap-2.5 transition-all group cursor-pointer ${
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
              <span>SETTINGS</span>
            </button>

            <button
              type="button"
              onClick={handleOpenHome}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold font-grotesk tracking-wider flex items-center gap-2.5 transition-all group cursor-pointer ${
                isCorporate
                  ? 'text-sky-700 hover:bg-sky-50 border border-sky-200/80 hover:border-sky-300'
                  : 'text-[#00c3ff] hover:bg-[#00c3ff]/10 border border-cyan-900/40 hover:border-[#00c3ff]/40'
              }`}
            >
              <Globe
                className={`w-4 h-4 shrink-0 ${
                  isCorporate ? 'text-sky-600' : 'text-[#00c3ff]'
                }`}
              />
              <span>MOLTOLOGY HOME</span>
            </button>

            {/* Sign Out Action Button */}
            <button
              {...signOutButtonProps}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold font-grotesk tracking-wider flex items-center gap-2.5 transition-all group cursor-pointer ${
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
