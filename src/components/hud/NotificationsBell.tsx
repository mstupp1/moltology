import React, { useEffect, useRef, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { HudBottomSheet } from '@/components/ui'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuthSession } from '@/hooks/useAuthSession'
import { resolveMemberPublicParam } from '@/lib/member-handle'
import { isForumInboxKind } from '@/lib/notifications'
import { forumPostAnchorId } from '@/lib/forum-mentions'

export interface NotificationsBellProps {
  /** `sidebar`: desktop sidebar footer row. `header`: phone top bar icon button. */
  variant: 'sidebar' | 'header'
  /** `sidebar` variant only: render as a collapsed-rail cell. */
  collapsed?: boolean
  className?: string
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
const sectionLabel = 'text-[11px] font-bold tracking-[0.08em] uppercase text-ink-muted'
const listFrame = 'rounded-control border border-line-subtle divide-y divide-line-subtle overflow-hidden'
const countBadge =
  'min-w-[18px] h-[18px] px-1 rounded-chip bg-crimson-aggro text-abyss text-[11px] font-bold leading-[18px] text-center tabular-nums'

/**
 * Friend requests, forum replies and mentions. The inbox reads on load and on tab
 * focus (see useNotifications); opening the panel asks for a fresh read too.
 */
export const NotificationsBell: React.FC<NotificationsBellProps> = ({ variant, collapsed = false, className = '' }) => {
  const session = useAuthSession()
  const {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markRead,
    markAllRead,
    acceptFriendRequest,
    declineFriendRequest,
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileScreen, setIsMobileScreen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const islandRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => setIsMobileScreen(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Desktop panel closes on outside click and Escape; the phone sheet handles its own.
  useEffect(() => {
    if (!isOpen || isMobileScreen) return
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!panelRef.current?.contains(target) && !islandRef.current?.contains(target)) setIsOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, isMobileScreen])

  if (!session.user) return null

  const toggle = () => {
    setIsOpen((prev) => {
      if (!prev) void refresh({ force: true })
      return !prev
    })
  }
  const close = () => setIsOpen(false)

  const actionable = notifications.filter((n) => n.actionable)
  const recent = notifications.filter((n) => !n.actionable)
  const countLabel = unreadCount > 0 ? `Notifications, ${unreadCount} new` : 'Notifications'

  const renderRow = (title: React.ReactNode, detail: React.ReactNode, unread: boolean) => (
    <div className="flex items-start gap-2.5 min-w-0">
      <span
        aria-hidden="true"
        className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${unread ? 'bg-cyan-glow' : 'bg-surface-3'}`}
      />
      <span className="min-w-0 flex-1 space-y-0.5">
        {title && <span className="block text-xs font-bold text-ink">{title}</span>}
        {detail && <span className="block text-xs text-ink-body leading-snug">{detail}</span>}
      </span>
    </div>
  )

  const renderPanel = () => (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="font-grotesk text-sm font-bold text-ink tracking-[0.08em] uppercase">Notifications</span>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                void markAllRead()
              }}
              className={`min-h-8 px-1.5 rounded-control text-[11px] font-bold text-ink-muted hover:text-ink transition-colors ${focusRing}`}
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              close()
            }}
            aria-label="Close notifications"
            className={`-mr-1 p-1.5 rounded-control text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors ${focusRing}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {notifications.length === 0 &&
        (isLoading ? (
          <div className="space-y-2 py-2" aria-hidden>
            <div className="h-3 w-3/4 rounded-chip bg-surface-3 animate-pulse" />
            <div className="h-3 w-1/2 rounded-chip bg-surface-3 animate-pulse" />
          </div>
        ) : (
          <div className="py-6 text-center space-y-1">
            <Bell className="w-5 h-5 text-ink-muted mx-auto" aria-hidden="true" />
            <div className="text-sm font-bold text-ink">Nothing new</div>
            <div className="text-xs text-ink-muted">Friend requests, replies, and mentions show up here.</div>
          </div>
        ))}

      {actionable.length > 0 && (
        <section className="space-y-1.5">
          <h3 className={sectionLabel}>Needs you</h3>
          <ul className={`${listFrame} max-h-60 overflow-y-auto`}>
            {actionable.map((n) => (
              <li key={n.id} className="p-3 space-y-2">
                {renderRow(n.title, n.detail, !n.readAt)}
                <div className="flex flex-wrap gap-1.5 pl-4">
                  {n.payload.requestId && (
                    <>
                      <button
                        type="button"
                        className={`min-h-8 px-2.5 text-[11px] font-bold rounded-control bg-cyan-glow hover:bg-cyan-hover text-abyss transition-colors ${focusRing}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          void acceptFriendRequest(n.payload.requestId!, n.id)
                        }}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className={`min-h-8 px-2.5 text-[11px] font-bold rounded-control border border-line text-ink-muted hover:text-ink hover:border-line-strong transition-colors ${focusRing}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          void declineFriendRequest(n.payload.requestId!, n.id)
                        }}
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {n.payload.profileId && (
                    <Link
                      to="/member/$profileId"
                      params={{
                        profileId: resolveMemberPublicParam({ id: n.payload.profileId, handle: n.actorHandle }),
                      }}
                      className={`min-h-8 inline-flex items-center px-2.5 text-[11px] font-bold rounded-control border border-line text-ink-muted hover:text-ink hover:border-line-strong transition-colors ${focusRing}`}
                      onClick={close}
                    >
                      View profile
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section className="space-y-1.5">
          <h3 className={sectionLabel}>Recent</h3>
          <ul className={`${listFrame} max-h-72 overflow-y-auto`}>
            {recent.map((n) => {
              const rowClass = `block w-full text-left px-3 py-2.5 hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
                n.readAt ? 'opacity-75' : ''
              }`
              const body = renderRow(n.title, n.detail, !n.readAt)
              const markAndClose = (e: React.MouseEvent) => {
                e.stopPropagation()
                if (!n.readAt) void markRead(n.id)
                close()
              }
              if (isForumInboxKind(n.kind)) {
                const categorySlug = n.payload.categorySlug?.trim()
                const topicSlug = n.payload.topicSlug?.trim()
                const postId = n.payload.postId?.trim()
                return (
                  <li key={n.id}>
                    {categorySlug && topicSlug ? (
                      <Link
                        to="/forum/$categorySlug/$topicSlug"
                        params={{ categorySlug, topicSlug }}
                        hash={postId ? forumPostAnchorId(postId) : undefined}
                        className={rowClass}
                        onClick={markAndClose}
                      >
                        {body}
                      </Link>
                    ) : (
                      <Link to="/forum" className={rowClass} onClick={markAndClose}>
                        {body}
                      </Link>
                    )}
                  </li>
                )
              }
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    className={rowClass}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!n.readAt) void markRead(n.id)
                    }}
                  >
                    {body}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )

  const phoneSheet = mounted ? (
    <HudBottomSheet isOpen={isOpen && isMobileScreen} onClose={close} title="Notifications" className="p-4 space-y-3">
      <div data-testid="notifications-panel" className="space-y-3">
        {renderPanel()}
      </div>
    </HudBottomSheet>
  ) : null

  if (variant === 'sidebar') {
    return (
      <div className={`relative overflow-visible ${className}`} ref={islandRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggle()
          }}
          title="Friend requests, replies and mentions"
          aria-label={countLabel}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className={`w-full text-left relative flex transition-colors duration-150 group/bell cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow ${
            isOpen ? 'bg-surface-2' : 'bg-surface-1 hover:bg-surface-2'
          } ${collapsed ? 'flex-col items-center justify-center py-2 px-1 gap-1' : 'items-center min-h-[44px] px-4 py-2.5 pl-5 gap-3'}`}
        >
          {collapsed ? (
            <span className="relative inline-flex py-1">
              <Bell
                className={`w-4 h-4 ${isOpen ? 'text-cyan-glow' : 'text-ink-muted group-hover/bell:text-ink'}`}
                aria-hidden="true"
              />
              {unreadCount > 0 && (
                <span className={`absolute -top-2 -right-3 ${countBadge}`} aria-hidden>
                  {unreadCount}
                </span>
              )}
            </span>
          ) : (
            <>
              <Bell
                className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                  isOpen ? 'text-cyan-glow' : 'text-ink-muted group-hover/bell:text-ink'
                }`}
                aria-hidden="true"
              />
              <span className="flex-1 min-w-0 text-xs md:text-[12.5px] font-sans font-medium tracking-wide uppercase text-ink-body group-hover/bell:text-ink">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className={countBadge} aria-hidden>
                  {unreadCount}
                </span>
              )}
            </>
          )}
        </button>

        {isOpen && !isMobileScreen && (
          <div
            ref={panelRef}
            data-testid="notifications-panel"
            className="absolute left-full bottom-0 ml-2 w-96 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-card border border-line bg-surface-1 shadow-menu p-4 z-[200] font-sans space-y-3 animate-in fade-in slide-in-from-left-2 duration-150"
          >
            {renderPanel()}
          </div>
        )}
        {phoneSheet}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={islandRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggle()
        }}
        title="Friend requests, replies and mentions"
        aria-label={countLabel}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`relative w-9 h-9 flex items-center justify-center rounded-control border transition-colors active:scale-95 touch-manipulation shrink-0 ${focusRing} ${
          isOpen
            ? 'bg-surface-3 shadow-nav-current border-transparent text-cyan-glow'
            : 'bg-surface-1 border-line hover:bg-surface-2 hover:border-line-strong text-cyan-glow'
        }`}
      >
        <Bell className="w-4 h-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className={`absolute -top-1.5 -right-1.5 ${countBadge}`} aria-hidden>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && !isMobileScreen && (
        <div
          ref={panelRef}
          data-testid="notifications-panel"
          className="absolute top-full right-0 mt-2 w-96 rounded-card border border-line bg-surface-1 shadow-menu p-4 z-50 font-sans space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {renderPanel()}
        </div>
      )}
      {phoneSheet}
    </div>
  )
}
