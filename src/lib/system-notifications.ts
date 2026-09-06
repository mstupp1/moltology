/**
 * System / browser notification bridge for Command Hub alerts.
 *
 * Phase 1: local OS notifications (tab open / backgrounded) via Notification API
 * or service worker showNotification.
 * Phase 2 (later): Web Push can reuse the same preference key + show payload shape
 * without rewriting permission UX.
 */

import { getHubServiceWorkerRegistration, isBrowser } from '@/lib/pwa'
import { forumMentionHubPath } from '@/lib/forum-mentions'

export const SYSTEM_NOTIFICATIONS_PREF_KEY = 'moltology_system_notifications_enabled'
export const SYSTEM_NOTIFICATION_SEEN_PREFIX = 'molt_sys_notif_seen:'

export type SystemNotificationPermission = NotificationPermission | 'unsupported'

export type SystemNotificationPayload = {
  title: string
  body: string
  tag?: string
  url?: string
  /** When true, show even if the document is focused. Default: only when hidden/blurred. */
  force?: boolean
}

export function getSystemNotificationPermission(): SystemNotificationPermission {
  if (!isBrowser() || typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export function isSystemNotificationSupported(): boolean {
  return getSystemNotificationPermission() !== 'unsupported'
}

export function readSystemNotificationsEnabled(): boolean {
  if (!isBrowser()) return false
  try {
    return localStorage.getItem(SYSTEM_NOTIFICATIONS_PREF_KEY) === 'true'
  } catch {
    return false
  }
}

export function writeSystemNotificationsEnabled(enabled: boolean): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(SYSTEM_NOTIFICATIONS_PREF_KEY, String(enabled))
  } catch {
    // ignore
  }
}

export async function requestSystemNotificationPermission(): Promise<SystemNotificationPermission> {
  if (!isBrowser() || typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const result = await Notification.requestPermission()
    return result
  } catch {
    return Notification.permission
  }
}

/**
 * Enable surface alerts: persist preference and request permission on user gesture.
 * Returns the resulting permission after the attempt.
 */
export async function enableSystemNotifications(): Promise<SystemNotificationPermission> {
  writeSystemNotificationsEnabled(true)
  const permission = await requestSystemNotificationPermission()
  if (permission !== 'granted') {
    writeSystemNotificationsEnabled(false)
  }
  return permission
}

export function disableSystemNotifications(): void {
  writeSystemNotificationsEnabled(false)
}

export function shouldShowSystemNotificationNow(force = false): boolean {
  if (!isBrowser()) return false
  if (!readSystemNotificationsEnabled()) return false
  if (getSystemNotificationPermission() !== 'granted') return false
  if (force) return true
  return Boolean(document.hidden)
}

export function hasSeenSystemNotificationTag(tag: string): boolean {
  if (!isBrowser() || !tag) return false
  try {
    return sessionStorage.getItem(`${SYSTEM_NOTIFICATION_SEEN_PREFIX}${tag}`) === '1'
  } catch {
    return false
  }
}

export function markSystemNotificationTagSeen(tag: string): void {
  if (!isBrowser() || !tag) return
  try {
    sessionStorage.setItem(`${SYSTEM_NOTIFICATION_SEEN_PREFIX}${tag}`, '1')
  } catch {
    // ignore
  }
}

export async function showSystemNotification(
  payload: SystemNotificationPayload
): Promise<boolean> {
  if (!shouldShowSystemNotificationNow(payload.force)) return false

  const tag = payload.tag || `moltology-${Date.now()}`
  if (hasSeenSystemNotificationTag(tag)) return false

  const options: NotificationOptions = {
    body: payload.body,
    tag,
    icon: '/images/pwa/icon-192.png',
    badge: '/images/pwa/icon-192.png',
    data: { url: payload.url || '/dashboard' },
  }

  try {
    const registration = await getHubServiceWorkerRegistration()
    if (registration?.showNotification) {
      await registration.showNotification(payload.title, options)
      markSystemNotificationTagSeen(tag)
      return true
    }
  } catch {
    // fall through to page Notification
  }

  try {
    const notification = new Notification(payload.title, options)
    notification.onclick = () => {
      try {
        window.focus()
        const url = payload.url || '/dashboard'
        if (url && window.location.pathname !== url) {
          window.location.assign(url)
        }
      } catch {
        // ignore
      }
      notification.close()
    }
    markSystemNotificationTagSeen(tag)
    return true
  } catch {
    return false
  }
}

/** Map Activity Center kinds to a deep-link inside the hub. */
export function hubUrlForNotificationKind(
  kind: string,
  payload?: { categorySlug?: string; topicSlug?: string },
): string {
  switch (kind) {
    case 'friend_request':
    case 'friend_accepted':
    case 'friend_rejected':
      return '/connections'
    case 'forum_mention':
    case 'forum_reply':
      return forumMentionHubPath(payload ?? {})
    default:
      return '/dashboard'
  }
}
