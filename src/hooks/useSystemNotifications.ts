import { useCallback, useEffect, useState } from 'react'
import {
  disableSystemNotifications,
  enableSystemNotifications,
  getSystemNotificationPermission,
  isBrowser,
  isSystemNotificationSupported,
  readSystemNotificationsEnabled,
  type SystemNotificationPermission,
  writeSystemNotificationsEnabled,
} from '@/lib/system-notifications'

export type SystemNotificationsState = {
  supported: boolean
  enabled: boolean
  permission: SystemNotificationPermission
  enable: () => Promise<SystemNotificationPermission>
  disable: () => void
  refresh: () => void
}

/**
 * Preference + permission surface for OS alerts.
 * Designed so a later Web Push subscribe step can run inside `enable()` without UX changes.
 */
export function useSystemNotifications(): SystemNotificationsState {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [permission, setPermission] = useState<SystemNotificationPermission>('unsupported')

  const refresh = useCallback(() => {
    if (!isBrowser()) return
    setSupported(isSystemNotificationSupported())
    setEnabled(readSystemNotificationsEnabled())
    setPermission(getSystemNotificationPermission())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const enable = useCallback(async () => {
    const next = await enableSystemNotifications()
    setPermission(next)
    setEnabled(next === 'granted' && readSystemNotificationsEnabled())
    // Future: await subscribeWebPush() here when VAPID + server path land.
    return next
  }, [])

  const disable = useCallback(() => {
    disableSystemNotifications()
    writeSystemNotificationsEnabled(false)
    setEnabled(false)
    setPermission(getSystemNotificationPermission())
  }, [])

  return {
    supported,
    enabled,
    permission,
    enable,
    disable,
    refresh,
  }
}
