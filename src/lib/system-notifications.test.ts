import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SYSTEM_NOTIFICATIONS_PREF_KEY,
  disableSystemNotifications,
  enableSystemNotifications,
  getSystemNotificationPermission,
  hasSeenSystemNotificationTag,
  hubUrlForNotificationKind,
  markSystemNotificationTagSeen,
  readSystemNotificationsEnabled,
  shouldShowSystemNotificationNow,
  showSystemNotification,
  writeSystemNotificationsEnabled,
} from './system-notifications'
import { resetPwaSingletonsForTests } from './pwa'

describe('system-notifications', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    resetPwaSingletonsForTests()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetPwaSingletonsForTests()
    vi.unstubAllGlobals()
  })

  it('persists the surface-alert preference', () => {
    expect(readSystemNotificationsEnabled()).toBe(false)
    writeSystemNotificationsEnabled(true)
    expect(localStorage.getItem(SYSTEM_NOTIFICATIONS_PREF_KEY)).toBe('true')
    expect(readSystemNotificationsEnabled()).toBe(true)
    disableSystemNotifications()
    expect(readSystemNotificationsEnabled()).toBe(false)
  })

  it('maps friend kinds to connections', () => {
    expect(hubUrlForNotificationKind('friend_request')).toBe('/connections')
    expect(hubUrlForNotificationKind('friend_accepted')).toBe('/connections')
    expect(hubUrlForNotificationKind('unknown')).toBe('/dashboard')
    expect(hubUrlForNotificationKind('forum_mention')).toBe('/forum')
    expect(
      hubUrlForNotificationKind('forum_mention', {
        categorySlug: 'general-discussion',
        topicSlug: 'molt-notes',
      }),
    ).toBe('/forum/general-discussion/molt-notes')
    expect(
      hubUrlForNotificationKind('forum_reply', {
        categorySlug: 'general-discussion',
        topicSlug: 'molt-notes',
        postId: 'post-reply',
      }),
    ).toBe('/forum/general-discussion/molt-notes#post-post-reply')
  })

  it('tracks seen notification tags in session storage', () => {
    expect(hasSeenSystemNotificationTag('abc')).toBe(false)
    markSystemNotificationTagSeen('abc')
    expect(hasSeenSystemNotificationTag('abc')).toBe(true)
  })

  it('requests permission when enabling and rolls back if denied', async () => {
    const requestPermission = vi.fn().mockResolvedValue('denied')
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission,
    })

    const result = await enableSystemNotifications()
    expect(result).toBe('denied')
    expect(requestPermission).toHaveBeenCalled()
    expect(readSystemNotificationsEnabled()).toBe(false)
  })

  it('keeps preference when permission is granted', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted')
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission,
    })

    const result = await enableSystemNotifications()
    expect(result).toBe('granted')
    expect(readSystemNotificationsEnabled()).toBe(true)
  })

  it('only shows when enabled, granted, and document is hidden (unless forced)', () => {
    writeSystemNotificationsEnabled(true)
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() })
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    expect(shouldShowSystemNotificationNow()).toBe(true)

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    expect(shouldShowSystemNotificationNow()).toBe(false)
    expect(shouldShowSystemNotificationNow(true)).toBe(true)
  })

  it('reports unsupported when Notification is missing', () => {
    vi.stubGlobal('Notification', undefined)
    expect(getSystemNotificationPermission()).toBe('unsupported')
  })

  it('shows via page Notification when SW registration is unavailable', async () => {
    writeSystemNotificationsEnabled(true)
    const notificationInstances: Array<{ onclick: null | (() => void); close: () => void }> = []
    const NotificationMock = vi.fn().mockImplementation(function (this: any) {
      const instance = { onclick: null as null | (() => void), close: vi.fn() }
      notificationInstances.push(instance)
      return instance
    })
    Object.assign(NotificationMock, { permission: 'granted', requestPermission: vi.fn() })
    vi.stubGlobal('Notification', NotificationMock)
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue(null),
        register: vi.fn().mockResolvedValue(null),
      },
    })

    const shown = await showSystemNotification({
      title: 'Friend request',
      body: 'A larva seeks connection.',
      tag: 'test-1',
      url: '/connections',
    })

    expect(shown).toBe(true)
    expect(NotificationMock).toHaveBeenCalledWith(
      'Friend request',
      expect.objectContaining({
        body: 'A larva seeks connection.',
        tag: 'test-1',
      })
    )
    expect(hasSeenSystemNotificationTag('test-1')).toBe(true)

    const again = await showSystemNotification({
      title: 'Friend request',
      body: 'A larva seeks connection.',
      tag: 'test-1',
    })
    expect(again).toBe(false)
  })
})
