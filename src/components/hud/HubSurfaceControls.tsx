import { useCallback } from 'react'
import { BellRing, Download, MonitorSmartphone } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { useSystemNotifications } from '@/hooks/useSystemNotifications'
import { HudButton } from '@/components/ui/HudButton'
import { HudSwitch } from '@/components/ui/HudSwitch'
import { SettingsRow } from '@/components/hud/settings/settings-ui'

/**
 * Device notification + install rows for the Settings Notifications card.
 * Renders SettingsRow items; the parent wraps them in SettingsRows.
 */
export function HubSurfaceControls() {
  const { isStandalone, canPromptInstall, install } = usePwaInstall()
  const { supported, enabled, permission, enable, disable } = useSystemNotifications()
  const { toast } = useToast()

  const handleToggleAlerts = useCallback(async () => {
    if (enabled) {
      disable()
      toast.info('Notifications disabled.')
      return
    }
    const next = await enable()
    if (next === 'granted') {
      toast.success('Notifications enabled.')
    } else if (next === 'denied') {
      toast.error('Notifications blocked by browser or system settings.')
    } else if (next === 'unsupported') {
      toast.error('This browser or device does not support notifications.')
    } else {
      toast.info('Notification permission required.')
    }
  }, [disable, enable, enabled, toast])

  const handleInstall = useCallback(async () => {
    const outcome = await install()
    if (outcome === 'accepted') {
      toast.success('App installed.')
    } else if (outcome === 'unavailable') {
      toast.info(
        isStandalone
          ? 'The app is already installed on this device.'
          : 'Use your browser install menu if the prompt is hidden.'
      )
    }
  }, [install, isStandalone, toast])

  const alertStatus =
    !supported
      ? 'Unavailable on this device'
      : permission === 'denied'
        ? 'Blocked in browser settings'
        : enabled
          ? 'Enabled'
          : 'Disabled'

  return (
    <>
      <SettingsRow
        icon={<BellRing />}
        label="Device notifications"
        status={alertStatus}
        control={
          <HudSwitch
            checked={enabled}
            onChange={() => void handleToggleAlerts()}
            disabled={!supported || permission === 'denied'}
            aria-label="Toggle device notifications"
          />
        }
      />
      <SettingsRow
        icon={isStandalone ? <MonitorSmartphone /> : <Download />}
        label={isStandalone ? 'App installed' : 'Install the app'}
        status={
          isStandalone
            ? 'Running as an app on this device'
            : canPromptInstall
              ? 'Add Moltology to your home screen or desktop'
              : 'Available when your browser offers install'
        }
        control={
          isStandalone ? null : (
            <HudButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void handleInstall()}
              disabled={!canPromptInstall}
            >
              Install
            </HudButton>
          )
        }
      />
    </>
  )
}
